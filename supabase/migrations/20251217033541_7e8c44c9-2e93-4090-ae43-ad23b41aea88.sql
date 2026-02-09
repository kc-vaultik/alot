-- Update create_gift_transfer to accept optional target user
CREATE OR REPLACE FUNCTION public.create_gift_transfer(
  p_reveal_id uuid,
  p_claim_token text,
  p_to_user_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transfer_id uuid;
  v_expires_at timestamp with time zone;
BEGIN
  -- Verify the reveal belongs to the current user
  IF NOT EXISTS (
    SELECT 1 FROM reveals 
    WHERE id = p_reveal_id AND user_id = auth.uid()
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Card not found or not owned by you');
  END IF;

  -- Check if there's already a pending transfer for this reveal
  IF EXISTS (
    SELECT 1 FROM card_transfers 
    WHERE reveal_id = p_reveal_id AND status = 'PENDING'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'This card already has a pending transfer');
  END IF;

  v_expires_at := now() + interval '7 days';

  -- Create the transfer
  INSERT INTO card_transfers (
    reveal_id,
    from_user_id,
    to_user_id,
    transfer_type,
    claim_token,
    status,
    expires_at
  ) VALUES (
    p_reveal_id,
    auth.uid(),
    p_to_user_id,
    'GIFT',
    p_claim_token,
    'PENDING',
    v_expires_at
  )
  RETURNING id INTO v_transfer_id;

  RETURN jsonb_build_object(
    'success', true,
    'transfer_id', v_transfer_id,
    'claim_token', p_claim_token,
    'expires_at', v_expires_at,
    'is_direct', p_to_user_id IS NOT NULL
  );
END;
$$;

-- Update create_swap_offer to accept optional target user
CREATE OR REPLACE FUNCTION public.create_swap_offer(
  p_reveal_id uuid,
  p_claim_token text,
  p_to_user_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transfer_id uuid;
  v_expires_at timestamp with time zone;
BEGIN
  -- Verify the reveal belongs to the current user
  IF NOT EXISTS (
    SELECT 1 FROM reveals 
    WHERE id = p_reveal_id AND user_id = auth.uid()
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Card not found or not owned by you');
  END IF;

  -- Check if there's already a pending transfer for this reveal
  IF EXISTS (
    SELECT 1 FROM card_transfers 
    WHERE reveal_id = p_reveal_id AND status = 'PENDING'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'This card already has a pending transfer');
  END IF;

  v_expires_at := now() + interval '7 days';

  -- Create the transfer
  INSERT INTO card_transfers (
    reveal_id,
    from_user_id,
    to_user_id,
    transfer_type,
    claim_token,
    status,
    expires_at
  ) VALUES (
    p_reveal_id,
    auth.uid(),
    p_to_user_id,
    'SWAP',
    p_claim_token,
    'PENDING',
    v_expires_at
  )
  RETURNING id INTO v_transfer_id;

  RETURN jsonb_build_object(
    'success', true,
    'transfer_id', v_transfer_id,
    'claim_token', p_claim_token,
    'expires_at', v_expires_at,
    'is_direct', p_to_user_id IS NOT NULL
  );
END;
$$;

-- Function to get pending transfers for/from a specific collector
CREATE OR REPLACE FUNCTION public.get_pending_transfers_with_collector(
  p_collector_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_incoming_gifts integer;
  v_incoming_swaps integer;
  v_outgoing_gifts integer;
  v_outgoing_swaps integer;
BEGIN
  -- Count incoming gifts (to current user from specified collector)
  SELECT COUNT(*) INTO v_incoming_gifts
  FROM card_transfers
  WHERE to_user_id = auth.uid()
    AND from_user_id = p_collector_user_id
    AND transfer_type = 'GIFT'
    AND status = 'PENDING';

  -- Count incoming swaps
  SELECT COUNT(*) INTO v_incoming_swaps
  FROM card_transfers
  WHERE to_user_id = auth.uid()
    AND from_user_id = p_collector_user_id
    AND transfer_type = 'SWAP'
    AND status = 'PENDING';

  -- Count outgoing gifts (from current user to specified collector)
  SELECT COUNT(*) INTO v_outgoing_gifts
  FROM card_transfers
  WHERE from_user_id = auth.uid()
    AND to_user_id = p_collector_user_id
    AND transfer_type = 'GIFT'
    AND status = 'PENDING';

  -- Count outgoing swaps
  SELECT COUNT(*) INTO v_outgoing_swaps
  FROM card_transfers
  WHERE from_user_id = auth.uid()
    AND to_user_id = p_collector_user_id
    AND transfer_type = 'SWAP'
    AND status = 'PENDING';

  RETURN jsonb_build_object(
    'incoming_gifts', v_incoming_gifts,
    'incoming_swaps', v_incoming_swaps,
    'outgoing_gifts', v_outgoing_gifts,
    'outgoing_swaps', v_outgoing_swaps,
    'total_incoming', v_incoming_gifts + v_incoming_swaps,
    'total_outgoing', v_outgoing_gifts + v_outgoing_swaps
  );
END;
$$;