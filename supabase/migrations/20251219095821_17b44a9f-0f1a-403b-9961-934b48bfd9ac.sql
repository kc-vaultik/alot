-- Phase 6: Economy Model Update - Winner Settlement & Loser Credit Pool
-- Updates the lottery room settlement to implement the new economy rules:
-- 1. Winner's redeem_credits_cents for that product resets to 0
-- 2. Loser pool = 10% of product value, distributed pro-rata by spend
-- 3. Room expiry: 98% cash refund (2% platform fee)

-- 1. Updated draw_room_winner with loser credit pool distribution
CREATE OR REPLACE FUNCTION public.draw_room_winner(p_room_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room rooms%ROWTYPE;
  v_product product_classes%ROWTYPE;
  v_total_tickets integer;
  v_total_spent_cents bigint;
  v_winning_ticket integer;
  v_running_total integer := 0;
  v_winner_entry room_entries%ROWTYPE;
  v_random_seed text;
  v_entry RECORD;
  v_loser_pool_cents bigint;
  v_credits_for_loser integer;
  v_loser_results jsonb := '[]'::jsonb;
BEGIN
  -- Get room
  SELECT * INTO v_room FROM rooms WHERE id = p_room_id FOR UPDATE;
  IF v_room IS NULL THEN
    RAISE EXCEPTION 'Room not found';
  END IF;
  IF v_room.status != 'FUNDED' THEN
    RAISE EXCEPTION 'Room must be fully funded to draw winner';
  END IF;

  -- Get product info for loser pool calculation
  SELECT * INTO v_product FROM product_classes WHERE id = v_room.product_class_id;
  IF v_product IS NULL THEN
    RAISE EXCEPTION 'Product not found for room';
  END IF;

  -- Update status to DRAWING
  UPDATE rooms SET status = 'DRAWING' WHERE id = p_room_id;

  -- Get total tickets and total spent
  SELECT COALESCE(SUM(tickets), 0), COALESCE(SUM(amount_spent_cents), 0) 
  INTO v_total_tickets, v_total_spent_cents
  FROM room_entries WHERE room_id = p_room_id AND outcome = 'PENDING';

  IF v_total_tickets = 0 THEN
    RAISE EXCEPTION 'No tickets in room';
  END IF;

  -- Generate random winning ticket number (1 to total_tickets)
  v_random_seed := gen_random_uuid()::text;
  v_winning_ticket := floor(random() * v_total_tickets)::integer + 1;

  -- Find winner by iterating through entries
  FOR v_entry IN 
    SELECT * FROM room_entries 
    WHERE room_id = p_room_id AND outcome = 'PENDING'
    ORDER BY staked_at
  LOOP
    v_running_total := v_running_total + v_entry.tickets;
    IF v_running_total >= v_winning_ticket THEN
      SELECT * INTO v_winner_entry FROM room_entries WHERE id = v_entry.id;
      EXIT;
    END IF;
  END LOOP;

  IF v_winner_entry.id IS NULL THEN
    RAISE EXCEPTION 'Failed to select winner';
  END IF;

  -- Record the draw
  INSERT INTO lottery_draws (room_id, winner_entry_id, winner_user_id, total_tickets, winning_ticket_number, random_seed)
  VALUES (p_room_id, v_winner_entry.id, v_winner_entry.user_id, v_total_tickets, v_winning_ticket, v_random_seed);

  -- Update winner entry
  UPDATE room_entries SET outcome = 'WON' WHERE id = v_winner_entry.id;

  -- WINNER: Reset their redeem_credits_cents for this product to 0
  -- This represents them "cashing in" their credits for the product
  UPDATE reveals 
  SET redeem_credits_cents = 0
  WHERE user_id = v_winner_entry.user_id 
    AND product_class_id = v_room.product_class_id;

  -- Calculate loser pool: 10% of product retail value (in cents)
  v_loser_pool_cents := (v_product.retail_value_usd * 100 * 0.10)::bigint;

  -- Distribute loser credits pro-rata to non-winners
  -- Credits = (user_spent / total_spent_by_losers) * loser_pool
  FOR v_entry IN 
    SELECT re.*, 
           (v_total_spent_cents - v_winner_entry.amount_spent_cents) as total_loser_spent
    FROM room_entries re
    WHERE re.room_id = p_room_id 
      AND re.outcome = 'PENDING' 
      AND re.id != v_winner_entry.id
  LOOP
    -- Calculate pro-rata credits for this loser
    IF v_entry.total_loser_spent > 0 THEN
      v_credits_for_loser := FLOOR(
        (v_entry.amount_spent_cents::numeric / v_entry.total_loser_spent::numeric) * v_loser_pool_cents
      )::integer;
    ELSE
      v_credits_for_loser := 0;
    END IF;

    -- Add credits to user's universal credits (stored as cents, 1 credit = 1 cent = $0.01)
    INSERT INTO user_universal_credits (user_id, credits)
    VALUES (v_entry.user_id, v_credits_for_loser)
    ON CONFLICT (user_id) DO UPDATE SET
      credits = user_universal_credits.credits + v_credits_for_loser,
      updated_at = now();

    -- Update entry with credits awarded and mark as lost
    UPDATE room_entries 
    SET outcome = 'LOST',
        credits_awarded = v_credits_for_loser
    WHERE id = v_entry.id;

    -- Track loser results
    v_loser_results := v_loser_results || jsonb_build_object(
      'user_id', v_entry.user_id,
      'spent_cents', v_entry.amount_spent_cents,
      'credits_awarded', v_credits_for_loser
    );

    -- Notify loser about their credits
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (
      v_entry.user_id,
      'room_loss_credits',
      'Room Ended - Credits Earned',
      format('You earned %s Vault Credits from the lottery room', v_credits_for_loser),
      jsonb_build_object(
        'room_id', p_room_id, 
        'credits_awarded', v_credits_for_loser,
        'spent_cents', v_entry.amount_spent_cents
      )
    );
  END LOOP;

  -- Update room with winner
  UPDATE rooms SET 
    status = 'SETTLED',
    winner_entry_id = v_winner_entry.id,
    winner_user_id = v_winner_entry.user_id
  WHERE id = p_room_id;

  -- Create notification for winner
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (
    v_winner_entry.user_id,
    'room_win',
    'Congratulations - You Won!',
    format('You won the %s! Your entry has been converted to the product.', v_product.name),
    jsonb_build_object(
      'room_id', p_room_id, 
      'product_id', v_product.id,
      'product_name', v_product.name,
      'tickets', v_winner_entry.tickets, 
      'total_tickets', v_total_tickets
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'winner_entry_id', v_winner_entry.id,
    'winner_user_id', v_winner_entry.user_id,
    'winning_ticket', v_winning_ticket,
    'total_tickets', v_total_tickets,
    'winner_tickets', v_winner_entry.tickets,
    'win_probability', round((v_winner_entry.tickets::numeric / v_total_tickets::numeric) * 100, 2),
    'loser_pool_cents', v_loser_pool_cents,
    'loser_results', v_loser_results
  );
END;
$$;

-- 2. Add LOST as valid outcome for room_entries
ALTER TABLE public.room_entries DROP CONSTRAINT IF EXISTS room_entries_outcome_check;
ALTER TABLE public.room_entries ADD CONSTRAINT room_entries_outcome_check 
CHECK (outcome IN ('PENDING', 'WON', 'LOST', 'REFUNDED', 'CONVERTED'));

-- 3. Updated request_room_refund with 98% refund (2% platform fee)
-- The actual refund amount calculation happens in the edge function
-- This RPC just marks the entry for processing
CREATE OR REPLACE FUNCTION public.request_room_refund(p_room_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_entry room_entries%ROWTYPE;
  v_room rooms%ROWTYPE;
  v_refund_amount_cents bigint;
  v_platform_fee_cents bigint;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Get room
  SELECT * INTO v_room FROM rooms WHERE id = p_room_id;
  IF v_room IS NULL THEN
    RAISE EXCEPTION 'Room not found';
  END IF;
  IF v_room.status NOT IN ('EXPIRED', 'REFUNDING') THEN
    RAISE EXCEPTION 'Refunds only available for expired rooms';
  END IF;

  -- Get user's entry
  SELECT * INTO v_entry FROM room_entries 
  WHERE room_id = p_room_id AND user_id = v_user_id FOR UPDATE;
  
  IF v_entry IS NULL THEN
    RAISE EXCEPTION 'No entry found for this room';
  END IF;
  IF v_entry.outcome != 'PENDING' THEN
    RAISE EXCEPTION 'Entry already processed';
  END IF;

  -- Calculate 98% refund (2% platform fee)
  v_platform_fee_cents := FLOOR(v_entry.amount_spent_cents * 0.02);
  v_refund_amount_cents := v_entry.amount_spent_cents - v_platform_fee_cents;

  -- Mark as refunded (actual refund handled by edge function)
  UPDATE room_entries 
  SET outcome = 'REFUNDED',
      credits_awarded = 0  -- No credits minted for expired rooms
  WHERE id = v_entry.id;

  RETURN jsonb_build_object(
    'success', true,
    'entry_id', v_entry.id,
    'original_amount_cents', v_entry.amount_spent_cents,
    'refund_amount_cents', v_refund_amount_cents,
    'platform_fee_cents', v_platform_fee_cents,
    'platform_fee_percent', 2,
    'message', 'Refund request submitted. 98% of funds will be returned to your original payment method.'
  );
END;
$$;

-- 4. Add comment to document the economy model
COMMENT ON FUNCTION public.draw_room_winner IS 
'Lottery room winner selection with economy model v2:
- Winner receives product, their redeem_credits_cents for that product resets to 0
- Loser pool = 10% of product retail value, distributed as Vault Credits pro-rata by spend
- 1 Vault Credit = 1 cent = $0.01';

COMMENT ON FUNCTION public.request_room_refund IS
'Room refund request for expired/unfunded rooms:
- 98% cash refund via Stripe
- 2% platform fee retained
- No Vault Credits minted for expired rooms';