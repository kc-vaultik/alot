-- Phase 3: Lottery Room Entry Schema & RPC Functions

-- 1. Modify room_entries table for lottery system
ALTER TABLE public.room_entries 
ADD COLUMN IF NOT EXISTS amount_spent_cents bigint NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS tickets integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS outcome text NOT NULL DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS credits_converted integer DEFAULT 0;

-- Add constraint for outcome values
ALTER TABLE public.room_entries DROP CONSTRAINT IF EXISTS room_entries_outcome_check;
ALTER TABLE public.room_entries ADD CONSTRAINT room_entries_outcome_check 
CHECK (outcome IN ('PENDING', 'WON', 'REFUNDED', 'CONVERTED'));

-- 2. Create room_entry_purchases table (tracks individual purchases)
CREATE TABLE IF NOT EXISTS public.room_entry_purchases (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  entry_id uuid REFERENCES public.room_entries(id) ON DELETE CASCADE,
  amount_cents bigint NOT NULL,
  tickets_granted integer NOT NULL,
  stripe_session_id text,
  stripe_payment_intent_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Indexes for room_entry_purchases
CREATE INDEX IF NOT EXISTS idx_room_entry_purchases_room_id ON public.room_entry_purchases(room_id);
CREATE INDEX IF NOT EXISTS idx_room_entry_purchases_user_id ON public.room_entry_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_room_entry_purchases_stripe_session ON public.room_entry_purchases(stripe_session_id);

-- RLS for room_entry_purchases
ALTER TABLE public.room_entry_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own purchases" ON public.room_entry_purchases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view room purchase counts" ON public.room_entry_purchases
  FOR SELECT USING (true);

-- 3. Create lottery_draws audit table
CREATE TABLE IF NOT EXISTS public.lottery_draws (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  winner_entry_id uuid REFERENCES public.room_entries(id),
  winner_user_id uuid,
  total_tickets integer NOT NULL,
  winning_ticket_number integer NOT NULL,
  random_seed text,
  drawn_at timestamp with time zone NOT NULL DEFAULT now()
);

-- RLS for lottery_draws
ALTER TABLE public.lottery_draws ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view lottery draws" ON public.lottery_draws
  FOR SELECT USING (true);

-- 4. RPC: buy_room_entry - Process entry purchase, create tickets, update funding
CREATE OR REPLACE FUNCTION public.buy_room_entry(
  p_room_id uuid,
  p_amount_cents bigint,
  p_stripe_session_id text DEFAULT NULL,
  p_stripe_payment_intent_id text DEFAULT NULL
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
  -- Get authenticated user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
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

-- 5. RPC: draw_room_winner - Weighted random selection
CREATE OR REPLACE FUNCTION public.draw_room_winner(p_room_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room rooms%ROWTYPE;
  v_total_tickets integer;
  v_winning_ticket integer;
  v_running_total integer := 0;
  v_winner_entry room_entries%ROWTYPE;
  v_random_seed text;
  v_entry RECORD;
BEGIN
  -- Get room
  SELECT * INTO v_room FROM rooms WHERE id = p_room_id FOR UPDATE;
  IF v_room IS NULL THEN
    RAISE EXCEPTION 'Room not found';
  END IF;
  IF v_room.status != 'FUNDED' THEN
    RAISE EXCEPTION 'Room must be fully funded to draw winner';
  END IF;

  -- Update status to DRAWING
  UPDATE rooms SET status = 'DRAWING' WHERE id = p_room_id;

  -- Get total tickets
  SELECT COALESCE(SUM(tickets), 0) INTO v_total_tickets
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
    'You Won!',
    'Congratulations! You won the lottery room!',
    jsonb_build_object('room_id', p_room_id, 'tickets', v_winner_entry.tickets, 'total_tickets', v_total_tickets)
  );

  RETURN jsonb_build_object(
    'success', true,
    'winner_entry_id', v_winner_entry.id,
    'winner_user_id', v_winner_entry.user_id,
    'winning_ticket', v_winning_ticket,
    'total_tickets', v_total_tickets,
    'winner_tickets', v_winner_entry.tickets,
    'win_probability', round((v_winner_entry.tickets::numeric / v_total_tickets::numeric) * 100, 2)
  );
END;
$$;

-- 6. RPC: reveal_mystery_product - Assign product to mystery room
CREATE OR REPLACE FUNCTION public.reveal_mystery_product(p_room_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room rooms%ROWTYPE;
  v_product product_classes%ROWTYPE;
BEGIN
  -- Get room
  SELECT * INTO v_room FROM rooms WHERE id = p_room_id FOR UPDATE;
  IF v_room IS NULL THEN
    RAISE EXCEPTION 'Room not found';
  END IF;
  IF NOT v_room.is_mystery THEN
    RAISE EXCEPTION 'Not a mystery room';
  END IF;
  IF v_room.mystery_product_id IS NOT NULL THEN
    -- Already revealed, return existing product
    SELECT * INTO v_product FROM product_classes WHERE id = v_room.mystery_product_id;
    RETURN jsonb_build_object('success', true, 'product', row_to_json(v_product), 'already_revealed', true);
  END IF;

  -- Select random product matching room tier
  SELECT * INTO v_product 
  FROM product_classes 
  WHERE is_active = true 
    AND band = v_room.tier::rarity_band
  ORDER BY random() 
  LIMIT 1;

  IF v_product IS NULL THEN
    RAISE EXCEPTION 'No products available for this tier';
  END IF;

  -- Update room with revealed product
  UPDATE rooms SET 
    mystery_product_id = v_product.id,
    product_class_id = v_product.id
  WHERE id = p_room_id;

  RETURN jsonb_build_object(
    'success', true,
    'product', row_to_json(v_product),
    'already_revealed', false
  );
END;
$$;

-- 7. RPC: convert_to_credits - Convert entry to 1.5x credits
CREATE OR REPLACE FUNCTION public.convert_to_credits(p_room_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_entry room_entries%ROWTYPE;
  v_room rooms%ROWTYPE;
  v_credits_to_add integer;
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
  IF v_room.status NOT IN ('SETTLED', 'EXPIRED', 'REFUNDING') THEN
    RAISE EXCEPTION 'Room must be settled or expired to convert credits';
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
  IF v_entry.outcome = 'WON' THEN
    RAISE EXCEPTION 'Winners cannot convert to credits';
  END IF;

  -- Calculate credits (1.5x multiplier, amount in cents -> credits)
  v_credits_to_add := (v_entry.amount_spent_cents * 1.5 / 100)::integer;

  -- Add to user's universal credits
  INSERT INTO user_universal_credits (user_id, credits)
  VALUES (v_user_id, v_credits_to_add)
  ON CONFLICT (user_id) DO UPDATE SET
    credits = user_universal_credits.credits + v_credits_to_add,
    updated_at = now();

  -- Update entry outcome
  UPDATE room_entries SET 
    outcome = 'CONVERTED',
    credits_converted = v_credits_to_add
  WHERE id = v_entry.id;

  RETURN jsonb_build_object(
    'success', true,
    'credits_converted', v_credits_to_add,
    'amount_spent_cents', v_entry.amount_spent_cents,
    'multiplier', 1.5
  );
END;
$$;

-- 8. RPC: request_room_refund - Mark entry for refund (actual refund via Stripe edge function)
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

  -- Mark as refunded (actual refund handled by edge function)
  UPDATE room_entries SET outcome = 'REFUNDED' WHERE id = v_entry.id;

  RETURN jsonb_build_object(
    'success', true,
    'entry_id', v_entry.id,
    'refund_amount_cents', v_entry.amount_spent_cents,
    'message', 'Refund request submitted. Funds will be returned to your original payment method.'
  );
END;
$$;

-- 9. RPC: get_room_details - Get full room info with product and stats
CREATE OR REPLACE FUNCTION public.get_room_details(p_room_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room rooms%ROWTYPE;
  v_product product_classes%ROWTYPE;
  v_total_tickets integer;
  v_participant_count integer;
  v_user_entry room_entries%ROWTYPE;
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();

  -- Get room
  SELECT * INTO v_room FROM rooms WHERE id = p_room_id;
  IF v_room IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Room not found');
  END IF;

  -- Get product (either direct or mystery revealed)
  IF v_room.product_class_id IS NOT NULL THEN
    SELECT * INTO v_product FROM product_classes WHERE id = v_room.product_class_id;
  END IF;

  -- Get stats
  SELECT COALESCE(SUM(tickets), 0), COUNT(*) 
  INTO v_total_tickets, v_participant_count
  FROM room_entries WHERE room_id = p_room_id;

  -- Get user's entry if authenticated
  IF v_user_id IS NOT NULL THEN
    SELECT * INTO v_user_entry FROM room_entries 
    WHERE room_id = p_room_id AND user_id = v_user_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'room', row_to_json(v_room),
    'product', CASE WHEN v_product.id IS NOT NULL THEN row_to_json(v_product) ELSE NULL END,
    'is_product_revealed', v_room.product_class_id IS NOT NULL,
    'total_tickets', v_total_tickets,
    'participant_count', v_participant_count,
    'funding_progress', CASE 
      WHEN v_room.funding_target_cents > 0 THEN 
        round((v_room.escrow_balance_cents::numeric / v_room.funding_target_cents::numeric) * 100, 2)
      ELSE 0 
    END,
    'my_entry', CASE WHEN v_user_entry.id IS NOT NULL THEN jsonb_build_object(
      'id', v_user_entry.id,
      'tickets', v_user_entry.tickets,
      'amount_spent_cents', v_user_entry.amount_spent_cents,
      'outcome', v_user_entry.outcome,
      'win_probability', CASE 
        WHEN v_total_tickets > 0 THEN round((v_user_entry.tickets::numeric / v_total_tickets::numeric) * 100, 2)
        ELSE 0
      END
    ) ELSE NULL END
  );
END;
$$;

-- Add unique constraint for room_entries (one entry per user per room)
ALTER TABLE public.room_entries DROP CONSTRAINT IF EXISTS room_entries_room_user_unique;
ALTER TABLE public.room_entries ADD CONSTRAINT room_entries_room_user_unique UNIQUE (room_id, user_id);