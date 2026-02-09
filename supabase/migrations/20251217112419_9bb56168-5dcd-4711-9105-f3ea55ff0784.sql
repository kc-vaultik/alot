-- Public RPC to fetch transfer details by claim token (for claim page pre-login)
CREATE OR REPLACE FUNCTION public.get_transfer_details_by_claim_token(p_claim_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_transfer RECORD;
BEGIN
  SELECT
    ct.id,
    ct.reveal_id,
    ct.from_user_id,
    ct.transfer_type,
    ct.status,
    ct.expires_at,
    r.id AS card_id,
    r.band,
    r.serial_number,
    pc.name,
    pc.brand,
    pc.image_url,
    pc.retail_value_usd
  INTO v_transfer
  FROM public.card_transfers ct
  JOIN public.reveals r ON r.id = ct.reveal_id
  JOIN public.product_classes pc ON pc.id = r.product_class_id
  WHERE ct.claim_token = p_claim_token
  LIMIT 1;

  IF v_transfer.id IS NULL THEN
    RETURN jsonb_build_object('error', 'This claim link is invalid or has expired');
  END IF;

  -- Basic validity checks
  IF v_transfer.status = 'CLAIMED' THEN
    RETURN jsonb_build_object('error', 'This card has already been claimed');
  END IF;

  IF v_transfer.status = 'CANCELLED' THEN
    RETURN jsonb_build_object('error', 'This transfer has been cancelled');
  END IF;

  IF v_transfer.expires_at < now() THEN
    RETURN jsonb_build_object('error', 'This claim link has expired');
  END IF;

  RETURN jsonb_build_object(
    'transfer', jsonb_build_object(
      'id', v_transfer.id,
      'reveal_id', v_transfer.reveal_id,
      'from_user_id', v_transfer.from_user_id,
      'transfer_type', lower(v_transfer.transfer_type),
      'status', v_transfer.status,
      'expires_at', v_transfer.expires_at,
      'card', jsonb_build_object(
        'id', v_transfer.card_id,
        'product_name', v_transfer.name,
        'product_brand', v_transfer.brand,
        'product_image', v_transfer.image_url,
        'band', v_transfer.band,
        'serial_number', v_transfer.serial_number,
        'retail_value_usd', v_transfer.retail_value_usd
      )
    )
  );
END;
$$;