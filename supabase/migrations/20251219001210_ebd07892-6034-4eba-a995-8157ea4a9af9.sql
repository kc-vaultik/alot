-- Drop and recreate get_active_rooms to include product information
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
  SELECT jsonb_build_object(
    'rooms', COALESCE(jsonb_agg(room_data), '[]'::jsonb)
  )
  INTO v_result
  FROM (
    SELECT 
      jsonb_build_object(
        'id', r.id,
        'tier', r.tier,
        'tier_cap_cents', r.tier_cap_cents,
        'category', r.category,
        'status', r.status,
        'start_at', r.start_at,
        'end_at', r.end_at,
        'lock_at', r.lock_at,
        'deadline_at', r.deadline_at,
        'min_participants', r.min_participants,
        'max_participants', r.max_participants,
        'escrow_target_cents', r.escrow_target_cents,
        'escrow_balance_cents', r.escrow_balance_cents,
        'funding_target_cents', r.funding_target_cents,
        'reward_budget_cents', r.reward_budget_cents,
        'leaderboard_visibility', r.leaderboard_visibility,
        'is_mystery', r.is_mystery,
        'product_class_id', r.product_class_id,
        'mystery_product_id', r.mystery_product_id,
        'participant_count', (
          SELECT COUNT(DISTINCT re.user_id)
          FROM room_entries re
          WHERE re.room_id = r.id AND re.status = 'STAKED'
        ),
        'total_tickets', (
          SELECT COALESCE(SUM(re.tickets), 0)
          FROM room_entries re
          WHERE re.room_id = r.id AND re.status = 'STAKED'
        ),
        'created_at', r.created_at,
        'product', CASE 
          WHEN pc.id IS NOT NULL THEN jsonb_build_object(
            'id', pc.id,
            'name', pc.name,
            'brand', pc.brand,
            'model', pc.model,
            'category', pc.category::text,
            'retail_value_usd', pc.retail_value_usd,
            'image_url', pc.image_url,
            'band', pc.band::text
          )
          ELSE NULL
        END
      ) as room_data
    FROM rooms r
    LEFT JOIN product_classes pc ON r.product_class_id = pc.id
    WHERE r.status IN ('OPEN', 'ACTIVE')
      AND (p_tier IS NULL OR r.tier = p_tier)
    ORDER BY r.created_at DESC
  ) subq;

  RETURN v_result;
END;
$$;