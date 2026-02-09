-- Refactor get_active_rooms for cleaner structure and maintainability
DROP FUNCTION IF EXISTS public.get_active_rooms(text);

CREATE FUNCTION public.get_active_rooms(p_tier text DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- Use CTEs for clean separation of concerns
  WITH 
    -- CTE 1: Calculate room statistics from entries
    room_stats AS (
      SELECT 
        re.room_id,
        COUNT(DISTINCT re.user_id) AS participant_count,
        COALESCE(SUM(re.tickets), 0) AS total_tickets
      FROM room_entries re
      WHERE re.status = 'STAKED'
      GROUP BY re.room_id
    ),
    
    -- CTE 2: Build product JSON for non-mystery rooms
    product_data AS (
      SELECT 
        pc.id,
        jsonb_build_object(
          'id', pc.id,
          'name', pc.name,
          'brand', pc.brand,
          'model', pc.model,
          'category', pc.category::text,
          'retail_value_usd', pc.retail_value_usd,
          'image_url', pc.image_url,
          'band', pc.band::text
        ) AS product_json
      FROM product_classes pc
      WHERE pc.is_active = true
    ),
    
    -- CTE 3: Combine rooms with stats and product data
    enriched_rooms AS (
      SELECT 
        -- Core room fields
        r.id,
        r.tier,
        r.tier_cap_cents,
        r.category,
        r.status,
        r.start_at,
        r.end_at,
        r.lock_at,
        r.deadline_at,
        r.min_participants,
        r.max_participants,
        r.escrow_target_cents,
        r.escrow_balance_cents,
        r.funding_target_cents,
        r.reward_budget_cents,
        r.leaderboard_visibility,
        r.is_mystery,
        r.product_class_id,
        r.mystery_product_id,
        r.created_at,
        -- Computed stats (default to 0 if no entries)
        COALESCE(rs.participant_count, 0) AS participant_count,
        COALESCE(rs.total_tickets, 0) AS total_tickets,
        -- Product data (null for mystery rooms)
        pd.product_json AS product
      FROM rooms r
      LEFT JOIN room_stats rs ON rs.room_id = r.id
      LEFT JOIN product_data pd ON pd.id = r.product_class_id
      WHERE r.status IN ('OPEN', 'ACTIVE')
        AND (p_tier IS NULL OR r.tier = p_tier)
      ORDER BY r.created_at DESC
    )
  
  -- Build final response
  SELECT jsonb_build_object(
    'rooms', COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', er.id,
          'tier', er.tier,
          'tier_cap_cents', er.tier_cap_cents,
          'category', er.category,
          'status', er.status,
          'start_at', er.start_at,
          'end_at', er.end_at,
          'lock_at', er.lock_at,
          'deadline_at', er.deadline_at,
          'min_participants', er.min_participants,
          'max_participants', er.max_participants,
          'escrow_target_cents', er.escrow_target_cents,
          'escrow_balance_cents', er.escrow_balance_cents,
          'funding_target_cents', er.funding_target_cents,
          'reward_budget_cents', er.reward_budget_cents,
          'leaderboard_visibility', er.leaderboard_visibility,
          'is_mystery', er.is_mystery,
          'product_class_id', er.product_class_id,
          'mystery_product_id', er.mystery_product_id,
          'created_at', er.created_at,
          'participant_count', er.participant_count,
          'total_tickets', er.total_tickets,
          'product', er.product
        )
      ),
      '[]'::jsonb
    )
  )
  INTO v_result
  FROM enriched_rooms er;

  RETURN v_result;
END;
$$;

-- Add function comment for documentation
COMMENT ON FUNCTION public.get_active_rooms(text) IS 
'Fetches active lottery rooms with product info and participation stats.
Parameters:
  - p_tier: Optional tier filter (ICON, RARE, GRAIL, MYTHIC)
Returns:
  - JSON object with rooms array containing room details, product info, and stats';