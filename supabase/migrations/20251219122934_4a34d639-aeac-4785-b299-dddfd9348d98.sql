-- Phase 1: Add VC → Entries Conversion
-- 1.1 Create audit table for credit-based entry purchases

CREATE TABLE public.room_entry_credit_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.rooms(id),
  user_id UUID NOT NULL,
  entry_id UUID REFERENCES public.room_entries(id),
  credits_spent INTEGER NOT NULL,
  entries_granted INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.room_entry_credit_purchases ENABLE ROW LEVEL SECURITY;

-- Users can view their own credit purchases
CREATE POLICY "Users can view their own credit purchases"
  ON public.room_entry_credit_purchases
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_room_entry_credit_purchases_room_id ON public.room_entry_credit_purchases(room_id);
CREATE INDEX idx_room_entry_credit_purchases_user_id ON public.room_entry_credit_purchases(user_id);

-- 1.2 Create buy_entries_with_credits RPC
-- Conversion rate: 100 VC = 1 Entry (1 VC = $0.01, 1 Entry = $1)

CREATE OR REPLACE FUNCTION public.buy_entries_with_credits(
  p_room_id UUID,
  p_credits_to_spend INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_room RECORD;
  v_current_credits INTEGER;
  v_entries_to_grant INTEGER;
  v_entry_id UUID;
  v_existing_entry RECORD;
  v_result JSON;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Validate credits amount (minimum 100 VC = 1 entry)
  IF p_credits_to_spend < 100 THEN
    RETURN json_build_object('success', false, 'error', 'Minimum 100 Vault Credits required (= 1 entry)');
  END IF;

  -- Calculate entries: 100 VC = 1 Entry
  v_entries_to_grant := p_credits_to_spend / 100;
  
  -- If user tries to spend 150, they get 1 entry (we only use multiples of 100)
  -- Adjust credits_to_spend to actual amount used
  p_credits_to_spend := v_entries_to_grant * 100;

  -- Get room and validate it's open
  SELECT * INTO v_room
  FROM rooms
  WHERE id = p_room_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Room not found');
  END IF;

  IF v_room.status != 'OPEN' THEN
    RETURN json_build_object('success', false, 'error', 'Room is not open for entries');
  END IF;

  -- Check if room is past deadline
  IF v_room.deadline_at IS NOT NULL AND v_room.deadline_at < now() THEN
    RETURN json_build_object('success', false, 'error', 'Room entry deadline has passed');
  END IF;

  -- Get user's current credits
  SELECT credits INTO v_current_credits
  FROM user_universal_credits
  WHERE user_id = v_user_id;

  IF NOT FOUND OR v_current_credits < p_credits_to_spend THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient Vault Credits');
  END IF;

  -- Deduct credits from user
  UPDATE user_universal_credits
  SET credits = credits - p_credits_to_spend,
      updated_at = now()
  WHERE user_id = v_user_id;

  -- Check if user already has an entry in this room
  SELECT * INTO v_existing_entry
  FROM room_entries
  WHERE room_id = p_room_id AND user_id = v_user_id;

  IF FOUND THEN
    -- Update existing entry with more tickets
    UPDATE room_entries
    SET tickets = tickets + v_entries_to_grant
    WHERE id = v_existing_entry.id
    RETURNING id INTO v_entry_id;
  ELSE
    -- Create new entry
    INSERT INTO room_entries (
      room_id,
      user_id,
      tickets,
      stake_snapshot,
      status,
      outcome
    ) VALUES (
      p_room_id,
      v_user_id,
      v_entries_to_grant,
      '{}'::jsonb,
      'ACTIVE',
      'PENDING'
    )
    RETURNING id INTO v_entry_id;
  END IF;

  -- Record the credit purchase for audit
  INSERT INTO room_entry_credit_purchases (
    room_id,
    user_id,
    entry_id,
    credits_spent,
    entries_granted
  ) VALUES (
    p_room_id,
    v_user_id,
    v_entry_id,
    p_credits_to_spend,
    v_entries_to_grant
  );

  -- Update room escrow balance (convert VC to cents: 1 VC = 1 cent)
  UPDATE rooms
  SET escrow_balance_cents = escrow_balance_cents + p_credits_to_spend
  WHERE id = p_room_id;

  -- Build result
  v_result := json_build_object(
    'success', true,
    'entry_id', v_entry_id,
    'credits_spent', p_credits_to_spend,
    'entries_granted', v_entries_to_grant,
    'new_total_entries', (SELECT tickets FROM room_entries WHERE id = v_entry_id),
    'remaining_credits', v_current_credits - p_credits_to_spend
  );

  RETURN v_result;
END;
$$;