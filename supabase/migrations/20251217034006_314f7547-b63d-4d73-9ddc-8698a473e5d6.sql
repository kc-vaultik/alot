-- Fix search_path for calculate_collector_score function
CREATE OR REPLACE FUNCTION public.calculate_collector_score(
  p_collection_value NUMERIC,
  p_card_count INTEGER,
  p_swaps_completed INTEGER,
  p_gifts_given INTEGER,
  p_battles_won INTEGER,
  p_battles_lost INTEGER,
  p_redemptions INTEGER
)
RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  v_collection_value_score NUMERIC;
  v_card_count_score NUMERIC;
  v_swaps_score NUMERIC;
  v_gifts_score NUMERIC;
  v_battle_score NUMERIC;
  v_redemption_score NUMERIC;
  v_total_score NUMERIC;
BEGIN
  -- Collection value score: min(25, log10(value + 1) / log10(100000) * 25)
  v_collection_value_score := LEAST(25, 
    CASE WHEN p_collection_value > 0 
      THEN (log(p_collection_value + 1) / log(100000)) * 25 
      ELSE 0 
    END
  );
  
  -- Card count score: min(15, cards / 500 * 15)
  v_card_count_score := LEAST(15, (p_card_count::NUMERIC / 500) * 15);
  
  -- Swaps score: min(15, swaps / 50 * 15)
  v_swaps_score := LEAST(15, (p_swaps_completed::NUMERIC / 50) * 15);
  
  -- Gifts score: min(10, gifts / 25 * 10)
  v_gifts_score := LEAST(10, (p_gifts_given::NUMERIC / 25) * 10);
  
  -- Battle score: (wins / max(wins + losses, 1)) * 20
  v_battle_score := (p_battles_won::NUMERIC / GREATEST(p_battles_won + p_battles_lost, 1)) * 20;
  
  -- Redemption score: min(15, redemptions / 10 * 15)
  v_redemption_score := LEAST(15, (p_redemptions::NUMERIC / 10) * 15);
  
  -- Total score
  v_total_score := v_collection_value_score + v_card_count_score + v_swaps_score + 
                   v_gifts_score + v_battle_score + v_redemption_score;
  
  -- Clamp to 1-100 range (minimum 1 for any user)
  RETURN GREATEST(1, LEAST(100, ROUND(v_total_score)));
END;
$$;