-- Function to spend universal credits to gain product progress
CREATE OR REPLACE FUNCTION public.spend_credits_for_progress(
  p_user_id UUID,
  p_product_class_id UUID,
  p_credits_to_spend INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_universal INTEGER;
  v_new_universal INTEGER;
  v_new_product_credits INTEGER;
BEGIN
  -- Validate input
  IF p_credits_to_spend <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Credits to spend must be positive');
  END IF;

  -- Lock and get current universal credits
  SELECT credits INTO v_current_universal
  FROM user_universal_credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- Check if user has enough credits
  IF v_current_universal IS NULL OR v_current_universal < p_credits_to_spend THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Insufficient credits',
      'available', COALESCE(v_current_universal, 0),
      'required', p_credits_to_spend
    );
  END IF;

  -- Deduct from universal credits
  v_new_universal := v_current_universal - p_credits_to_spend;
  
  UPDATE user_universal_credits
  SET credits = v_new_universal, updated_at = now()
  WHERE user_id = p_user_id;

  -- Add to product credits (upsert)
  INSERT INTO user_product_credits (user_id, product_class_id, credits, updated_at)
  VALUES (p_user_id, p_product_class_id, p_credits_to_spend, now())
  ON CONFLICT (user_id, product_class_id)
  DO UPDATE SET 
    credits = user_product_credits.credits + EXCLUDED.credits,
    updated_at = now()
  RETURNING credits INTO v_new_product_credits;

  RETURN json_build_object(
    'success', true,
    'credits_spent', p_credits_to_spend,
    'new_universal_balance', v_new_universal,
    'new_product_credits', v_new_product_credits
  );
END;
$$;