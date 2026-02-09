
-- Update buy_room_entry to create a reveal/card when purchasing room entry
-- The card will be visible in vault with 'staked' state (locked/in play)

CREATE OR REPLACE FUNCTION public.buy_room_entry(
  p_room_id uuid, 
  p_amount_cents bigint, 
  p_stripe_session_id text DEFAULT NULL::text, 
  p_stripe_payment_intent_id text DEFAULT NULL::text, 
  p_user_id uuid DEFAULT NULL::uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid;
  v_room rooms%ROWTYPE;
  v_product product_classes%ROWTYPE;
  v_entry_id uuid;
  v_reveal_id uuid;
  v_tickets integer;
  v_new_balance bigint;
  v_funding_progress numeric;
  v_serial text;
  v_existing_entry room_entries%ROWTYPE;
BEGIN
  -- Get user id from parameter or auth context
  v_user_id := COALESCE(p_user_id, auth.uid());
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User ID required (either via parameter or authentication)';
  END IF;

  -- Get room and verify it's open
  SELECT * INTO v_room FROM rooms WHERE id = p_room_id FOR UPDATE;
  IF v_room IS NULL THEN
    RAISE EXCEPTION 'Room not found';
  END IF;
  IF v_room.status != 'OPEN' THEN
    RAISE EXCEPTION 'Room is not open for entries';
  END IF;
  IF v_room.product_class_id IS NULL THEN
    RAISE EXCEPTION 'Room has no product configured';
  END IF;

  -- Get product details for the reveal
  SELECT * INTO v_product FROM product_classes WHERE id = v_room.product_class_id;
  IF v_product IS NULL THEN
    RAISE EXCEPTION 'Room product not found';
  END IF;

  -- Calculate tickets (1 ticket per $1)
  v_tickets := (p_amount_cents / 100)::integer;
  IF v_tickets < 1 THEN
    RAISE EXCEPTION 'Minimum entry is $1';
  END IF;

  -- Check if user already has an entry in this room
  SELECT * INTO v_existing_entry 
  FROM room_entries 
  WHERE room_id = p_room_id AND user_id = v_user_id;

  IF v_existing_entry IS NOT NULL THEN
    -- User already has entry - just add more tickets (no new card needed)
    UPDATE room_entries SET
      amount_spent_cents = amount_spent_cents + p_amount_cents,
      tickets = tickets + v_tickets,
      stake_snapshot = jsonb_set(
        stake_snapshot, 
        '{total_amount_cents}', 
        to_jsonb(amount_spent_cents + p_amount_cents)
      )
    WHERE id = v_existing_entry.id
    RETURNING id INTO v_entry_id;
    
    v_reveal_id := v_existing_entry.reveal_id;
  ELSE
    -- First entry for this user - create a reveal/card
    -- Generate unique serial number for this card
    v_serial := 'RM-' || substr(md5(random()::text || clock_timestamp()::text), 1, 8);

    -- Create the reveal (card) with staked state
    INSERT INTO reveals (
      user_id,
      product_class_id,
      band,
      serial_number,
      card_state,
      staked_room_id,
      staked_at,
      revealed_at,
      is_golden,
      is_award,
      credits_awarded,
      product_credits_awarded,
      universal_credits_awarded,
      redeem_credits_cents,
      priority_points,
      card_data
    ) VALUES (
      v_user_id,
      v_room.product_class_id,
      v_product.band,
      v_serial,
      'staked',           -- Card is locked/in play
      p_room_id,          -- Link to the room
      now(),              -- When it was staked
      now(),              -- Revealed immediately
      false,              -- Not golden
      false,              -- Not an award
      0,                  -- No credits yet
      0,
      0,
      0,                  -- No redeem credits yet (will be set on settlement)
      0,
      jsonb_build_object(
        'source', 'room_entry',
        'room_tier', v_room.tier,
        'entry_amount_cents', p_amount_cents
      )
    ) RETURNING id INTO v_reveal_id;

    -- Create the room entry linked to the reveal
    INSERT INTO room_entries (
      room_id, 
      user_id, 
      reveal_id,
      stake_snapshot, 
      amount_spent_cents, 
      tickets, 
      status, 
      outcome
    ) VALUES (
      p_room_id, 
      v_user_id, 
      v_reveal_id,  -- Link to the reveal/card
      jsonb_build_object(
        'entry_type', 'card_entry',
        'amount_cents', p_amount_cents,
        'product_name', v_product.name,
        'product_band', v_product.band
      ),
      p_amount_cents,
      v_tickets,
      'STAKED',
      'PENDING'
    ) RETURNING id INTO v_entry_id;
  END IF;

  -- Record individual purchase
  INSERT INTO room_entry_purchases (
    room_id, 
    user_id, 
    entry_id, 
    amount_cents, 
    tickets_granted, 
    stripe_session_id, 
    stripe_payment_intent_id
  ) VALUES (
    p_room_id, 
    v_user_id, 
    v_entry_id, 
    p_amount_cents, 
    v_tickets, 
    p_stripe_session_id, 
    p_stripe_payment_intent_id
  );

  -- Update room funding balance
  UPDATE rooms 
  SET escrow_balance_cents = escrow_balance_cents + p_amount_cents
  WHERE id = p_room_id
  RETURNING escrow_balance_cents INTO v_new_balance;

  -- Calculate funding progress
  v_funding_progress := CASE 
    WHEN v_room.funding_target_cents > 0 THEN 
      (v_new_balance::numeric / v_room.funding_target_cents::numeric) * 100
    ELSE 0 
  END;

  -- Check if room is now fully funded
  IF v_new_balance >= v_room.funding_target_cents THEN
    UPDATE rooms SET status = 'FUNDED' WHERE id = p_room_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'entry_id', v_entry_id,
    'reveal_id', v_reveal_id,
    'tickets_granted', v_tickets,
    'total_tickets', (SELECT tickets FROM room_entries WHERE id = v_entry_id),
    'funding_progress', round(v_funding_progress, 2),
    'room_status', (SELECT status FROM rooms WHERE id = p_room_id),
    'card_created', v_existing_entry IS NULL
  );
END;
$function$;

-- Add comment for documentation
COMMENT ON FUNCTION public.buy_room_entry IS 'Creates a room entry with an associated reveal/card. First entry creates a new card with staked state visible in vault. Additional purchases add tickets to existing entry.';
