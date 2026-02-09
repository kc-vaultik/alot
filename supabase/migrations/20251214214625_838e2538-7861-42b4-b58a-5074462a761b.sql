-- Phase 3: Modify process_mystery_card_purchase to add promo skim logic
CREATE OR REPLACE FUNCTION public.process_mystery_card_purchase(p_user_id uuid, p_stripe_session_id text, p_stripe_payment_intent_id text, p_tier text, p_quantity integer, p_unit_price_cents integer, p_total_cents integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
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
  v_bucket_balance NUMERIC;
  v_attempt_rate NUMERIC;
  v_reveal_id UUID;
  v_serial TEXT;
  v_existing_purchase UUID;
  -- Promo pool variables
  v_config JSONB;
  v_promo_skim_pct NUMERIC;
  v_promo_add NUMERIC;
  v_pool_remaining NUMERIC;
  v_tmp NUMERIC;
BEGIN
  -- Cast tier
  v_tier := p_tier::public.pricing_tier;
  
  -- Convert cents to USD
  v_unit_price_usd := p_unit_price_cents / 100.0;
  v_total_price_usd := p_total_cents / 100.0;
  
  -- Check idempotency: if purchase already exists, return existing reveals
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
  -- Net = price - 2.9% - ($0.30/quantity) - $0.30 ops
  v_net_per_card := v_unit_price_usd - (v_unit_price_usd * 0.029) - (0.30 / p_quantity) - 0.30;
  v_pool_per_card := v_net_per_card * 0.35;
  v_total_pool := v_pool_per_card * p_quantity;
  
  -- Load economy config for promo settings
  SELECT config INTO v_config FROM public.economy_configs WHERE is_active = true LIMIT 1;
  
  -- Calculate promo skim (carved from the 35% pool)
  v_promo_skim_pct := COALESCE((v_config->'promoPool'->>'skimPctOfPoolAdd')::NUMERIC, 0);
  v_promo_add := ROUND(v_total_pool * v_promo_skim_pct, 4);
  v_pool_remaining := v_total_pool - v_promo_add;
  
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
  
  -- Add to promo bucket with row lock (if promo skim is enabled)
  IF v_promo_add > 0 THEN
    SELECT balance_usd INTO v_tmp
    FROM public.bucket_balances WHERE bucket = 'promo' FOR UPDATE;
    
    UPDATE public.bucket_balances
    SET balance_usd = balance_usd + v_promo_add, updated_at = now()
    WHERE bucket = 'promo';
    
    INSERT INTO public.pool_ledger(event_type, bucket, amount_usd, ref_type, ref_id)
    VALUES ('ADD', 'promo', v_promo_add, 'purchase', v_purchase_id::TEXT);
  END IF;
  
  -- Allocate remaining pool to buckets (percentages: micro 10%, mid 35%, services 20%, jackpot 12%, superJackpot 3%, reserve 20%)
  -- Lock and update each bucket individually, using v_pool_remaining instead of v_total_pool
  
  -- microWins: 10%
  UPDATE public.bucket_balances 
  SET balance_usd = balance_usd + (v_pool_remaining * 0.10), updated_at = now()
  WHERE bucket = 'microWins';
  
  INSERT INTO public.pool_ledger (event_type, bucket, amount_usd, ref_type, ref_id)
  VALUES ('ADD', 'microWins', v_pool_remaining * 0.10, 'purchase', v_purchase_id::TEXT);
  
  -- midWins: 35%
  UPDATE public.bucket_balances 
  SET balance_usd = balance_usd + (v_pool_remaining * 0.35), updated_at = now()
  WHERE bucket = 'midWins';
  
  INSERT INTO public.pool_ledger (event_type, bucket, amount_usd, ref_type, ref_id)
  VALUES ('ADD', 'midWins', v_pool_remaining * 0.35, 'purchase', v_purchase_id::TEXT);
  
  -- services: 20%
  UPDATE public.bucket_balances 
  SET balance_usd = balance_usd + (v_pool_remaining * 0.20), updated_at = now()
  WHERE bucket = 'services';
  
  INSERT INTO public.pool_ledger (event_type, bucket, amount_usd, ref_type, ref_id)
  VALUES ('ADD', 'services', v_pool_remaining * 0.20, 'purchase', v_purchase_id::TEXT);
  
  -- jackpot: 12%
  UPDATE public.bucket_balances 
  SET balance_usd = balance_usd + (v_pool_remaining * 0.12), updated_at = now()
  WHERE bucket = 'jackpot';
  
  INSERT INTO public.pool_ledger (event_type, bucket, amount_usd, ref_type, ref_id)
  VALUES ('ADD', 'jackpot', v_pool_remaining * 0.12, 'purchase', v_purchase_id::TEXT);
  
  -- superJackpot: 3%
  UPDATE public.bucket_balances 
  SET balance_usd = balance_usd + (v_pool_remaining * 0.03), updated_at = now()
  WHERE bucket = 'superJackpot';
  
  INSERT INTO public.pool_ledger (event_type, bucket, amount_usd, ref_type, ref_id)
  VALUES ('ADD', 'superJackpot', v_pool_remaining * 0.03, 'purchase', v_purchase_id::TEXT);
  
  -- reserve: 20%
  UPDATE public.bucket_balances 
  SET balance_usd = balance_usd + (v_pool_remaining * 0.20), updated_at = now()
  WHERE bucket = 'reserve';
  
  INSERT INTO public.pool_ledger (event_type, bucket, amount_usd, ref_type, ref_id)
  VALUES ('ADD', 'reserve', v_pool_remaining * 0.20, 'purchase', v_purchase_id::TEXT);
  
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
    
    -- Select product from matching band (inventory-aware with fallback)
    SELECT * INTO v_product
    FROM public.product_classes pc
    WHERE pc.band = v_band
      AND pc.is_active = true
      AND (
        -- Either has inventory in required status, or we allow soft listing
        EXISTS (
          SELECT 1 FROM public.inventory_items ii 
          WHERE ii.product_class_id = pc.id 
          AND ii.status = ANY(pc.inventory_required_status)
          AND ii.reserved_for_award_id IS NULL
        )
        OR 'SOFT_LISTING_OK' = ANY(pc.inventory_required_status)
      )
    ORDER BY random()
    LIMIT 1;
    
    -- Fallback: if no product found, try lower bands
    IF v_product IS NULL AND v_band = 'MYTHIC' THEN
      SELECT * INTO v_product FROM public.product_classes pc
      WHERE pc.band = 'GRAIL' AND pc.is_active = true
      ORDER BY random() LIMIT 1;
    END IF;
    
    IF v_product IS NULL AND v_band IN ('MYTHIC', 'GRAIL') THEN
      SELECT * INTO v_product FROM public.product_classes pc
      WHERE pc.band = 'RARE' AND pc.is_active = true
      ORDER BY random() LIMIT 1;
    END IF;
    
    IF v_product IS NULL THEN
      SELECT * INTO v_product FROM public.product_classes pc
      WHERE pc.band = 'ICON' AND pc.is_active = true
      ORDER BY random() LIMIT 1;
    END IF;
    
    -- Calculate credits: 1 credit = $0.01 of pool contribution
    v_credits := FLOOR(v_pool_per_card / 0.01);
    
    -- Split credits by band (higher bands get more product-specific credits)
    v_product_credits := CASE v_band
      WHEN 'ICON' THEN FLOOR(v_credits * 0.70)
      WHEN 'RARE' THEN FLOOR(v_credits * 0.80)
      WHEN 'GRAIL' THEN FLOOR(v_credits * 0.90)
      WHEN 'MYTHIC' THEN FLOOR(v_credits * 0.95)
    END;
    v_universal_credits := v_credits - v_product_credits;
    
    -- Golden card check (very rare: 1 in 10000 for T5, better odds for higher tiers)
    v_is_golden := CASE v_tier
      WHEN 'T5' THEN random() < 0.0001
      WHEN 'T10' THEN random() < 0.0002
      WHEN 'T20' THEN random() < 0.0005
    END;
    
    -- Golden cards get instant 100% (full product cost in credits)
    IF v_is_golden THEN
      v_product_credits := FLOOR(v_product.expected_fulfillment_cost_usd * 100);
      v_is_award := true;
    END IF;
    
    -- Award attempt (if not already golden)
    IF NOT v_is_golden THEN
      -- Attempt rate based on tier and bucket
      v_attempt_rate := CASE v_tier
        WHEN 'T5' THEN 0.001
        WHEN 'T10' THEN 0.002
        WHEN 'T20' THEN 0.005
      END;
      
      IF random() < v_attempt_rate AND v_product.bucket = 'midWins' THEN
        -- Lock the specific bucket row and check balance
        SELECT balance_usd INTO v_bucket_balance
        FROM public.bucket_balances
        WHERE bucket = v_product.bucket
        FOR UPDATE;
        
        IF v_bucket_balance >= v_product.expected_fulfillment_cost_usd THEN
          -- Reserve the cost from bucket
          UPDATE public.bucket_balances
          SET balance_usd = balance_usd - v_product.expected_fulfillment_cost_usd,
              updated_at = now()
          WHERE bucket = v_product.bucket;
          
          -- Create award
          INSERT INTO public.awards (user_id, product_class_id, bucket, reserved_cost_usd, status)
          VALUES (p_user_id, v_product.id, v_product.bucket, v_product.expected_fulfillment_cost_usd, 'RESERVED')
          RETURNING id INTO v_award_id;
          
          -- Log reservation
          INSERT INTO public.pool_ledger (event_type, bucket, amount_usd, ref_type, ref_id)
          VALUES ('RESERVE', v_product.bucket, v_product.expected_fulfillment_cost_usd, 'award', v_award_id::TEXT);
          
          v_is_award := true;
        ELSE
          -- Near-win: boost credits by 12%
          v_credits := FLOOR(v_credits * 1.12);
          v_product_credits := FLOOR(v_product_credits * 1.12);
        END IF;
      END IF;
    END IF;
    
    -- Generate serial number
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
    
    -- Update award with reveal_id
    IF v_award_id IS NOT NULL THEN
      UPDATE public.awards SET reveal_id = v_reveal_id WHERE id = v_award_id;
    END IF;
    
    -- Upsert user product credits
    INSERT INTO public.user_product_credits (user_id, product_class_id, credits)
    VALUES (p_user_id, v_product.id, v_product_credits)
    ON CONFLICT (user_id, product_class_id)
    DO UPDATE SET credits = public.user_product_credits.credits + v_product_credits, updated_at = now();
    
    -- Upsert user universal credits
    INSERT INTO public.user_universal_credits (user_id, credits)
    VALUES (p_user_id, v_universal_credits)
    ON CONFLICT (user_id)
    DO UPDATE SET credits = public.user_universal_credits.credits + v_universal_credits, updated_at = now();
    
    -- Build reveal JSON
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
$function$;