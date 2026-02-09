-- Update get_active_rooms RPC to filter for lottery rooms only
CREATE OR REPLACE FUNCTION public.get_active_rooms(p_tier TEXT DEFAULT NULL)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'rooms', COALESCE(json_agg(
      json_build_object(
        'id', r.id,
        'tier', r.tier,
        'status', r.status,
        'product_class_id', r.product_class_id,
        'mystery_product_id', r.mystery_product_id,
        'is_mystery', r.is_mystery,
        'category', r.category,
        'start_at', r.start_at,
        'end_at', r.end_at,
        'deadline_at', r.deadline_at,
        'lock_at', r.lock_at,
        'escrow_balance_cents', r.escrow_balance_cents,
        'escrow_target_cents', r.escrow_target_cents,
        'funding_target_cents', r.funding_target_cents,
        'tier_cap_cents', r.tier_cap_cents,
        'min_participants', r.min_participants,
        'max_participants', r.max_participants,
        'leaderboard_visibility', r.leaderboard_visibility,
        'winner_user_id', r.winner_user_id,
        'winner_entry_id', r.winner_entry_id,
        'participant_count', (
          SELECT COUNT(DISTINCT user_id) 
          FROM room_entries re 
          WHERE re.room_id = r.id AND re.status = 'active'
        ),
        'product', CASE 
          WHEN r.is_mystery THEN NULL
          WHEN r.product_class_id IS NOT NULL THEN (
            SELECT json_build_object(
              'id', pc.id,
              'name', pc.name,
              'brand', pc.brand,
              'model', pc.model,
              'image_url', pc.image_url,
              'retail_value_usd', pc.retail_value_usd,
              'category', pc.category,
              'band', pc.band
            )
            FROM product_classes pc
            WHERE pc.id = r.product_class_id
          )
          ELSE NULL
        END
      )
    ), '[]'::json)
  ) INTO result
  FROM rooms r
  WHERE r.status IN ('OPEN', 'FUNDED', 'DRAWING')
    AND r.funding_target_cents IS NOT NULL  -- Only lottery rooms
    AND (p_tier IS NULL OR r.tier = p_tier);

  RETURN result;
END;
$$;