-- Allow public (unauthenticated) users to browse collectors.
-- When unauthenticated, connection_status will be null and we won't exclude auth.uid() from results.

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
      -- Connection status (null when unauthenticated)
      (SELECT cc.status FROM collector_connections cc 
       WHERE auth.uid() IS NOT NULL
         AND cc.follower_id = auth.uid()
         AND cc.following_id = cp.user_id) as connection_status
    FROM collector_profiles cp
    WHERE cp.is_public = true
      AND (auth.uid() IS NULL OR cp.user_id != auth.uid())
      AND (
        p_filter = 'all'
        OR (
          auth.uid() IS NOT NULL
          AND (
            (p_filter = 'following' AND EXISTS (
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

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;