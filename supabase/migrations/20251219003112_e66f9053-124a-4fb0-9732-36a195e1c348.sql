-- Drop existing function and recreate with correct structure
DROP FUNCTION IF EXISTS public.get_room_entry_by_session(TEXT);

CREATE FUNCTION public.get_room_entry_by_session(p_session_id TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSON;
  v_purchase RECORD;
  v_room RECORD;
  v_product RECORD;
  v_user_total_tickets INT;
  v_total_room_tickets INT;
BEGIN
  -- Find the purchase by stripe_session_id
  SELECT rep.*, re.tickets, re.user_id, re.id as entry_id
  INTO v_purchase
  FROM room_entry_purchases rep
  JOIN room_entries re ON re.id = rep.entry_id
  WHERE rep.stripe_session_id = p_session_id
  ORDER BY rep.created_at DESC
  LIMIT 1;

  IF v_purchase IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Purchase not found');
  END IF;

  -- Get room details
  SELECT r.id, r.tier, r.status, r.start_at, r.end_at, r.deadline_at,
         r.escrow_balance_cents, r.escrow_target_cents, r.funding_target_cents,
         r.tier_cap_cents, r.max_participants, r.min_participants,
         r.is_mystery, r.category, r.product_class_id, r.mystery_product_id
  INTO v_room
  FROM rooms r
  WHERE r.id = v_purchase.room_id;

  IF v_room IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Room not found');
  END IF;

  -- Get product details (use mystery_product_id if is_mystery, otherwise product_class_id)
  SELECT pc.id, pc.name, pc.brand, pc.model, pc.image_url, 
         pc.retail_value_usd, pc.category::text, pc.band::text
  INTO v_product
  FROM product_classes pc
  WHERE pc.id = COALESCE(
    CASE WHEN v_room.is_mystery THEN v_room.mystery_product_id ELSE v_room.product_class_id END,
    v_room.product_class_id
  );

  -- Calculate user's total tickets in this room
  SELECT COALESCE(SUM(re.tickets), 0)
  INTO v_user_total_tickets
  FROM room_entries re
  WHERE re.room_id = v_purchase.room_id
    AND re.user_id = v_purchase.user_id;

  -- Calculate total tickets in room
  SELECT COALESCE(SUM(re.tickets), 0)
  INTO v_total_room_tickets
  FROM room_entries re
  WHERE re.room_id = v_purchase.room_id;

  -- Build and return the result
  v_result := json_build_object(
    'success', true,
    'room_id', v_room.id,
    'room', json_build_object(
      'id', v_room.id,
      'tier', v_room.tier,
      'status', v_room.status,
      'start_at', v_room.start_at,
      'end_at', v_room.end_at,
      'deadline_at', v_room.deadline_at,
      'escrow_balance_cents', v_room.escrow_balance_cents,
      'escrow_target_cents', v_room.escrow_target_cents,
      'funding_target_cents', v_room.funding_target_cents,
      'tier_cap_cents', v_room.tier_cap_cents,
      'max_participants', v_room.max_participants,
      'min_participants', v_room.min_participants,
      'is_mystery', v_room.is_mystery,
      'category', v_room.category
    ),
    'product', CASE 
      WHEN v_product IS NOT NULL THEN json_build_object(
        'id', v_product.id,
        'name', v_product.name,
        'brand', v_product.brand,
        'model', v_product.model,
        'image_url', v_product.image_url,
        'retail_value_usd', v_product.retail_value_usd,
        'category', v_product.category,
        'band', v_product.band
      )
      ELSE NULL
    END,
    'tickets_purchased', v_purchase.tickets_granted,
    'user_total_tickets', v_user_total_tickets,
    'total_room_tickets', v_total_room_tickets,
    'amount_cents', v_purchase.amount_cents
  );

  RETURN v_result;
END;
$$;