-- Fix get_collector_profile() numeric casting for ROUND(..., scale)
-- Postgres supports ROUND(numeric, int) but not ROUND(double precision, int).

CREATE OR REPLACE FUNCTION public.get_collector_profile(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_profile RECORD;
  v_card_count INTEGER;
  v_collection_value NUMERIC;
  v_swaps_completed INTEGER;
  v_gifts_given INTEGER;
  v_battles_won INTEGER;
  v_battles_lost INTEGER;
  v_redemptions INTEGER;
  v_follower_count INTEGER;
  v_following_count INTEGER;
  v_is_following BOOLEAN;
  v_score INTEGER;
  v_score_breakdown JSONB;
BEGIN
  -- Get profile
  SELECT * INTO v_profile
  FROM collector_profiles
  WHERE user_id = p_user_id;
  
  IF v_profile IS NULL THEN
    RETURN jsonb_build_object('error', 'Profile not found');
  END IF;
  
  -- Check privacy (only owner can view private profiles)
  IF NOT v_profile.is_public AND auth.uid() != p_user_id THEN
    RETURN jsonb_build_object('error', 'Profile is private');
  END IF;
  
  -- Get card count and collection value
  SELECT 
    COUNT(*)::INTEGER,
    COALESCE(SUM(pc.retail_value_usd), 0)
  INTO v_card_count, v_collection_value
  FROM reveals r
  JOIN product_classes pc ON pc.id = r.product_class_id
  WHERE r.user_id = p_user_id AND r.revealed_at IS NOT NULL;
  
  -- Get swaps completed (as sender or receiver)
  SELECT COUNT(*)::INTEGER INTO v_swaps_completed
  FROM card_transfers
  WHERE (from_user_id = p_user_id OR to_user_id = p_user_id)
    AND transfer_type = 'SWAP'
    AND status = 'CLAIMED';
  
  -- Get gifts given
  SELECT COUNT(*)::INTEGER INTO v_gifts_given
  FROM card_transfers
  WHERE from_user_id = p_user_id
    AND transfer_type = 'GIFT'
    AND status = 'CLAIMED';
  
  -- Get battle stats
  SELECT 
    COALESCE(wins, 0),
    COALESCE(losses, 0)
  INTO v_battles_won, v_battles_lost
  FROM leaderboard_stats
  WHERE user_id = p_user_id AND season_id = 'S1';
  
  IF v_battles_won IS NULL THEN
    v_battles_won := 0;
    v_battles_lost := 0;
  END IF;
  
  -- Get redemptions
  SELECT COUNT(*)::INTEGER INTO v_redemptions
  FROM awards
  WHERE user_id = p_user_id AND status = 'FULFILLED';
  
  -- Get follower/following counts
  SELECT COUNT(*)::INTEGER INTO v_follower_count
  FROM collector_connections
  WHERE following_id = p_user_id;
  
  SELECT COUNT(*)::INTEGER INTO v_following_count
  FROM collector_connections
  WHERE follower_id = p_user_id;
  
  -- Check if current user is following this profile
  v_is_following := EXISTS (
    SELECT 1 FROM collector_connections
    WHERE follower_id = auth.uid() AND following_id = p_user_id
  );
  
  -- Calculate score using helper function
  v_score := calculate_collector_score(
    v_collection_value,
    v_card_count,
    v_swaps_completed,
    v_gifts_given,
    v_battles_won,
    v_battles_lost,
    v_redemptions
  );

  -- Ensure ROUND(..., 1) receives numeric (not double precision)
  v_score_breakdown := jsonb_build_object(
    'collection_value_score', ROUND(
      LEAST(
        25::numeric,
        (
          CASE WHEN v_collection_value > 0 
            THEN ((log((v_collection_value + 1)::double precision) / log(100000::double precision)) * 25)::numeric
            ELSE 0::numeric
          END
        )
      ),
      1
    ),
    'card_count_score', ROUND(LEAST(15::numeric, (v_card_count::NUMERIC / 500) * 15), 1),
    'swaps_score', ROUND(LEAST(15::numeric, (v_swaps_completed::NUMERIC / 50) * 15), 1),
    'gifts_score', ROUND(LEAST(10::numeric, (v_gifts_given::NUMERIC / 25) * 10), 1),
    'battle_score', ROUND((v_battles_won::NUMERIC / GREATEST(v_battles_won + v_battles_lost, 1)) * 20, 1),
    'redemption_score', ROUND(LEAST(15::numeric, (v_redemptions::NUMERIC / 10) * 15), 1)
  );
  
  RETURN jsonb_build_object(
    'user_id', v_profile.user_id,
    'username', v_profile.username,
    'display_name', v_profile.display_name,
    'avatar_url', v_profile.avatar_url,
    'bio', v_profile.bio,
    'is_public', v_profile.is_public,
    'created_at', v_profile.created_at,
    'follower_count', v_follower_count,
    'following_count', v_following_count,
    'is_following', v_is_following,
    'is_own_profile', auth.uid() = p_user_id,
    'score', v_score,
    'stats', jsonb_build_object(
      'card_count', v_card_count,
      'collection_value', v_collection_value,
      'swaps_completed', v_swaps_completed,
      'gifts_given', v_gifts_given,
      'battles_won', v_battles_won,
      'battles_lost', v_battles_lost,
      'redemptions', v_redemptions
    ),
    'score_breakdown', v_score_breakdown
  );
END;
$function$;