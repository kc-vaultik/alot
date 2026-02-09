-- Fix buy_room_entry to accept user_id parameter for webhook calls
CREATE OR REPLACE FUNCTION public.buy_room_entry(
  p_room_id uuid,
  p_amount_cents bigint,
  p_stripe_session_id text DEFAULT NULL,
  p_stripe_payment_intent_id text DEFAULT NULL,
  p_user_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_room rooms%ROWTYPE;
  v_entry_id uuid;
  v_tickets integer;
  v_new_balance bigint;
  v_funding_progress numeric;
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

  -- Calculate tickets (1 ticket per $1)
  v_tickets := (p_amount_cents / 100)::integer;
  IF v_tickets < 1 THEN
    RAISE EXCEPTION 'Minimum entry is $1';
  END IF;

  -- Create or update room entry for user
  INSERT INTO room_entries (room_id, user_id, reveal_id, stake_snapshot, amount_spent_cents, tickets, status, outcome)
  VALUES (
    p_room_id, 
    v_user_id, 
    gen_random_uuid(), -- Placeholder reveal_id
    jsonb_build_object('entry_type', 'lottery', 'amount_cents', p_amount_cents),
    p_amount_cents,
    v_tickets,
    'STAKED',
    'PENDING'
  )
  ON CONFLICT (room_id, user_id) DO UPDATE SET
    amount_spent_cents = room_entries.amount_spent_cents + p_amount_cents,
    tickets = room_entries.tickets + v_tickets,
    stake_snapshot = jsonb_set(
      room_entries.stake_snapshot, 
      '{total_amount_cents}', 
      to_jsonb(room_entries.amount_spent_cents + p_amount_cents)
    )
  RETURNING id INTO v_entry_id;

  -- Record individual purchase
  INSERT INTO room_entry_purchases (room_id, user_id, entry_id, amount_cents, tickets_granted, stripe_session_id, stripe_payment_intent_id)
  VALUES (p_room_id, v_user_id, v_entry_id, p_amount_cents, v_tickets, p_stripe_session_id, p_stripe_payment_intent_id);

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
    'tickets_granted', v_tickets,
    'total_tickets', (SELECT tickets FROM room_entries WHERE id = v_entry_id),
    'funding_progress', round(v_funding_progress, 2),
    'room_status', (SELECT status FROM rooms WHERE id = p_room_id)
  );
END;
$$;