-- 2.1 get_collector_profile: Returns profile with computed score and stats
CREATE OR REPLACE FUNCTION public.get_collector_profile(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile RECORD;
  v_score_data JSONB;
  v_follower_count INT;
  v_following_count INT;
  v_is_following BOOLEAN := false;
  v_current_user UUID := auth.uid();
BEGIN
  -- Get profile
  SELECT * INTO v_profile
  FROM collector_profiles
  WHERE user_id = p_user_id;
  
  IF v_profile IS NULL THEN
    RETURN jsonb_build_object('error', 'Profile not found');
  END IF;
  
  -- Check if profile is public or owned by current user
  IF NOT v_profile.is_public AND v_current_user != p_user_id THEN
    RETURN jsonb_build_object('error', 'Profile is private');
  END IF;
  
  -- Get score data
  v_score_data := get_collector_score(p_user_id);
  
  -- Get follower/following counts
  SELECT COUNT(*) INTO v_follower_count
  FROM collector_connections WHERE following_id = p_user_id;
  
  SELECT COUNT(*) INTO v_following_count
  FROM collector_connections WHERE follower_id = p_user_id;
  
  -- Check if current user is following this profile
  IF v_current_user IS NOT NULL AND v_current_user != p_user_id THEN
    SELECT EXISTS(
      SELECT 1 FROM collector_connections 
      WHERE follower_id = v_current_user AND following_id = p_user_id
    ) INTO v_is_following;
  END IF;
  
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
    'is_own_profile', v_current_user = p_user_id,
    'score', v_score_data->'score',
    'stats', jsonb_build_object(
      'card_count', v_score_data->'card_count',
      'collection_value', v_score_data->'collection_value',
      'swaps_completed', v_score_data->'swaps_completed',
      'gifts_given', v_score_data->'gifts_given',
      'battles_won', v_score_data->'battles_won',
      'battles_lost', v_score_data->'battles_lost',
      'redemptions', v_score_data->'redemptions'
    ),
    'score_breakdown', v_score_data->'breakdown'
  );
END;
$$;

-- 2.2 search_collectors: Search by username or display_name
CREATE OR REPLACE FUNCTION public.search_collectors(p_query TEXT, p_limit INT DEFAULT 20)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_results JSONB := '[]'::JSONB;
  v_collector RECORD;
  v_score_data JSONB;
BEGIN
  FOR v_collector IN
    SELECT cp.*
    FROM collector_profiles cp
    WHERE cp.is_public = true
      AND (
        cp.username ILIKE '%' || p_query || '%'
        OR cp.display_name ILIKE '%' || p_query || '%'
      )
    ORDER BY 
      CASE WHEN cp.username ILIKE p_query || '%' THEN 0
           WHEN cp.display_name ILIKE p_query || '%' THEN 1
           ELSE 2 END,
      cp.username
    LIMIT p_limit
  LOOP
    v_score_data := get_collector_score(v_collector.user_id);
    
    v_results := v_results || jsonb_build_object(
      'user_id', v_collector.user_id,
      'username', v_collector.username,
      'display_name', v_collector.display_name,
      'avatar_url', v_collector.avatar_url,
      'score', v_score_data->'score',
      'card_count', v_score_data->'card_count'
    );
  END LOOP;
  
  RETURN v_results;
END;
$$;

-- 2.3 follow_collector: Creates connection, updates to MUTUAL if reciprocal
CREATE OR REPLACE FUNCTION public.follow_collector(p_target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_user UUID := auth.uid();
  v_existing_follow RECORD;
  v_reverse_follow RECORD;
BEGIN
  -- Validate
  IF v_current_user IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;
  
  IF v_current_user = p_target_user_id THEN
    RETURN jsonb_build_object('error', 'Cannot follow yourself');
  END IF;
  
  -- Check if target profile exists and is public
  IF NOT EXISTS (
    SELECT 1 FROM collector_profiles 
    WHERE user_id = p_target_user_id AND is_public = true
  ) THEN
    RETURN jsonb_build_object('error', 'Profile not found or is private');
  END IF;
  
  -- Check if already following
  SELECT * INTO v_existing_follow
  FROM collector_connections
  WHERE follower_id = v_current_user AND following_id = p_target_user_id;
  
  IF v_existing_follow IS NOT NULL THEN
    RETURN jsonb_build_object('error', 'Already following this collector');
  END IF;
  
  -- Check if they follow us (for mutual status)
  SELECT * INTO v_reverse_follow
  FROM collector_connections
  WHERE follower_id = p_target_user_id AND following_id = v_current_user;
  
  -- Create the follow
  INSERT INTO collector_connections (follower_id, following_id, status)
  VALUES (v_current_user, p_target_user_id, 
    CASE WHEN v_reverse_follow IS NOT NULL THEN 'MUTUAL' ELSE 'FOLLOWING' END
  );
  
  -- Update reverse connection to mutual if exists
  IF v_reverse_follow IS NOT NULL THEN
    UPDATE collector_connections
    SET status = 'MUTUAL'
    WHERE id = v_reverse_follow.id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'status', CASE WHEN v_reverse_follow IS NOT NULL THEN 'MUTUAL' ELSE 'FOLLOWING' END
  );
END;
$$;

-- 2.4 unfollow_collector: Removes connection
CREATE OR REPLACE FUNCTION public.unfollow_collector(p_target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_user UUID := auth.uid();
  v_connection RECORD;
BEGIN
  -- Validate
  IF v_current_user IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;
  
  -- Find and delete the connection
  DELETE FROM collector_connections
  WHERE follower_id = v_current_user AND following_id = p_target_user_id
  RETURNING * INTO v_connection;
  
  IF v_connection IS NULL THEN
    RETURN jsonb_build_object('error', 'Not following this collector');
  END IF;
  
  -- If it was mutual, update the reverse connection back to FOLLOWING
  UPDATE collector_connections
  SET status = 'FOLLOWING'
  WHERE follower_id = p_target_user_id 
    AND following_id = v_current_user 
    AND status = 'MUTUAL';
  
  RETURN jsonb_build_object('success', true);
END;
$$;

-- 2.5 get_collector_collection: Returns public cards for viewing another user's collection
CREATE OR REPLACE FUNCTION public.get_collector_collection(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile RECORD;
  v_current_user UUID := auth.uid();
  v_cards JSONB := '[]'::JSONB;
BEGIN
  -- Get profile
  SELECT * INTO v_profile
  FROM collector_profiles
  WHERE user_id = p_user_id;
  
  IF v_profile IS NULL THEN
    RETURN jsonb_build_object('error', 'Profile not found');
  END IF;
  
  -- Check if profile is public or owned by current user
  IF NOT v_profile.is_public AND v_current_user != p_user_id THEN
    RETURN jsonb_build_object('error', 'Profile is private');
  END IF;
  
  -- Get revealed cards
  SELECT COALESCE(jsonb_agg(card_data ORDER BY r.created_at DESC), '[]'::JSONB)
  INTO v_cards
  FROM (
    SELECT jsonb_build_object(
      'id', r.id,
      'product_class_id', r.product_class_id,
      'band', r.band,
      'is_golden', r.is_golden,
      'serial_number', r.serial_number,
      'revealed_at', r.revealed_at,
      'product', jsonb_build_object(
        'id', pc.id,
        'name', pc.name,
        'brand', pc.brand,
        'model', pc.model,
        'category', pc.category,
        'retail_value_usd', pc.retail_value_usd,
        'image_url', pc.image_url
      )
    ) AS card_data,
    r.created_at
    FROM reveals r
    JOIN product_classes pc ON pc.id = r.product_class_id
    WHERE r.user_id = p_user_id AND r.revealed_at IS NOT NULL
  ) AS r;
  
  RETURN jsonb_build_object(
    'user_id', p_user_id,
    'username', v_profile.username,
    'display_name', v_profile.display_name,
    'cards', v_cards,
    'card_count', jsonb_array_length(v_cards)
  );
END;
$$;

-- 2.6 get_collectors_list: Filter by all/following/followers/mutual
CREATE OR REPLACE FUNCTION public.get_collectors_list(p_filter TEXT DEFAULT 'all', p_limit INT DEFAULT 50)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_user UUID := auth.uid();
  v_results JSONB := '[]'::JSONB;
  v_collector RECORD;
  v_score_data JSONB;
BEGIN
  IF p_filter = 'following' THEN
    -- Users I follow
    FOR v_collector IN
      SELECT cp.*
      FROM collector_profiles cp
      JOIN collector_connections cc ON cc.following_id = cp.user_id
      WHERE cc.follower_id = v_current_user
      ORDER BY cc.created_at DESC
      LIMIT p_limit
    LOOP
      v_score_data := get_collector_score(v_collector.user_id);
      v_results := v_results || jsonb_build_object(
        'user_id', v_collector.user_id,
        'username', v_collector.username,
        'display_name', v_collector.display_name,
        'avatar_url', v_collector.avatar_url,
        'score', v_score_data->'score',
        'card_count', v_score_data->'card_count',
        'connection_status', 'FOLLOWING'
      );
    END LOOP;
    
  ELSIF p_filter = 'followers' THEN
    -- Users who follow me
    FOR v_collector IN
      SELECT cp.*, cc.status
      FROM collector_profiles cp
      JOIN collector_connections cc ON cc.follower_id = cp.user_id
      WHERE cc.following_id = v_current_user
      ORDER BY cc.created_at DESC
      LIMIT p_limit
    LOOP
      v_score_data := get_collector_score(v_collector.user_id);
      v_results := v_results || jsonb_build_object(
        'user_id', v_collector.user_id,
        'username', v_collector.username,
        'display_name', v_collector.display_name,
        'avatar_url', v_collector.avatar_url,
        'score', v_score_data->'score',
        'card_count', v_score_data->'card_count',
        'connection_status', v_collector.status
      );
    END LOOP;
    
  ELSIF p_filter = 'mutual' THEN
    -- Mutual connections (friends)
    FOR v_collector IN
      SELECT cp.*
      FROM collector_profiles cp
      JOIN collector_connections cc ON cc.following_id = cp.user_id
      WHERE cc.follower_id = v_current_user AND cc.status = 'MUTUAL'
      ORDER BY cc.created_at DESC
      LIMIT p_limit
    LOOP
      v_score_data := get_collector_score(v_collector.user_id);
      v_results := v_results || jsonb_build_object(
        'user_id', v_collector.user_id,
        'username', v_collector.username,
        'display_name', v_collector.display_name,
        'avatar_url', v_collector.avatar_url,
        'score', v_score_data->'score',
        'card_count', v_score_data->'card_count',
        'connection_status', 'MUTUAL'
      );
    END LOOP;
    
  ELSE
    -- All public collectors (sorted by score)
    FOR v_collector IN
      SELECT cp.*
      FROM collector_profiles cp
      WHERE cp.is_public = true
      LIMIT p_limit
    LOOP
      v_score_data := get_collector_score(v_collector.user_id);
      v_results := v_results || jsonb_build_object(
        'user_id', v_collector.user_id,
        'username', v_collector.username,
        'display_name', v_collector.display_name,
        'avatar_url', v_collector.avatar_url,
        'score', v_score_data->'score',
        'card_count', v_score_data->'card_count'
      );
    END LOOP;
    
    -- Sort by score descending
    SELECT COALESCE(jsonb_agg(elem ORDER BY (elem->>'score')::INT DESC), '[]'::JSONB)
    INTO v_results
    FROM jsonb_array_elements(v_results) AS elem;
  END IF;
  
  RETURN v_results;
END;
$$;