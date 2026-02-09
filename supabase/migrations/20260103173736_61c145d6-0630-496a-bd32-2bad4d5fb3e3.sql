-- =============================================
-- Phase 11: Product Trivia Questions - "Knowledge Boost"
-- =============================================

-- 1. Create product_questions table
CREATE TABLE public.product_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_class_id UUID NOT NULL REFERENCES public.product_classes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_option CHAR(1) NOT NULL CHECK (correct_option IN ('A', 'B', 'C', 'D')),
  bonus_tickets INTEGER NOT NULL DEFAULT 1,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for efficient lookups
CREATE INDEX idx_product_questions_product ON public.product_questions(product_class_id) WHERE is_active = true;

-- 2. Create user_question_answers table
CREATE TABLE public.user_question_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.product_questions(id) ON DELETE CASCADE,
  selected_option CHAR(1) NOT NULL,
  is_correct BOOLEAN NOT NULL,
  bonus_tickets_awarded INTEGER NOT NULL DEFAULT 0,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Each user can only answer each question once per room
  UNIQUE(user_id, room_id, question_id)
);

-- Index for user lookups
CREATE INDEX idx_user_question_answers_user_room ON public.user_question_answers(user_id, room_id);

-- 3. Enable RLS on product_questions
ALTER TABLE public.product_questions ENABLE ROW LEVEL SECURITY;

-- Anyone can read active questions
CREATE POLICY "Anyone can read active questions" ON public.product_questions
  FOR SELECT USING (is_active = true);

-- 4. Enable RLS on user_question_answers
ALTER TABLE public.user_question_answers ENABLE ROW LEVEL SECURITY;

-- Users can read their own answers
CREATE POLICY "Users can read own answers" ON public.user_question_answers
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own answers (controlled by RPC)
CREATE POLICY "Users can insert own answers" ON public.user_question_answers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. Create the answer_trivia_question RPC function
CREATE OR REPLACE FUNCTION public.answer_trivia_question(
  p_room_id UUID,
  p_question_id UUID,
  p_selected_option CHAR(1)
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_question RECORD;
  v_entry RECORD;
  v_room RECORD;
  v_is_correct BOOLEAN;
  v_bonus_tickets INTEGER := 0;
BEGIN
  -- Validate user is authenticated
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'You must be logged in');
  END IF;

  -- Validate selected option
  IF p_selected_option NOT IN ('A', 'B', 'C', 'D') THEN
    RETURN json_build_object('success', false, 'error', 'Invalid option selected');
  END IF;

  -- Get the room
  SELECT * INTO v_room FROM rooms WHERE id = p_room_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Lot not found');
  END IF;

  IF v_room.status NOT IN ('OPEN', 'FUNDED') THEN
    RETURN json_build_object('success', false, 'error', 'Lot is no longer accepting answers');
  END IF;

  -- Check user has an active entry in this room
  SELECT * INTO v_entry
  FROM room_entries
  WHERE room_id = p_room_id AND user_id = v_user_id AND status = 'STAKED'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'You must have an entry in this lot to answer questions');
  END IF;

  -- Get the question and verify it belongs to this room's product
  SELECT pq.* INTO v_question
  FROM product_questions pq
  WHERE pq.id = p_question_id 
    AND pq.product_class_id = v_room.product_class_id
    AND pq.is_active = true;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Question not found for this lot');
  END IF;

  -- Check if already answered
  IF EXISTS (
    SELECT 1 FROM user_question_answers 
    WHERE user_id = v_user_id AND room_id = p_room_id AND question_id = p_question_id
  ) THEN
    RETURN json_build_object('success', false, 'error', 'You have already answered this question');
  END IF;

  -- Check answer
  v_is_correct := (p_selected_option = v_question.correct_option);
  
  IF v_is_correct THEN
    v_bonus_tickets := v_question.bonus_tickets;
    
    -- Award bonus tickets to entry
    UPDATE room_entries
    SET tickets = tickets + v_bonus_tickets
    WHERE id = v_entry.id;
  END IF;

  -- Record the answer
  INSERT INTO user_question_answers (
    user_id, room_id, question_id, selected_option, is_correct, bonus_tickets_awarded
  ) VALUES (
    v_user_id, p_room_id, p_question_id, p_selected_option, v_is_correct, v_bonus_tickets
  );

  RETURN json_build_object(
    'success', true,
    'is_correct', v_is_correct,
    'correct_option', v_question.correct_option,
    'bonus_tickets', v_bonus_tickets,
    'new_total_tickets', v_entry.tickets + v_bonus_tickets
  );
END;
$$;