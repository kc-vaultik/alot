-- RPC Function: Create a gift transfer
CREATE OR REPLACE FUNCTION public.create_gift_transfer(
  p_reveal_id uuid,
  p_claim_token text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_transfer_id uuid;
  v_card_exists boolean;
BEGIN
  -- Validate user owns the card
  SELECT EXISTS (
    SELECT 1 FROM reveals 
    WHERE id = p_reveal_id 
    AND user_id = v_user_id 
    AND revealed_at IS NOT NULL
  ) INTO v_card_exists;
  
  IF NOT v_card_exists THEN
    RETURN jsonb_build_object('error', 'You do not own this card or it has not been revealed');
  END IF;
  
  -- Check if card already has a pending transfer
  IF EXISTS (
    SELECT 1 FROM card_transfers 
    WHERE reveal_id = p_reveal_id 
    AND status = 'PENDING'
  ) THEN
    RETURN jsonb_build_object('error', 'This card already has a pending transfer');
  END IF;
  
  -- Create the transfer
  INSERT INTO card_transfers (
    reveal_id, from_user_id, transfer_type, claim_token
  ) VALUES (
    p_reveal_id, v_user_id, 'GIFT', p_claim_token
  ) RETURNING id INTO v_transfer_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'transfer_id', v_transfer_id,
    'claim_token', p_claim_token,
    'expires_at', (now() + interval '7 days')
  );
END;
$$;

-- RPC Function: Create a swap offer (listing card for swap)
CREATE OR REPLACE FUNCTION public.create_swap_offer(
  p_reveal_id uuid,
  p_claim_token text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_transfer_id uuid;
  v_card_exists boolean;
BEGIN
  -- Validate user owns the card
  SELECT EXISTS (
    SELECT 1 FROM reveals 
    WHERE id = p_reveal_id 
    AND user_id = v_user_id 
    AND revealed_at IS NOT NULL
  ) INTO v_card_exists;
  
  IF NOT v_card_exists THEN
    RETURN jsonb_build_object('error', 'You do not own this card or it has not been revealed');
  END IF;
  
  -- Check if card already has a pending transfer
  IF EXISTS (
    SELECT 1 FROM card_transfers 
    WHERE reveal_id = p_reveal_id 
    AND status = 'PENDING'
  ) THEN
    RETURN jsonb_build_object('error', 'This card already has a pending transfer');
  END IF;
  
  -- Create the swap transfer
  INSERT INTO card_transfers (
    reveal_id, from_user_id, transfer_type, claim_token
  ) VALUES (
    p_reveal_id, v_user_id, 'SWAP', p_claim_token
  ) RETURNING id INTO v_transfer_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'transfer_id', v_transfer_id,
    'claim_token', p_claim_token,
    'expires_at', (now() + interval '7 days')
  );
END;
$$;

-- RPC Function: Claim a gift
CREATE OR REPLACE FUNCTION public.claim_gift(
  p_claim_token text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_transfer RECORD;
BEGIN
  -- Get the transfer
  SELECT ct.*, r.user_id as current_owner
  INTO v_transfer
  FROM card_transfers ct
  JOIN reveals r ON r.id = ct.reveal_id
  WHERE ct.claim_token = p_claim_token
  AND ct.transfer_type = 'GIFT'
  FOR UPDATE;
  
  IF v_transfer IS NULL THEN
    RETURN jsonb_build_object('error', 'Invalid or expired gift link');
  END IF;
  
  IF v_transfer.status != 'PENDING' THEN
    RETURN jsonb_build_object('error', 'This gift has already been claimed or cancelled');
  END IF;
  
  IF v_transfer.expires_at < now() THEN
    -- Mark as expired
    UPDATE card_transfers SET status = 'EXPIRED' WHERE id = v_transfer.id;
    RETURN jsonb_build_object('error', 'This gift link has expired');
  END IF;
  
  IF v_transfer.from_user_id = v_user_id THEN
    RETURN jsonb_build_object('error', 'You cannot claim your own gift');
  END IF;
  
  -- Transfer ownership of the card
  UPDATE reveals 
  SET user_id = v_user_id 
  WHERE id = v_transfer.reveal_id;
  
  -- Mark transfer as claimed
  UPDATE card_transfers 
  SET status = 'CLAIMED', 
      to_user_id = v_user_id, 
      claimed_at = now() 
  WHERE id = v_transfer.id;
  
  RETURN jsonb_build_object(
    'success', true,
    'reveal_id', v_transfer.reveal_id,
    'message', 'Gift claimed successfully!'
  );
END;
$$;

-- RPC Function: Claim a swap by offering a card
CREATE OR REPLACE FUNCTION public.claim_swap(
  p_claim_token text,
  p_offered_reveal_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_transfer RECORD;
  v_offered_card_exists boolean;
BEGIN
  -- Get the swap transfer
  SELECT ct.*, r.user_id as current_owner
  INTO v_transfer
  FROM card_transfers ct
  JOIN reveals r ON r.id = ct.reveal_id
  WHERE ct.claim_token = p_claim_token
  AND ct.transfer_type = 'SWAP'
  FOR UPDATE;
  
  IF v_transfer IS NULL THEN
    RETURN jsonb_build_object('error', 'Invalid or expired swap link');
  END IF;
  
  IF v_transfer.status != 'PENDING' THEN
    RETURN jsonb_build_object('error', 'This swap has already been completed or cancelled');
  END IF;
  
  IF v_transfer.expires_at < now() THEN
    UPDATE card_transfers SET status = 'EXPIRED' WHERE id = v_transfer.id;
    RETURN jsonb_build_object('error', 'This swap link has expired');
  END IF;
  
  IF v_transfer.from_user_id = v_user_id THEN
    RETURN jsonb_build_object('error', 'You cannot swap with yourself');
  END IF;
  
  -- Validate user owns the offered card
  SELECT EXISTS (
    SELECT 1 FROM reveals 
    WHERE id = p_offered_reveal_id 
    AND user_id = v_user_id 
    AND revealed_at IS NOT NULL
  ) INTO v_offered_card_exists;
  
  IF NOT v_offered_card_exists THEN
    RETURN jsonb_build_object('error', 'You do not own the card you are offering');
  END IF;
  
  -- Check offered card doesn't have pending transfer
  IF EXISTS (
    SELECT 1 FROM card_transfers 
    WHERE reveal_id = p_offered_reveal_id 
    AND status = 'PENDING'
  ) THEN
    RETURN jsonb_build_object('error', 'Your offered card has a pending transfer');
  END IF;
  
  -- Perform the atomic swap
  -- Give the requester's card to the offerer (original owner)
  UPDATE reveals 
  SET user_id = v_transfer.from_user_id 
  WHERE id = p_offered_reveal_id;
  
  -- Give the offerer's card to the requester (current user)
  UPDATE reveals 
  SET user_id = v_user_id 
  WHERE id = v_transfer.reveal_id;
  
  -- Mark transfer as claimed
  UPDATE card_transfers 
  SET status = 'CLAIMED', 
      to_user_id = v_user_id, 
      claimed_at = now() 
  WHERE id = v_transfer.id;
  
  -- Create a swap_offers record for history
  INSERT INTO swap_offers (
    offerer_transfer_id, receiver_reveal_id, status, resolved_at
  ) VALUES (
    v_transfer.id, p_offered_reveal_id, 'ACCEPTED', now()
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'received_reveal_id', v_transfer.reveal_id,
    'given_reveal_id', p_offered_reveal_id,
    'message', 'Swap completed successfully!'
  );
END;
$$;

-- RPC Function: Cancel a pending transfer
CREATE OR REPLACE FUNCTION public.cancel_transfer(
  p_transfer_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_transfer RECORD;
BEGIN
  -- Get the transfer
  SELECT * INTO v_transfer
  FROM card_transfers
  WHERE id = p_transfer_id
  FOR UPDATE;
  
  IF v_transfer IS NULL THEN
    RETURN jsonb_build_object('error', 'Transfer not found');
  END IF;
  
  IF v_transfer.from_user_id != v_user_id THEN
    RETURN jsonb_build_object('error', 'You can only cancel your own transfers');
  END IF;
  
  IF v_transfer.status != 'PENDING' THEN
    RETURN jsonb_build_object('error', 'Only pending transfers can be cancelled');
  END IF;
  
  -- Cancel the transfer
  UPDATE card_transfers 
  SET status = 'CANCELLED' 
  WHERE id = p_transfer_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Transfer cancelled successfully'
  );
END;
$$;