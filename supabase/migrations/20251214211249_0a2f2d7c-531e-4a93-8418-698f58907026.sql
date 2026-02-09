-- =============================================
-- MYSTERY CARD V2 PRODUCTION SCHEMA
-- =============================================

-- =============================================
-- 1. CREATE ENUMS
-- =============================================

CREATE TYPE public.product_category AS ENUM ('POKEMON', 'SNEAKERS', 'WATCHES', 'HANDBAGS', 'WINE');
CREATE TYPE public.rarity_band AS ENUM ('ICON', 'RARE', 'GRAIL', 'MYTHIC');
CREATE TYPE public.award_bucket AS ENUM ('microWins', 'midWins', 'services', 'jackpot', 'superJackpot', 'reserve');
CREATE TYPE public.pool_event AS ENUM ('ADD', 'RESERVE', 'RELEASE', 'CAPTURE');
CREATE TYPE public.inventory_status AS ENUM ('IN_CUSTODY', 'GUARANTEED_SELLER', 'SOFT_LISTING_OK', 'UNAVAILABLE');
CREATE TYPE public.award_status AS ENUM ('RESERVED', 'FULFILLED', 'CANCELLED', 'EXPIRED');
CREATE TYPE public.pricing_tier AS ENUM ('T5', 'T10', 'T20');

-- =============================================
-- 2. CREATE TABLES
-- =============================================

-- 2.1 Economy Configs (versioned config storage)
CREATE TABLE public.economy_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL UNIQUE,
  config JSONB NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  activated_at TIMESTAMPTZ
);

-- 2.2 Product Classes (prize catalog)
CREATE TABLE public.product_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  category public.product_category NOT NULL,
  band public.rarity_band NOT NULL,
  bucket public.award_bucket NOT NULL,
  expected_fulfillment_cost_usd NUMERIC(12,2) NOT NULL,
  retail_value_usd NUMERIC(12,2) NOT NULL,
  image_url TEXT,
  inventory_required_status public.inventory_status[] NOT NULL DEFAULT ARRAY['IN_CUSTODY'::public.inventory_status],
  is_jackpot BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.3 Inventory Items (simulated inventory)
CREATE TABLE public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_class_id UUID NOT NULL REFERENCES public.product_classes(id) ON DELETE CASCADE,
  sku TEXT,
  status public.inventory_status NOT NULL DEFAULT 'IN_CUSTODY',
  reserved_for_award_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.4 Bucket Balances (pool tracking - 6 buckets)
CREATE TABLE public.bucket_balances (
  bucket public.award_bucket PRIMARY KEY,
  balance_usd NUMERIC(14,4) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.5 Pool Ledger (append-only transaction log)
CREATE TABLE public.pool_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type public.pool_event NOT NULL,
  bucket public.award_bucket NOT NULL,
  amount_usd NUMERIC(14,4) NOT NULL,
  ref_type TEXT NOT NULL,
  ref_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.6 Purchases (with Stripe fields)
CREATE TABLE public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_session_id TEXT NOT NULL UNIQUE,
  stripe_payment_intent_id TEXT,
  tier public.pricing_tier NOT NULL,
  quantity INT NOT NULL,
  unit_price_usd NUMERIC(10,2) NOT NULL,
  total_price_usd NUMERIC(10,2) NOT NULL,
  stripe_amount_total_cents INT NOT NULL,
  net_revenue_usd NUMERIC(10,4),
  pool_contribution_usd NUMERIC(10,4),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.7 Reveals (card reveal results)
CREATE TABLE public.reveals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_class_id UUID NOT NULL REFERENCES public.product_classes(id),
  band public.rarity_band NOT NULL,
  is_golden BOOLEAN NOT NULL DEFAULT false,
  credits_awarded INT NOT NULL DEFAULT 0,
  product_credits_awarded INT NOT NULL DEFAULT 0,
  universal_credits_awarded INT NOT NULL DEFAULT 0,
  is_award BOOLEAN NOT NULL DEFAULT false,
  award_id UUID,
  serial_number TEXT NOT NULL,
  card_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.8 User Universal Credits
CREATE TABLE public.user_universal_credits (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  credits INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.9 User Product Credits
CREATE TABLE public.user_product_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_class_id UUID NOT NULL REFERENCES public.product_classes(id) ON DELETE CASCADE,
  credits INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_class_id)
);

-- 2.10 Awards (issued wins)
CREATE TABLE public.awards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_class_id UUID NOT NULL REFERENCES public.product_classes(id),
  reveal_id UUID REFERENCES public.reveals(id),
  bucket public.award_bucket NOT NULL,
  reserved_cost_usd NUMERIC(12,2) NOT NULL,
  status public.award_status NOT NULL DEFAULT 'RESERVED',
  fulfilled_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.11 Webhook Events (idempotency)
CREATE TABLE public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  event_id TEXT NOT NULL,
  event_type TEXT,
  payload JSONB NOT NULL,
  processed BOOLEAN NOT NULL DEFAULT false,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(provider, event_id)
);

-- =============================================
-- 3. CREATE INDEXES
-- =============================================

CREATE INDEX idx_product_classes_category ON public.product_classes(category);
CREATE INDEX idx_product_classes_band ON public.product_classes(band);
CREATE INDEX idx_product_classes_bucket ON public.product_classes(bucket);
CREATE INDEX idx_inventory_items_product_class ON public.inventory_items(product_class_id);
CREATE INDEX idx_inventory_items_status ON public.inventory_items(status);
CREATE INDEX idx_pool_ledger_bucket ON public.pool_ledger(bucket);
CREATE INDEX idx_pool_ledger_created_at ON public.pool_ledger(created_at);
CREATE INDEX idx_purchases_user_id ON public.purchases(user_id);
CREATE INDEX idx_purchases_stripe_session ON public.purchases(stripe_session_id);
CREATE INDEX idx_reveals_user_id ON public.reveals(user_id);
CREATE INDEX idx_reveals_purchase_id ON public.reveals(purchase_id);
CREATE INDEX idx_reveals_product_class ON public.reveals(product_class_id);
CREATE INDEX idx_user_product_credits_user ON public.user_product_credits(user_id);
CREATE INDEX idx_awards_user_id ON public.awards(user_id);
CREATE INDEX idx_webhook_events_provider_event ON public.webhook_events(provider, event_id);

-- =============================================
-- 4. ENABLE RLS ON ALL TABLES
-- =============================================

ALTER TABLE public.economy_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bucket_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pool_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reveals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_universal_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_product_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 5. RLS POLICIES
-- =============================================

-- Economy Configs: Public read
CREATE POLICY "Anyone can read active economy configs"
  ON public.economy_configs FOR SELECT
  USING (is_active = true);

-- Product Classes: Public read
CREATE POLICY "Anyone can read active product classes"
  ON public.product_classes FOR SELECT
  USING (is_active = true);

-- Inventory Items: No client access (service role only)
-- No policies = no access for anon/authenticated

-- Bucket Balances: No client access (service role only)
-- No policies = no access for anon/authenticated

-- Pool Ledger: No client access (service role only)
-- No policies = no access for anon/authenticated

-- Purchases: Users can only read their own
CREATE POLICY "Users can read their own purchases"
  ON public.purchases FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Reveals: Users can only read their own
CREATE POLICY "Users can read their own reveals"
  ON public.reveals FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- User Universal Credits: Users can only read their own
CREATE POLICY "Users can read their own universal credits"
  ON public.user_universal_credits FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- User Product Credits: Users can only read their own
CREATE POLICY "Users can read their own product credits"
  ON public.user_product_credits FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Awards: Users can only read their own
CREATE POLICY "Users can read their own awards"
  ON public.awards FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Webhook Events: No client access
-- No policies = no access for anon/authenticated

-- =============================================
-- 6. ENABLE REALTIME FOR REVEALS
-- =============================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.reveals;

-- =============================================
-- 7. ATOMIC RPC: process_mystery_card_purchase
-- =============================================

CREATE OR REPLACE FUNCTION public.process_mystery_card_purchase(
  p_user_id UUID,
  p_stripe_session_id TEXT,
  p_stripe_payment_intent_id TEXT,
  p_tier TEXT,
  p_quantity INT,
  p_unit_price_cents INT,
  p_total_cents INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  
  -- Allocate pool to buckets (percentages: micro 10%, mid 35%, services 20%, jackpot 12%, superJackpot 3%, reserve 20%)
  -- Lock and update each bucket individually
  
  -- microWins: 10%
  UPDATE public.bucket_balances 
  SET balance_usd = balance_usd + (v_total_pool * 0.10), updated_at = now()
  WHERE bucket = 'microWins';
  
  INSERT INTO public.pool_ledger (event_type, bucket, amount_usd, ref_type, ref_id)
  VALUES ('ADD', 'microWins', v_total_pool * 0.10, 'purchase', v_purchase_id::TEXT);
  
  -- midWins: 35%
  UPDATE public.bucket_balances 
  SET balance_usd = balance_usd + (v_total_pool * 0.35), updated_at = now()
  WHERE bucket = 'midWins';
  
  INSERT INTO public.pool_ledger (event_type, bucket, amount_usd, ref_type, ref_id)
  VALUES ('ADD', 'midWins', v_total_pool * 0.35, 'purchase', v_purchase_id::TEXT);
  
  -- services: 20%
  UPDATE public.bucket_balances 
  SET balance_usd = balance_usd + (v_total_pool * 0.20), updated_at = now()
  WHERE bucket = 'services';
  
  INSERT INTO public.pool_ledger (event_type, bucket, amount_usd, ref_type, ref_id)
  VALUES ('ADD', 'services', v_total_pool * 0.20, 'purchase', v_purchase_id::TEXT);
  
  -- jackpot: 12%
  UPDATE public.bucket_balances 
  SET balance_usd = balance_usd + (v_total_pool * 0.12), updated_at = now()
  WHERE bucket = 'jackpot';
  
  INSERT INTO public.pool_ledger (event_type, bucket, amount_usd, ref_type, ref_id)
  VALUES ('ADD', 'jackpot', v_total_pool * 0.12, 'purchase', v_purchase_id::TEXT);
  
  -- superJackpot: 3%
  UPDATE public.bucket_balances 
  SET balance_usd = balance_usd + (v_total_pool * 0.03), updated_at = now()
  WHERE bucket = 'superJackpot';
  
  INSERT INTO public.pool_ledger (event_type, bucket, amount_usd, ref_type, ref_id)
  VALUES ('ADD', 'superJackpot', v_total_pool * 0.03, 'purchase', v_purchase_id::TEXT);
  
  -- reserve: 20%
  UPDATE public.bucket_balances 
  SET balance_usd = balance_usd + (v_total_pool * 0.20), updated_at = now()
  WHERE bucket = 'reserve';
  
  INSERT INTO public.pool_ledger (event_type, bucket, amount_usd, ref_type, ref_id)
  VALUES ('ADD', 'reserve', v_total_pool * 0.20, 'purchase', v_purchase_id::TEXT);
  
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
$$;

-- =============================================
-- 8. SEED DATA
-- =============================================

-- 8.1 Initialize bucket balances
INSERT INTO public.bucket_balances (bucket, balance_usd) VALUES
  ('microWins', 0),
  ('midWins', 0),
  ('services', 0),
  ('jackpot', 0),
  ('superJackpot', 0),
  ('reserve', 0);

-- 8.2 Insert economy config v2
INSERT INTO public.economy_configs (version, config, is_active, activated_at) VALUES (
  'v2.0',
  '{
    "pool_split": {
      "microWins": 0.10,
      "midWins": 0.35,
      "services": 0.20,
      "jackpot": 0.12,
      "superJackpot": 0.03,
      "reserve": 0.20
    },
    "tier_weights": {
      "T5": {"ICON": 0.93, "RARE": 0.06, "GRAIL": 0.009, "MYTHIC": 0.001},
      "T10": {"ICON": 0.85, "RARE": 0.12, "GRAIL": 0.025, "MYTHIC": 0.005},
      "T20": {"ICON": 0.75, "RARE": 0.18, "GRAIL": 0.06, "MYTHIC": 0.01}
    },
    "credit_splits": {
      "ICON": {"product": 0.70, "universal": 0.30},
      "RARE": {"product": 0.80, "universal": 0.20},
      "GRAIL": {"product": 0.90, "universal": 0.10},
      "MYTHIC": {"product": 0.95, "universal": 0.05}
    },
    "golden_rates": {"T5": 0.0001, "T10": 0.0002, "T20": 0.0005},
    "award_attempt_rates": {"T5": 0.001, "T10": 0.002, "T20": 0.005},
    "near_win_boost": 1.12,
    "fees": {"stripe_pct": 0.029, "stripe_fixed": 0.30, "ops": 0.30}
  }'::JSONB,
  true,
  now()
);

-- 8.3 Insert product classes (merged catalog)
-- WATCHES
INSERT INTO public.product_classes (name, brand, model, category, band, bucket, expected_fulfillment_cost_usd, retail_value_usd, image_url, is_jackpot) VALUES
  ('Patek Perpetual Calendar', 'Patek Philippe', '5320G', 'WATCHES', 'MYTHIC', 'superJackpot', 85000, 100000, '/lovable-uploads/patek-perpetual.png', true),
  ('AP Royal Oak Skeleton', 'Audemars Piguet', '15407ST', 'WATCHES', 'MYTHIC', 'jackpot', 42000, 50000, '/lovable-uploads/ap-skeleton.png', true),
  ('Rolex Submariner', 'Rolex', '126610LN', 'WATCHES', 'GRAIL', 'midWins', 10000, 12000, '/lovable-uploads/rolex-submariner.png', false),
  ('Rolex Daytona', 'Rolex', '116500LN', 'WATCHES', 'GRAIL', 'midWins', 28000, 35000, '/lovable-uploads/rolex-daytona.png', false),
  ('Omega Speedmaster', 'Omega', 'Moonwatch', 'WATCHES', 'RARE', 'midWins', 5500, 7000, '/lovable-uploads/omega-speedmaster.png', false),
  ('Tudor Black Bay', 'Tudor', 'BB58', 'WATCHES', 'ICON', 'midWins', 3200, 4000, '/lovable-uploads/tudor-blackbay.png', false);

-- HANDBAGS
INSERT INTO public.product_classes (name, brand, model, category, band, bucket, expected_fulfillment_cost_usd, retail_value_usd, image_url, is_jackpot) VALUES
  ('Hermès Birkin 35', 'Hermès', 'Birkin 35 Togo', 'HANDBAGS', 'MYTHIC', 'jackpot', 25000, 30000, '/lovable-uploads/hermes-birkin.png', true),
  ('Chanel Classic Flap', 'Chanel', 'Medium Caviar', 'HANDBAGS', 'GRAIL', 'midWins', 7500, 9500, '/lovable-uploads/chanel-flap.png', false),
  ('Louis Vuitton Capucines', 'Louis Vuitton', 'MM', 'HANDBAGS', 'RARE', 'midWins', 4500, 6000, '/lovable-uploads/lv-capucines.png', false),
  ('Gucci Bamboo 1947', 'Gucci', 'Small', 'HANDBAGS', 'ICON', 'midWins', 2800, 3500, '/lovable-uploads/gucci-bamboo.png', false);

-- POKEMON
INSERT INTO public.product_classes (name, brand, model, category, band, bucket, expected_fulfillment_cost_usd, retail_value_usd, image_url, is_jackpot, inventory_required_status) VALUES
  ('Charizard 1st Edition', 'Pokémon', 'Base Set Holo', 'POKEMON', 'MYTHIC', 'jackpot', 35000, 50000, '/lovable-uploads/charizard-1st.png', true, ARRAY['GUARANTEED_SELLER'::public.inventory_status]),
  ('Pikachu Illustrator', 'Pokémon', 'Promo', 'POKEMON', 'MYTHIC', 'superJackpot', 200000, 300000, '/lovable-uploads/pikachu-illustrator.png', true, ARRAY['IN_CUSTODY'::public.inventory_status]),
  ('PSA 10 Vintage Holo', 'Pokémon', 'Various', 'POKEMON', 'GRAIL', 'midWins', 400, 500, '/lovable-uploads/pokemon-grail.png', false, ARRAY['SOFT_LISTING_OK'::public.inventory_status]),
  ('Pokémon Hit Card', 'Pokémon', 'Modern Hit', 'POKEMON', 'ICON', 'midWins', 60, 80, '/lovable-uploads/pokemon-hit.png', false, ARRAY['SOFT_LISTING_OK'::public.inventory_status]);

-- SNEAKERS
INSERT INTO public.product_classes (name, brand, model, category, band, bucket, expected_fulfillment_cost_usd, retail_value_usd, image_url, is_jackpot, inventory_required_status) VALUES
  ('Nike Air Mag', 'Nike', 'Back to Future', 'SNEAKERS', 'MYTHIC', 'superJackpot', 80000, 100000, '/lovable-uploads/nike-mag.png', true, ARRAY['IN_CUSTODY'::public.inventory_status]),
  ('Travis Scott x Nike', 'Nike', 'Reverse Mocha', 'SNEAKERS', 'GRAIL', 'midWins', 1000, 1200, '/lovable-uploads/travis-scott.png', false, ARRAY['SOFT_LISTING_OK'::public.inventory_status]),
  ('Jordan 1 Chicago', 'Nike', '1985 OG', 'SNEAKERS', 'GRAIL', 'midWins', 4500, 6000, '/lovable-uploads/jordan-chicago.png', false, ARRAY['GUARANTEED_SELLER'::public.inventory_status]),
  ('Sneaker Drop', 'Various', 'Limited Release', 'SNEAKERS', 'ICON', 'midWins', 150, 200, '/lovable-uploads/sneaker-drop.png', false, ARRAY['SOFT_LISTING_OK'::public.inventory_status]);

-- WINE
INSERT INTO public.product_classes (name, brand, model, category, band, bucket, expected_fulfillment_cost_usd, retail_value_usd, image_url, is_jackpot, inventory_required_status) VALUES
  ('Romanée-Conti', 'DRC', '2019', 'WINE', 'MYTHIC', 'jackpot', 18000, 25000, '/lovable-uploads/romanee-conti.png', true, ARRAY['IN_CUSTODY'::public.inventory_status]),
  ('Pétrus', 'Pétrus', '2018', 'WINE', 'GRAIL', 'midWins', 3500, 5000, '/lovable-uploads/petrus.png', false, ARRAY['GUARANTEED_SELLER'::public.inventory_status]),
  ('Opus One', 'Opus One', '2020', 'WINE', 'RARE', 'midWins', 280, 400, '/lovable-uploads/opus-one.png', false, ARRAY['SOFT_LISTING_OK'::public.inventory_status]),
  ('Wine Pack Voucher', 'Various', 'Curated Selection', 'WINE', 'ICON', 'midWins', 90, 120, '/lovable-uploads/wine-pack.png', false, ARRAY['SOFT_LISTING_OK'::public.inventory_status]);