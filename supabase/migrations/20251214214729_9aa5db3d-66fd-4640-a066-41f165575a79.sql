-- Phase 4: Create process_daily_free_pull RPC and make reveals.purchase_id nullable

-- First, make purchase_id nullable for free pulls
ALTER TABLE public.reveals ALTER COLUMN purchase_id DROP NOT NULL;

-- Create the daily free pull RPC
CREATE OR REPLACE FUNCTION public.process_daily_free_pull(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_config JSONB;
  v_promo_config JSONB;
  v_free_pull_config JSONB;
  v_today DATE := CURRENT_DATE;
  v_reveal_id UUID;
  v_band public.rarity_band;
  v_product RECORD;
  v_credits_grant INT;
  v_max_award_cost NUMERIC;
  v_daily_cap NUMERIC;
  v_promo_balance NUMERIC;
  v_daily_spent NUMERIC;
  v_is_award BOOLEAN := FALSE;
  v_award_id UUID;
  v_serial TEXT;
  v_random NUMERIC;
BEGIN
  -- 1. Load active economy config
  SELECT config INTO v_config FROM economy_configs WHERE is_active = true LIMIT 1;
  v_promo_config := v_config->'promoPool';
  v_free_pull_config := v_promo_config->'freePull';
  
  -- Check if promo/free pull is enabled
  IF v_promo_config IS NULL OR v_free_pull_config IS NULL THEN
    RETURN jsonb_build_object('error', 'Promo pool not configured');
  END IF;
  
  IF NOT COALESCE((v_promo_config->>'enabled')::BOOLEAN, FALSE) OR 
     NOT COALESCE((v_free_pull_config->>'enabled')::BOOLEAN, FALSE) THEN
    RETURN jsonb_build_object('error', 'Free pulls are currently disabled');
  END IF;
  
  -- 2. Enforce 1/day limit (unique constraint will fail if already claimed)
  BEGIN
    INSERT INTO daily_free_pulls (user_id, pull_date)
    VALUES (p_user_id, v_today);
  EXCEPTION WHEN unique_violation THEN
    RETURN jsonb_build_object('error', 'Free pull already claimed today', 'next_available', v_today + INTERVAL '1 day');
  END;
  
  -- 3. Get config values
  v_credits_grant := COALESCE((v_free_pull_config->>'creditsGrant')::INT, 200);
  v_max_award_cost := COALESCE((v_free_pull_config->>'maxAwardCostUsd')::NUMERIC, 80);
  v_daily_cap := COALESCE((v_promo_config->>'dailySpendCapUsd')::NUMERIC, 500);
  
  -- 4. Band selection (weighted by freePull config)
  v_random := random();
  v_band := CASE
    WHEN v_random < COALESCE((v_free_pull_config->'bandWeightsOverride'->>'ICON')::NUMERIC, 0.97) THEN 'ICON'::rarity_band
    WHEN v_random < COALESCE((v_free_pull_config->'bandWeightsOverride'->>'ICON')::NUMERIC, 0.97) + 
                    COALESCE((v_free_pull_config->'bandWeightsOverride'->>'RARE')::NUMERIC, 0.025) THEN 'RARE'::rarity_band
    WHEN v_random < COALESCE((v_free_pull_config->'bandWeightsOverride'->>'ICON')::NUMERIC, 0.97) + 
                    COALESCE((v_free_pull_config->'bandWeightsOverride'->>'RARE')::NUMERIC, 0.025) +
                    COALESCE((v_free_pull_config->'bandWeightsOverride'->>'GRAIL')::NUMERIC, 0.005) THEN 'GRAIL'::rarity_band
    ELSE 'MYTHIC'::rarity_band
  END;
  
  -- 5. Select product from band
  SELECT * INTO v_product
  FROM product_classes pc
  WHERE pc.band = v_band AND pc.is_active = true
  ORDER BY random() LIMIT 1;
  
  -- Fallback to ICON if no product found
  IF v_product IS NULL THEN
    SELECT * INTO v_product FROM product_classes WHERE band = 'ICON' AND is_active = true ORDER BY random() LIMIT 1;
    v_band := 'ICON';
  END IF;
  
  -- If still no product, return error
  IF v_product IS NULL THEN
    -- Rollback the daily_free_pulls insert by deleting it
    DELETE FROM daily_free_pulls WHERE user_id = p_user_id AND pull_date = v_today;
    RETURN jsonb_build_object('error', 'No products available');
  END IF;
  
  -- 6. Attempt award (if enabled and product qualifies)
  IF COALESCE((v_free_pull_config->>'allowAwards')::BOOLEAN, TRUE) AND 
     v_product.expected_fulfillment_cost_usd <= v_max_award_cost THEN
    
    -- Lock promo bucket
    SELECT balance_usd INTO v_promo_balance
    FROM bucket_balances WHERE bucket = 'promo' FOR UPDATE;
    
    -- Lock/upsert daily spend
    INSERT INTO promo_spend_daily (spend_date, spent_usd)
    VALUES (v_today, 0)
    ON CONFLICT (spend_date) DO NOTHING;
    
    SELECT spent_usd INTO v_daily_spent
    FROM promo_spend_daily WHERE spend_date = v_today FOR UPDATE;
    
    -- Check if we can fund this award
    IF v_promo_balance >= v_product.expected_fulfillment_cost_usd AND
       (v_daily_spent + v_product.expected_fulfillment_cost_usd) <= v_daily_cap THEN
      
      -- Reserve from promo bucket
      UPDATE bucket_balances
      SET balance_usd = balance_usd - v_product.expected_fulfillment_cost_usd, updated_at = now()
      WHERE bucket = 'promo';
      
      -- Update daily spend
      UPDATE promo_spend_daily
      SET spent_usd = spent_usd + v_product.expected_fulfillment_cost_usd, updated_at = now()
      WHERE spend_date = v_today;
      
      -- Create award
      INSERT INTO awards (user_id, product_class_id, bucket, reserved_cost_usd, status)
      VALUES (p_user_id, v_product.id, 'promo', v_product.expected_fulfillment_cost_usd, 'RESERVED')
      RETURNING id INTO v_award_id;
      
      -- Log to ledger
      INSERT INTO pool_ledger (event_type, bucket, amount_usd, ref_type, ref_id)
      VALUES ('RESERVE', 'promo', v_product.expected_fulfillment_cost_usd, 'award', v_award_id::TEXT);
      
      v_is_award := TRUE;
    END IF;
  END IF;
  
  -- 7. Generate serial
  v_serial := LPAD((FLOOR(random() * 10000)::INT)::TEXT, 4, '0') || '/10000';
  
  -- 8. Insert reveal (with NULL purchase_id for free pulls)
  INSERT INTO reveals (
    purchase_id, user_id, product_class_id, band, is_golden,
    credits_awarded, product_credits_awarded, universal_credits_awarded,
    is_award, award_id, serial_number
  ) VALUES (
    NULL, p_user_id, v_product.id, v_band, FALSE,
    v_credits_grant, 
    FLOOR(v_credits_grant * 0.7), -- 70% to product
    FLOOR(v_credits_grant * 0.3), -- 30% universal
    v_is_award, v_award_id, v_serial
  ) RETURNING id INTO v_reveal_id;
  
  -- 9. Update daily_free_pulls with reveal_id
  UPDATE daily_free_pulls SET reveal_id = v_reveal_id WHERE user_id = p_user_id AND pull_date = v_today;
  
  -- 10. Update award with reveal_id
  IF v_award_id IS NOT NULL THEN
    UPDATE awards SET reveal_id = v_reveal_id WHERE id = v_award_id;
  END IF;
  
  -- 11. Upsert credits
  INSERT INTO user_product_credits (user_id, product_class_id, credits)
  VALUES (p_user_id, v_product.id, FLOOR(v_credits_grant * 0.7))
  ON CONFLICT (user_id, product_class_id)
  DO UPDATE SET credits = user_product_credits.credits + FLOOR(v_credits_grant * 0.7), updated_at = now();
  
  INSERT INTO user_universal_credits (user_id, credits)
  VALUES (p_user_id, FLOOR(v_credits_grant * 0.3))
  ON CONFLICT (user_id)
  DO UPDATE SET credits = user_universal_credits.credits + FLOOR(v_credits_grant * 0.3), updated_at = now();
  
  -- 12. Return reveal payload
  RETURN jsonb_build_object(
    'success', TRUE,
    'reveal', jsonb_build_object(
      'id', v_reveal_id,
      'product_class_id', v_product.id,
      'band', v_band,
      'is_golden', FALSE,
      'is_award', v_is_award,
      'serial_number', v_serial,
      'credits_awarded', v_credits_grant,
      'product', jsonb_build_object(
        'id', v_product.id,
        'name', v_product.name,
        'brand', v_product.brand,
        'model', v_product.model,
        'category', v_product.category,
        'retail_value_usd', v_product.retail_value_usd,
        'image_url', v_product.image_url
      )
    )
  );
END;
$$;