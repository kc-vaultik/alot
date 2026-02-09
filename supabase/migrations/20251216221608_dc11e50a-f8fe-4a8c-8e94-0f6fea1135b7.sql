-- Create category pool balances table (one pool per category)
CREATE TABLE public.category_pool_balances (
  category public.product_category NOT NULL PRIMARY KEY,
  balance_usd NUMERIC(12,4) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.category_pool_balances ENABLE ROW LEVEL SECURITY;

-- Admin-only access (same pattern as bucket_balances)
CREATE POLICY "Only admins can read category pool balances"
ON public.category_pool_balances FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Only admins can modify category pool balances"
ON public.category_pool_balances FOR ALL
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Initialize balances for all categories
INSERT INTO public.category_pool_balances (category, balance_usd) VALUES
  ('POKEMON', 0),
  ('SNEAKERS', 0),
  ('WATCHES', 0),
  ('HANDBAGS', 0),
  ('WINE', 0),
  ('CLOTHING', 0),
  ('JEWELLERY', 0),
  ('ART_TOYS', 0),
  ('SPORT_MEMORABILIA', 0);

-- Add category-specific pricing (clear existing and add new)
DELETE FROM public.category_pricing;

INSERT INTO public.category_pricing (category, tier, price_cents, display_name, description, is_active) VALUES
  -- Handbags: Premium pricing
  ('HANDBAGS', 'T5', 1000, 'Handbags Starter', 'Gucci, Prada tier cards', true),
  ('HANDBAGS', 'T10', 2000, 'Handbags Premium', 'YSL, Louis Vuitton tier cards', true),
  ('HANDBAGS', 'T20', 3500, 'Handbags Elite', 'Chanel, Hermès tier cards', true),
  
  -- Watches: Highest pricing
  ('WATCHES', 'T5', 1500, 'Watches Starter', 'Seiko, Tissot tier cards', true),
  ('WATCHES', 'T10', 2500, 'Watches Premium', 'Rolex, Omega tier cards', true),
  ('WATCHES', 'T20', 4500, 'Watches Elite', 'AP, Patek tier cards', true),
  
  -- Sneakers: Mid pricing
  ('SNEAKERS', 'T5', 800, 'Sneakers Starter', 'Nike, Adidas tier cards', true),
  ('SNEAKERS', 'T10', 1500, 'Sneakers Premium', 'Jordan, Dunks tier cards', true),
  ('SNEAKERS', 'T20', 2500, 'Sneakers Elite', 'Dior J1, Trophy Room tier cards', true),
  
  -- Pokemon/Trading Cards: Entry pricing
  ('POKEMON', 'T5', 500, 'Cards Starter', 'Base set tier cards', true),
  ('POKEMON', 'T10', 1000, 'Cards Premium', 'Holo, rare tier cards', true),
  ('POKEMON', 'T20', 2000, 'Cards Elite', '1st Edition, PSA graded tier cards', true),
  
  -- Wine: Premium pricing
  ('WINE', 'T5', 1200, 'Wine Starter', 'Entry wines tier cards', true),
  ('WINE', 'T10', 2000, 'Wine Premium', 'Reserve wines tier cards', true),
  ('WINE', 'T20', 3500, 'Wine Elite', 'Grand Cru tier cards', true),
  
  -- Clothing: Mid pricing
  ('CLOTHING', 'T5', 800, 'Clothing Starter', 'Chrome Hearts tier cards', true),
  ('CLOTHING', 'T10', 1500, 'Clothing Premium', 'Off-White tier cards', true),
  ('CLOTHING', 'T20', 2500, 'Clothing Elite', 'Archive pieces tier cards', true),
  
  -- Jewellery: Premium pricing
  ('JEWELLERY', 'T5', 1000, 'Jewellery Starter', 'Silver tier cards', true),
  ('JEWELLERY', 'T10', 2000, 'Jewellery Premium', 'Gold tier cards', true),
  ('JEWELLERY', 'T20', 4000, 'Jewellery Elite', 'Diamond, Cartier tier cards', true),
  
  -- Art & Toys: Mid pricing
  ('ART_TOYS', 'T5', 1000, 'Art & Toys Starter', 'Pop Mart tier cards', true),
  ('ART_TOYS', 'T10', 1800, 'Art & Toys Premium', 'KAWS tier cards', true),
  ('ART_TOYS', 'T20', 3000, 'Art & Toys Elite', 'Bearbrick, Murakami tier cards', true),
  
  -- Sport Memorabilia: Mid pricing
  ('SPORT_MEMORABILIA', 'T5', 800, 'Sports Starter', 'Jerseys tier cards', true),
  ('SPORT_MEMORABILIA', 'T10', 1500, 'Sports Premium', 'Signed items tier cards', true),
  ('SPORT_MEMORABILIA', 'T20', 3000, 'Sports Elite', 'Game-worn, championship tier cards', true);

-- Create category pool ledger for tracking
CREATE TABLE public.category_pool_ledger (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category public.product_category NOT NULL,
  event_type public.pool_event NOT NULL,
  amount_usd NUMERIC(12,4) NOT NULL,
  ref_type TEXT NOT NULL,
  ref_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on ledger
ALTER TABLE public.category_pool_ledger ENABLE ROW LEVEL SECURITY;

-- Admin-only access to ledger
CREATE POLICY "Only admins can read category pool ledger"
ON public.category_pool_ledger FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Create the category pack purchase RPC
CREATE OR REPLACE FUNCTION public.process_category_pack_purchase(
  p_user_id uuid,
  p_stripe_session_id text,
  p_stripe_payment_intent_id text,
  p_category text,
  p_tier text,
  p_quantity integer,
  p_unit_price_cents integer,
  p_total_cents integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_category public.product_category;
  v_tier public.pricing_tier;
  v_unit_price_usd NUMERIC(10,2);
  v_total_price_usd NUMERIC(10,2);
  v_net_per_card NUMERIC(10,4);
  v_pool_per_card NUMERIC(10,4);
  v_total_pool NUMERIC(10,4);
  v_purchase_id UUID;
  v_reveals JSONB := '[]'::JSONB;
  v_reveal JSONB;
  v_i INT;
  v_random NUMERIC;
  v_band public.rarity_band;
  v_product RECORD;
  v_credits INT;
  v_product_credits INT;
  v_universal_credits INT;
  v_is_golden BOOLEAN;
  v_is_award BOOLEAN := false;
  v_award_id UUID;
  v_pool_balance NUMERIC;
  v_attempt_rate NUMERIC;
  v_reveal_id UUID;
  v_serial TEXT;
  v_existing_purchase UUID;
BEGIN
  -- Cast category and tier
  v_category := p_category::public.product_category;
  v_tier := p_tier::public.pricing_tier;
  
  -- Convert cents to USD
  v_unit_price_usd := p_unit_price_cents / 100.0;
  v_total_price_usd := p_total_cents / 100.0;
  
  -- Check idempotency
  SELECT id INTO v_existing_purchase
  FROM public.purchases
  WHERE stripe_session_id = p_stripe_session_id;
  
  IF v_existing_purchase IS NOT NULL THEN
    SELECT jsonb_agg(jsonb_build_object(
      'id', r.id,
      'product_class_id', r.product_class_id,
      'band', r.band,
      'is_golden', r.is_golden,
      'is_award', r.is_award,
      'serial_number', r.serial_number,
      'credits_awarded', r.credits_awarded,
      'product', jsonb_build_object(
        'id', pc.id,
        'name', pc.name,
        'brand', pc.brand,
        'model', pc.model,
        'category', pc.category,
        'retail_value_usd', pc.retail_value_usd,
        'image_url', pc.image_url
      )
    ))
    INTO v_reveals
    FROM public.reveals r
    JOIN public.product_classes pc ON pc.id = r.product_class_id
    WHERE r.purchase_id = v_existing_purchase;
    
    RETURN jsonb_build_object('purchase_id', v_existing_purchase, 'reveals', COALESCE(v_reveals, '[]'::JSONB), 'already_processed', true);
  END IF;
  
  -- Calculate economics per card
  v_net_per_card := v_unit_price_usd - (v_unit_price_usd * 0.029) - (0.30 / p_quantity) - 0.30;
  v_pool_per_card := v_net_per_card * 0.35;
  v_total_pool := v_pool_per_card * p_quantity;
  
  -- Insert purchase record
  INSERT INTO public.purchases (
    user_id, stripe_session_id, stripe_payment_intent_id, tier,
    quantity, unit_price_usd, total_price_usd, stripe_amount_total_cents,
    net_revenue_usd, pool_contribution_usd
  ) VALUES (
    p_user_id, p_stripe_session_id, p_stripe_payment_intent_id, v_tier,
    p_quantity, v_unit_price_usd, v_total_price_usd, p_total_cents,
    v_net_per_card * p_quantity, v_total_pool
  ) RETURNING id INTO v_purchase_id;
  
  -- Add to category pool (lock row first)
  UPDATE public.category_pool_balances
  SET balance_usd = balance_usd + v_total_pool, updated_at = now()
  WHERE category = v_category;
  
  -- Log to category ledger
  INSERT INTO public.category_pool_ledger (category, event_type, amount_usd, ref_type, ref_id)
  VALUES (v_category, 'ADD', v_total_pool, 'purchase', v_purchase_id::TEXT);
  
  -- Process each card
  FOR v_i IN 1..p_quantity LOOP
    v_is_award := false;
    v_award_id := NULL;
    
    -- Band selection (weighted by tier)
    v_random := random();
    
    v_band := CASE v_tier
      WHEN 'T5' THEN 
        CASE 
          WHEN v_random < 0.93 THEN 'ICON'::public.rarity_band
          WHEN v_random < 0.99 THEN 'RARE'::public.rarity_band
          WHEN v_random < 0.999 THEN 'GRAIL'::public.rarity_band
          ELSE 'MYTHIC'::public.rarity_band
        END
      WHEN 'T10' THEN 
        CASE 
          WHEN v_random < 0.85 THEN 'ICON'::public.rarity_band
          WHEN v_random < 0.97 THEN 'RARE'::public.rarity_band
          WHEN v_random < 0.995 THEN 'GRAIL'::public.rarity_band
          ELSE 'MYTHIC'::public.rarity_band
        END
      WHEN 'T20' THEN 
        CASE 
          WHEN v_random < 0.75 THEN 'ICON'::public.rarity_band
          WHEN v_random < 0.93 THEN 'RARE'::public.rarity_band
          WHEN v_random < 0.99 THEN 'GRAIL'::public.rarity_band
          ELSE 'MYTHIC'::public.rarity_band
        END
    END;
    
    -- Select product from matching category AND band
    SELECT * INTO v_product
    FROM public.product_classes pc
    WHERE pc.category = v_category
      AND pc.band = v_band
      AND pc.is_active = true
    ORDER BY random()
    LIMIT 1;
    
    -- Fallback within same category to lower bands
    IF v_product IS NULL AND v_band = 'MYTHIC' THEN
      SELECT * INTO v_product FROM public.product_classes pc
      WHERE pc.category = v_category AND pc.band = 'GRAIL' AND pc.is_active = true
      ORDER BY random() LIMIT 1;
    END IF;
    
    IF v_product IS NULL AND v_band IN ('MYTHIC', 'GRAIL') THEN
      SELECT * INTO v_product FROM public.product_classes pc
      WHERE pc.category = v_category AND pc.band = 'RARE' AND pc.is_active = true
      ORDER BY random() LIMIT 1;
    END IF;
    
    IF v_product IS NULL THEN
      SELECT * INTO v_product FROM public.product_classes pc
      WHERE pc.category = v_category AND pc.band = 'ICON' AND pc.is_active = true
      ORDER BY random() LIMIT 1;
    END IF;
    
    -- Final fallback: any product in category
    IF v_product IS NULL THEN
      SELECT * INTO v_product FROM public.product_classes pc
      WHERE pc.category = v_category AND pc.is_active = true
      ORDER BY random() LIMIT 1;
    END IF;
    
    -- If still no product, error
    IF v_product IS NULL THEN
      RAISE EXCEPTION 'No products available for category %', v_category;
    END IF;
    
    -- Calculate credits
    v_credits := FLOOR(v_pool_per_card / 0.01);
    
    v_product_credits := CASE v_band
      WHEN 'ICON' THEN FLOOR(v_credits * 0.70)
      WHEN 'RARE' THEN FLOOR(v_credits * 0.80)
      WHEN 'GRAIL' THEN FLOOR(v_credits * 0.90)
      WHEN 'MYTHIC' THEN FLOOR(v_credits * 0.95)
    END;
    v_universal_credits := v_credits - v_product_credits;
    
    -- Golden card check
    v_is_golden := CASE v_tier
      WHEN 'T5' THEN random() < 0.0001
      WHEN 'T10' THEN random() < 0.0002
      WHEN 'T20' THEN random() < 0.0005
    END;
    
    IF v_is_golden THEN
      v_product_credits := FLOOR(v_product.expected_fulfillment_cost_usd * 100);
      v_is_award := true;
    END IF;
    
    -- Award attempt from category pool
    IF NOT v_is_golden THEN
      v_attempt_rate := CASE v_tier
        WHEN 'T5' THEN 0.001
        WHEN 'T10' THEN 0.002
        WHEN 'T20' THEN 0.005
      END;
      
      IF random() < v_attempt_rate THEN
        SELECT balance_usd INTO v_pool_balance
        FROM public.category_pool_balances
        WHERE category = v_category
        FOR UPDATE;
        
        IF v_pool_balance >= v_product.expected_fulfillment_cost_usd THEN
          UPDATE public.category_pool_balances
          SET balance_usd = balance_usd - v_product.expected_fulfillment_cost_usd, updated_at = now()
          WHERE category = v_category;
          
          INSERT INTO public.awards (user_id, product_class_id, bucket, reserved_cost_usd, status)
          VALUES (p_user_id, v_product.id, v_product.bucket, v_product.expected_fulfillment_cost_usd, 'RESERVED')
          RETURNING id INTO v_award_id;
          
          INSERT INTO public.category_pool_ledger (category, event_type, amount_usd, ref_type, ref_id)
          VALUES (v_category, 'RESERVE', v_product.expected_fulfillment_cost_usd, 'award', v_award_id::TEXT);
          
          v_is_award := true;
        ELSE
          v_credits := FLOOR(v_credits * 1.12);
          v_product_credits := FLOOR(v_product_credits * 1.12);
        END IF;
      END IF;
    END IF;
    
    -- Generate serial
    v_serial := LPAD((FLOOR(random() * 10000)::INT)::TEXT, 4, '0') || '/' || '10000';
    
    -- Insert reveal
    INSERT INTO public.reveals (
      purchase_id, user_id, product_class_id, band, is_golden,
      credits_awarded, product_credits_awarded, universal_credits_awarded,
      is_award, award_id, serial_number
    ) VALUES (
      v_purchase_id, p_user_id, v_product.id, v_band, v_is_golden,
      v_credits, v_product_credits, v_universal_credits,
      v_is_award, v_award_id, v_serial
    ) RETURNING id INTO v_reveal_id;
    
    IF v_award_id IS NOT NULL THEN
      UPDATE public.awards SET reveal_id = v_reveal_id WHERE id = v_award_id;
    END IF;
    
    -- Upsert credits
    INSERT INTO public.user_product_credits (user_id, product_class_id, credits)
    VALUES (p_user_id, v_product.id, v_product_credits)
    ON CONFLICT (user_id, product_class_id)
    DO UPDATE SET credits = public.user_product_credits.credits + v_product_credits, updated_at = now();
    
    INSERT INTO public.user_universal_credits (user_id, credits)
    VALUES (p_user_id, v_universal_credits)
    ON CONFLICT (user_id)
    DO UPDATE SET credits = public.user_universal_credits.credits + v_universal_credits, updated_at = now();
    
    v_reveal := jsonb_build_object(
      'id', v_reveal_id,
      'product_class_id', v_product.id,
      'band', v_band,
      'is_golden', v_is_golden,
      'is_award', v_is_award,
      'serial_number', v_serial,
      'credits_awarded', v_credits,
      'product_credits_awarded', v_product_credits,
      'universal_credits_awarded', v_universal_credits,
      'product', jsonb_build_object(
        'id', v_product.id,
        'name', v_product.name,
        'brand', v_product.brand,
        'model', v_product.model,
        'category', v_product.category,
        'retail_value_usd', v_product.retail_value_usd,
        'image_url', v_product.image_url
      )
    );
    
    v_reveals := v_reveals || v_reveal;
  END LOOP;
  
  RETURN jsonb_build_object('purchase_id', v_purchase_id, 'reveals', v_reveals, 'already_processed', false);
END;
$$;