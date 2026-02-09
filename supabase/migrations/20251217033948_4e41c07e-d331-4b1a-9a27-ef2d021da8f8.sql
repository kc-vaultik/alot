-- Create a helper function to calculate collector score
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

-- Update get_collector_profile to use the new scoring algorithm
CREATE OR REPLACE FUNCTION public.get_collector_profile(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  
  -- Build score breakdown for UI display
  v_score_breakdown := jsonb_build_object(
    'collection_value_score', ROUND(LEAST(25, 
      CASE WHEN v_collection_value > 0 
        THEN (log(v_collection_value + 1) / log(100000)) * 25 
        ELSE 0 
      END
    ), 1),
    'card_count_score', ROUND(LEAST(15, (v_card_count::NUMERIC / 500) * 15), 1),
    'swaps_score', ROUND(LEAST(15, (v_swaps_completed::NUMERIC / 50) * 15), 1),
    'gifts_score', ROUND(LEAST(10, (v_gifts_given::NUMERIC / 25) * 10), 1),
    'battle_score', ROUND((v_battles_won::NUMERIC / GREATEST(v_battles_won + v_battles_lost, 1)) * 20, 1),
    'redemption_score', ROUND(LEAST(15, (v_redemptions::NUMERIC / 10) * 15), 1)
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
$$;

-- Update get_collectors_list to use the scoring function
CREATE OR REPLACE FUNCTION public.get_collectors_list(
  p_filter text DEFAULT 'all',
  p_limit integer DEFAULT 50
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  WITH collector_data AS (
    SELECT 
      cp.user_id,
      cp.username,
      cp.display_name,
      cp.avatar_url,
      -- Get card count
      (SELECT COUNT(*)::INTEGER FROM reveals r WHERE r.user_id = cp.user_id AND r.revealed_at IS NOT NULL) as card_count,
      -- Get collection value
      (SELECT COALESCE(SUM(pc.retail_value_usd), 0) 
       FROM reveals r 
       JOIN product_classes pc ON pc.id = r.product_class_id 
       WHERE r.user_id = cp.user_id AND r.revealed_at IS NOT NULL) as collection_value,
      -- Get swaps
      (SELECT COUNT(*)::INTEGER FROM card_transfers 
       WHERE (from_user_id = cp.user_id OR to_user_id = cp.user_id) 
       AND transfer_type = 'SWAP' AND status = 'CLAIMED') as swaps_completed,
      -- Get gifts
      (SELECT COUNT(*)::INTEGER FROM card_transfers 
       WHERE from_user_id = cp.user_id AND transfer_type = 'GIFT' AND status = 'CLAIMED') as gifts_given,
      -- Get battles
      COALESCE((SELECT wins FROM leaderboard_stats WHERE user_id = cp.user_id AND season_id = 'S1'), 0) as battles_won,
      COALESCE((SELECT losses FROM leaderboard_stats WHERE user_id = cp.user_id AND season_id = 'S1'), 0) as battles_lost,
      -- Get redemptions
      (SELECT COUNT(*)::INTEGER FROM awards WHERE user_id = cp.user_id AND status = 'FULFILLED') as redemptions,
      -- Connection status
      (SELECT cc.status FROM collector_connections cc 
       WHERE cc.follower_id = auth.uid() AND cc.following_id = cp.user_id) as connection_status
    FROM collector_profiles cp
    WHERE cp.is_public = true
      AND cp.user_id != auth.uid()
      AND (
        p_filter = 'all'
        OR (p_filter = 'following' AND EXISTS (
          SELECT 1 FROM collector_connections 
          WHERE follower_id = auth.uid() AND following_id = cp.user_id
        ))
        OR (p_filter = 'followers' AND EXISTS (
          SELECT 1 FROM collector_connections 
          WHERE follower_id = cp.user_id AND following_id = auth.uid()
        ))
        OR (p_filter = 'mutual' AND EXISTS (
          SELECT 1 FROM collector_connections 
          WHERE follower_id = auth.uid() AND following_id = cp.user_id AND status = 'MUTUAL'
        ))
      )
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'user_id', cd.user_id,
      'username', cd.username,
      'display_name', cd.display_name,
      'avatar_url', cd.avatar_url,
      'card_count', cd.card_count,
      'score', calculate_collector_score(
        cd.collection_value,
        cd.card_count,
        cd.swaps_completed,
        cd.gifts_given,
        cd.battles_won,
        cd.battles_lost,
        cd.redemptions
      ),
      'connection_status', cd.connection_status
    )
    ORDER BY calculate_collector_score(
      cd.collection_value,
      cd.card_count,
      cd.swaps_completed,
      cd.gifts_given,
      cd.battles_won,
      cd.battles_lost,
      cd.redemptions
    ) DESC
  )
  INTO v_result
  FROM collector_data cd
  LIMIT p_limit;
  
  RETURN COALESCE(v_result, '[]'::JSONB);
END;
$$;

-- Update search_collectors to include score
CREATE OR REPLACE FUNCTION public.search_collectors(
  p_query text,
  p_limit integer DEFAULT 20
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  WITH collector_data AS (
    SELECT 
      cp.user_id,
      cp.username,
      cp.display_name,
      cp.avatar_url,
      (SELECT COUNT(*)::INTEGER FROM reveals r WHERE r.user_id = cp.user_id AND r.revealed_at IS NOT NULL) as card_count,
      (SELECT COALESCE(SUM(pc.retail_value_usd), 0) 
       FROM reveals r JOIN product_classes pc ON pc.id = r.product_class_id 
       WHERE r.user_id = cp.user_id AND r.revealed_at IS NOT NULL) as collection_value,
      (SELECT COUNT(*)::INTEGER FROM card_transfers 
       WHERE (from_user_id = cp.user_id OR to_user_id = cp.user_id) 
       AND transfer_type = 'SWAP' AND status = 'CLAIMED') as swaps_completed,
      (SELECT COUNT(*)::INTEGER FROM card_transfers 
       WHERE from_user_id = cp.user_id AND transfer_type = 'GIFT' AND status = 'CLAIMED') as gifts_given,
      COALESCE((SELECT wins FROM leaderboard_stats WHERE user_id = cp.user_id AND season_id = 'S1'), 0) as battles_won,
      COALESCE((SELECT losses FROM leaderboard_stats WHERE user_id = cp.user_id AND season_id = 'S1'), 0) as battles_lost,
      (SELECT COUNT(*)::INTEGER FROM awards WHERE user_id = cp.user_id AND status = 'FULFILLED') as redemptions
    FROM collector_profiles cp
    WHERE cp.is_public = true
      AND cp.user_id != auth.uid()
      AND (
        cp.username ILIKE '%' || p_query || '%'
        OR cp.display_name ILIKE '%' || p_query || '%'
      )
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'user_id', cd.user_id,
      'username', cd.username,
      'display_name', cd.display_name,
      'avatar_url', cd.avatar_url,
      'card_count', cd.card_count,
      'score', calculate_collector_score(
        cd.collection_value,
        cd.card_count,
        cd.swaps_completed,
        cd.gifts_given,
        cd.battles_won,
        cd.battles_lost,
        cd.redemptions
      )
    )
  )
  INTO v_result
  FROM collector_data cd
  LIMIT p_limit;
  
  RETURN COALESCE(v_result, '[]'::JSONB);
END;
$$;