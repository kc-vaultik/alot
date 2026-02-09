-- Phase 6: Provably Fair Draw Implementation (Fixed)
-- Drop existing function first to change return type

-- Add new columns for provably fair verification
ALTER TABLE public.lottery_draws 
ADD COLUMN IF NOT EXISTS seed_commitment TEXT,
ADD COLUMN IF NOT EXISTS server_seed TEXT,
ADD COLUMN IF NOT EXISTS client_seed TEXT,
ADD COLUMN IF NOT EXISTS nonce INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS verification_hash TEXT;

-- Add index for verification lookups
CREATE INDEX IF NOT EXISTS idx_lottery_draws_verification 
ON public.lottery_draws(verification_hash) 
WHERE verification_hash IS NOT NULL;

-- Drop existing function to change return type
DROP FUNCTION IF EXISTS public.draw_room_winner(UUID);

-- Recreate draw_room_winner with provably fair mechanics
CREATE FUNCTION public.draw_room_winner(p_room_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room RECORD;
  v_total_tickets INTEGER;
  v_winning_ticket INTEGER;
  v_winner_entry RECORD;
  v_server_seed TEXT;
  v_client_seed TEXT;
  v_combined_seed TEXT;
  v_verification_hash TEXT;
  v_draw_id UUID;
BEGIN
  -- Lock and fetch room
  SELECT * INTO v_room
  FROM rooms
  WHERE id = p_room_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Room not found');
  END IF;

  -- Only draw for FUNDED rooms
  IF v_room.status != 'FUNDED' THEN
    RETURN json_build_object('success', false, 'error', 'Room is not in FUNDED status');
  END IF;

  -- Calculate total tickets
  SELECT COALESCE(SUM(tickets), 0) INTO v_total_tickets
  FROM room_entries
  WHERE room_id = p_room_id AND status = 'ACTIVE';

  IF v_total_tickets = 0 THEN
    UPDATE rooms SET status = 'EXPIRED' WHERE id = p_room_id;
    RETURN json_build_object('success', false, 'error', 'No active entries');
  END IF;

  -- Generate provably fair seeds
  v_server_seed := encode(gen_random_bytes(32), 'hex');
  
  v_client_seed := encode(
    sha256(
      (p_room_id::text || v_room.created_at::text || v_total_tickets::text || v_room.escrow_balance_cents::text)::bytea
    ), 
    'hex'
  );
  
  v_combined_seed := encode(
    sha256((v_server_seed || v_client_seed || '0')::bytea),
    'hex'
  );
  
  v_verification_hash := encode(sha256(v_server_seed::bytea), 'hex');
  
  v_winning_ticket := 1 + (('x' || substring(v_combined_seed from 1 for 8))::bit(32)::bigint % v_total_tickets);

  -- Find winner by ticket range
  WITH ticket_ranges AS (
    SELECT 
      id,
      user_id,
      reveal_id,
      tickets,
      SUM(tickets) OVER (ORDER BY staked_at, id) AS upper_bound,
      SUM(tickets) OVER (ORDER BY staked_at, id) - tickets + 1 AS lower_bound
    FROM room_entries
    WHERE room_id = p_room_id AND status = 'ACTIVE'
  )
  SELECT * INTO v_winner_entry
  FROM ticket_ranges
  WHERE v_winning_ticket BETWEEN lower_bound AND upper_bound
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Could not determine winner');
  END IF;

  -- Record the draw
  INSERT INTO lottery_draws (
    room_id, winner_entry_id, winner_user_id, total_tickets,
    winning_ticket_number, random_seed, server_seed, client_seed,
    nonce, verification_hash
  ) VALUES (
    p_room_id, v_winner_entry.id, v_winner_entry.user_id, v_total_tickets,
    v_winning_ticket, v_combined_seed, v_server_seed, v_client_seed,
    0, v_verification_hash
  )
  RETURNING id INTO v_draw_id;

  -- Update room
  UPDATE rooms
  SET status = 'SETTLED', winner_user_id = v_winner_entry.user_id, winner_entry_id = v_winner_entry.id
  WHERE id = p_room_id;

  -- Mark winner
  UPDATE room_entries
  SET status = 'WON', outcome = 'WON', rank = 1
  WHERE id = v_winner_entry.id;

  -- Mark losers
  UPDATE room_entries
  SET status = 'LOST', outcome = 'LOST'
  WHERE room_id = p_room_id AND id != v_winner_entry.id AND status = 'ACTIVE';

  RETURN json_build_object(
    'success', true,
    'draw_id', v_draw_id,
    'winner_user_id', v_winner_entry.user_id,
    'winner_entry_id', v_winner_entry.id,
    'total_tickets', v_total_tickets,
    'winning_ticket', v_winning_ticket,
    'verification_hash', v_verification_hash
  );
END;
$$;

-- Create verification function
CREATE OR REPLACE FUNCTION public.verify_lottery_draw(p_draw_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_draw RECORD;
  v_computed_seed TEXT;
  v_computed_ticket INTEGER;
  v_is_valid BOOLEAN;
BEGIN
  SELECT * INTO v_draw FROM lottery_draws WHERE id = p_draw_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Draw not found');
  END IF;

  IF v_draw.server_seed IS NOT NULL AND v_draw.client_seed IS NOT NULL THEN
    v_computed_seed := encode(
      sha256((v_draw.server_seed || v_draw.client_seed || COALESCE(v_draw.nonce, 0)::text)::bytea),
      'hex'
    );
    v_computed_ticket := 1 + (('x' || substring(v_computed_seed from 1 for 8))::bit(32)::bigint % v_draw.total_tickets);
    v_is_valid := (v_computed_ticket = v_draw.winning_ticket_number);
  ELSE
    v_is_valid := false;
  END IF;

  RETURN json_build_object(
    'success', true,
    'draw_id', v_draw.id,
    'room_id', v_draw.room_id,
    'is_valid', v_is_valid,
    'total_tickets', v_draw.total_tickets,
    'winning_ticket', v_draw.winning_ticket_number,
    'drawn_at', v_draw.drawn_at,
    'server_seed', v_draw.server_seed,
    'client_seed', v_draw.client_seed,
    'verification_hash', v_draw.verification_hash
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_lottery_draw(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_lottery_draw(UUID) TO anon;