-- Phase 12: Trivia-Gated Ticket Purchases
-- Table to track user trivia attempts per room for purchase unlock

CREATE TABLE public.room_trivia_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  attempts_used INTEGER NOT NULL DEFAULT 0,
  last_failed_at TIMESTAMPTZ,
  unlocked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, room_id)
);

-- Index for efficient lookups
CREATE INDEX idx_room_trivia_attempts_user_room ON room_trivia_attempts(user_id, room_id);

-- RLS Policies
ALTER TABLE room_trivia_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own trivia attempts" ON room_trivia_attempts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trivia attempts" ON room_trivia_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trivia attempts" ON room_trivia_attempts
  FOR UPDATE USING (auth.uid() = user_id);

-- RPC: Attempt trivia question to unlock purchase
CREATE OR REPLACE FUNCTION public.attempt_trivia_for_purchase(
  p_room_id UUID,
  p_question_id UUID,
  p_selected_option TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_attempts RECORD;
  v_question RECORD;
  v_is_correct BOOLEAN;
  v_max_attempts INTEGER := 3;
  v_cooldown_minutes INTEGER := 60;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Get or create attempt record
  INSERT INTO room_trivia_attempts (user_id, room_id)
  VALUES (v_user_id, p_room_id)
  ON CONFLICT (user_id, room_id) DO NOTHING;

  SELECT * INTO v_attempts FROM room_trivia_attempts
  WHERE user_id = v_user_id AND room_id = p_room_id FOR UPDATE;

  -- Check if already unlocked
  IF v_attempts.unlocked_at IS NOT NULL THEN
    RETURN json_build_object('success', true, 'already_unlocked', true, 'can_purchase', true);
  END IF;

  -- Check cooldown (if 3 attempts used, must wait)
  IF v_attempts.attempts_used >= v_max_attempts THEN
    IF v_attempts.last_failed_at + (v_cooldown_minutes || ' minutes')::interval > now() THEN
      RETURN json_build_object(
        'success', false, 
        'error', 'Too many wrong answers. Try again later.',
        'cooldown_ends_at', v_attempts.last_failed_at + (v_cooldown_minutes || ' minutes')::interval,
        'can_purchase', false
      );
    ELSE
      -- Reset attempts after cooldown
      UPDATE room_trivia_attempts
      SET attempts_used = 0, last_failed_at = NULL
      WHERE id = v_attempts.id;
      v_attempts.attempts_used := 0;
    END IF;
  END IF;

  -- Get question
  SELECT pq.* INTO v_question
  FROM product_questions pq
  JOIN rooms r ON r.product_class_id = pq.product_class_id
  WHERE pq.id = p_question_id AND r.id = p_room_id AND pq.is_active = true;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Question not found for this lot');
  END IF;

  -- Check answer
  v_is_correct := (UPPER(p_selected_option) = UPPER(v_question.correct_option));

  IF v_is_correct THEN
    -- Unlock purchase
    UPDATE room_trivia_attempts
    SET unlocked_at = now()
    WHERE id = v_attempts.id;
    
    RETURN json_build_object(
      'success', true, 
      'is_correct', true, 
      'can_purchase', true,
      'correct_option', v_question.correct_option
    );
  ELSE
    -- Increment failed attempts
    UPDATE room_trivia_attempts
    SET attempts_used = attempts_used + 1, last_failed_at = now()
    WHERE id = v_attempts.id;
    
    RETURN json_build_object(
      'success', true,
      'is_correct', false,
      'correct_option', v_question.correct_option,
      'attempts_remaining', v_max_attempts - v_attempts.attempts_used - 1,
      'can_purchase', false
    );
  END IF;
END;
$$;