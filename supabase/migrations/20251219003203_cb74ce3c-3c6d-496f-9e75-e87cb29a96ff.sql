-- Refactor get_room_entry_by_session to use clean CTE structure
DROP FUNCTION IF EXISTS public.get_room_entry_by_session(TEXT);

CREATE FUNCTION public.get_room_entry_by_session(p_session_id TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    WITH purchase_data AS (
      -- Find purchase by stripe_session_id
      SELECT 
        rep.id AS purchase_id,
        rep.room_id,
        rep.user_id,
        rep.amount_cents,
        rep.tickets_granted,
        rep.entry_id
      FROM room_entry_purchases rep
      WHERE rep.stripe_session_id = p_session_id
      ORDER BY rep.created_at DESC
      LIMIT 1
    ),
    room_data AS (
      -- Get room details with all fields
      SELECT 
        r.id,
        r.tier,
        r.status,
        r.start_at,
        r.end_at,
        r.deadline_at,
        r.escrow_balance_cents,
        r.escrow_target_cents,
        r.funding_target_cents,
        r.tier_cap_cents,
        r.max_participants,
        r.min_participants,
        r.is_mystery,
        r.category,
        r.product_class_id,
        r.mystery_product_id
      FROM rooms r
      WHERE r.id = (SELECT room_id FROM purchase_data)
    ),
    product_data AS (
      -- Get product from product_classes
      SELECT 
        pc.id,
        pc.name,
        pc.brand,
        pc.model,
        pc.image_url,
        pc.retail_value_usd,
        pc.category::text AS category,
        pc.band::text AS band
      FROM product_classes pc
      WHERE pc.id = COALESCE(
        (SELECT CASE WHEN rd.is_mystery THEN rd.mystery_product_id ELSE rd.product_class_id END FROM room_data rd),
        (SELECT product_class_id FROM room_data)
      )
    ),
    user_ticket_stats AS (
      -- Calculate user's total tickets in this room
      SELECT COALESCE(SUM(re.tickets), 0)::int AS user_total_tickets
      FROM room_entries re
      WHERE re.room_id = (SELECT room_id FROM purchase_data)
        AND re.user_id = (SELECT user_id FROM purchase_data)
    ),
    room_ticket_stats AS (
      -- Calculate total tickets in room
      SELECT COALESCE(SUM(re.tickets), 0)::int AS total_room_tickets
      FROM room_entries re
      WHERE re.room_id = (SELECT room_id FROM purchase_data)
    )
    SELECT 
      CASE 
        WHEN pd.purchase_id IS NULL THEN 
          json_build_object('success', false, 'error', 'Purchase not found')
        WHEN rd.id IS NULL THEN 
          json_build_object('success', false, 'error', 'Room not found')
        ELSE
          json_build_object(
            'success', true,
            'room_id', rd.id,
            'room', json_build_object(
              'id', rd.id,
              'tier', rd.tier,
              'status', rd.status,
              'start_at', rd.start_at,
              'end_at', rd.end_at,
              'deadline_at', rd.deadline_at,
              'escrow_balance_cents', rd.escrow_balance_cents,
              'escrow_target_cents', rd.escrow_target_cents,
              'funding_target_cents', rd.funding_target_cents,
              'tier_cap_cents', rd.tier_cap_cents,
              'max_participants', rd.max_participants,
              'min_participants', rd.min_participants,
              'is_mystery', rd.is_mystery,
              'category', rd.category
            ),
            'product', CASE 
              WHEN prd.id IS NOT NULL THEN json_build_object(
                'id', prd.id,
                'name', prd.name,
                'brand', prd.brand,
                'model', prd.model,
                'image_url', prd.image_url,
                'retail_value_usd', prd.retail_value_usd,
                'category', prd.category,
                'band', prd.band
              )
              ELSE NULL
            END,
            'tickets_purchased', pd.tickets_granted,
            'user_total_tickets', uts.user_total_tickets,
            'total_room_tickets', rts.total_room_tickets,
            'amount_cents', pd.amount_cents
          )
      END
    FROM purchase_data pd
    LEFT JOIN room_data rd ON true
    LEFT JOIN product_data prd ON true
    LEFT JOIN user_ticket_stats uts ON true
    LEFT JOIN room_ticket_stats rts ON true
  );
END;
$$;