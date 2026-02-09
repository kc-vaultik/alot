-- Function to get room entry data by Stripe session ID
CREATE OR REPLACE FUNCTION public.get_room_entry_by_session(
  p_session_id text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_purchase record;
  v_entry record;
  v_room record;
  v_product record;
  v_result json;
BEGIN
  -- Find the purchase by Stripe session ID
  SELECT * INTO v_purchase
  FROM room_entry_purchases
  WHERE stripe_session_id = p_session_id
  LIMIT 1;
  
  IF v_purchase IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Purchase not found');
  END IF;
  
  -- Get the room entry
  SELECT * INTO v_entry
  FROM room_entries
  WHERE room_id = v_purchase.room_id 
    AND user_id = v_purchase.user_id
  ORDER BY staked_at DESC
  LIMIT 1;
  
  -- Get room details
  SELECT * INTO v_room
  FROM rooms
  WHERE id = v_purchase.room_id;
  
  -- Get product details
  SELECT pc.* INTO v_product
  FROM product_classes pc
  WHERE pc.id = v_room.product_class_id
     OR pc.id = v_room.mystery_product_id;
  
  -- Get total tickets across all entries in room for user
  DECLARE
    v_total_user_tickets int;
    v_total_room_tickets int;
  BEGIN
    SELECT COALESCE(SUM(tickets), 0) INTO v_total_user_tickets
    FROM room_entries
    WHERE room_id = v_purchase.room_id 
      AND user_id = v_purchase.user_id
      AND status IN ('active', 'pending');
    
    SELECT COALESCE(SUM(tickets), 0) INTO v_total_room_tickets
    FROM room_entries
    WHERE room_id = v_purchase.room_id
      AND status IN ('active', 'pending');
    
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
      'product', CASE WHEN v_product IS NOT NULL THEN json_build_object(
        'id', v_product.id,
        'name', v_product.name,
        'brand', v_product.brand,
        'model', v_product.model,
        'image_url', v_product.image_url,
        'retail_value_usd', v_product.retail_value_usd,
        'category', v_product.category,
        'band', v_product.band
      ) ELSE NULL END,
      'tickets_purchased', v_purchase.tickets_granted,
      'user_total_tickets', v_total_user_tickets,
      'total_room_tickets', v_total_room_tickets,
      'amount_cents', v_purchase.amount_cents
    );
    
    RETURN v_result;
  END;
END;
$$;