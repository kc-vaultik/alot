-- =====================================================
-- SWEEPSTAKES MODEL: TRIVIA CREDITS SYSTEM
-- Phase 2: Backend RPC Functions
-- =====================================================

-- 1. Helper function to get trivia config value
CREATE OR REPLACE FUNCTION public.get_trivia_config(p_key TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_value INTEGER;
BEGIN
  SELECT value INTO v_value FROM trivia_credit_config WHERE key = p_key;
  RETURN COALESCE(v_value, 0);
END;
$$;

-- 2. Function to get user's trivia credits
CREATE OR REPLACE FUNCTION public.get_my_trivia_credits()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_credits INTEGER;
  v_lifetime INTEGER;
  v_daily_earned INTEGER;
  v_daily_limit INTEGER;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Get or create user trivia credits record
  INSERT INTO user_trivia_credits (user_id, credits, lifetime_earned)
  VALUES (v_user_id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT credits, lifetime_earned 
  INTO v_credits, v_lifetime
  FROM user_trivia_credits WHERE user_id = v_user_id;

  -- Get today's earned credits
  SELECT COALESCE(credits_earned, 0) INTO v_daily_earned
  FROM daily_trivia_credits 
  WHERE user_id = v_user_id AND earn_date = CURRENT_DATE;

  v_daily_limit := get_trivia_config('MAX_CREDITS_PER_DAY');

  RETURN json_build_object(
    'success', true,
    'credits', COALESCE(v_credits, 0),
    'lifetime_earned', COALESCE(v_lifetime, 0),
    'daily_earned', COALESCE(v_daily_earned, 0),
    'daily_limit', v_daily_limit,
    'can_earn_more', COALESCE(v_daily_earned, 0) < v_daily_limit
  );
END;
$$;

-- 3. Function to earn trivia credits (called when answering trivia questions)
CREATE OR REPLACE FUNCTION public.earn_trivia_credits(
  p_room_id UUID,
  p_question_id UUID,
  p_selected_option TEXT,
  p_source TEXT DEFAULT 'KNOWLEDGE_BOOST' -- 'TRIVIA_GATE' or 'KNOWLEDGE_BOOST'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_question RECORD;
  v_is_correct BOOLEAN;
  v_credits_to_award INTEGER;
  v_daily_earned INTEGER;
  v_daily_limit INTEGER;
  v_lot_questions_count INTEGER;
  v_lot_limit INTEGER;
  v_new_balance INTEGER;
  v_transaction_type trivia_credit_transaction_type;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Get question details
  SELECT * INTO v_question
  FROM product_questions
  WHERE id = p_question_id AND is_active = true;

  IF v_question IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Question not found');
  END IF;

  -- Check if already answered this question for this lot
  IF EXISTS (
    SELECT 1 FROM lot_trivia_questions 
    WHERE user_id = v_user_id AND room_id = p_room_id AND question_id = p_question_id
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Already answered this question');
  END IF;

  -- Check daily limit
  v_daily_limit := get_trivia_config('MAX_CREDITS_PER_DAY');
  
  INSERT INTO daily_trivia_credits (user_id, earn_date, credits_earned, questions_answered)
  VALUES (v_user_id, CURRENT_DATE, 0, 0)
  ON CONFLICT (user_id, earn_date) DO NOTHING;

  SELECT credits_earned INTO v_daily_earned
  FROM daily_trivia_credits 
  WHERE user_id = v_user_id AND earn_date = CURRENT_DATE;

  -- Check per-lot question limit
  v_lot_limit := get_trivia_config('MAX_QUESTIONS_PER_LOT');
  
  SELECT COUNT(*) INTO v_lot_questions_count
  FROM lot_trivia_questions
  WHERE user_id = v_user_id AND room_id = p_room_id;

  IF v_lot_questions_count >= v_lot_limit THEN
    RETURN json_build_object('success', false, 'error', 'Maximum questions reached for this lot');
  END IF;

  -- Check if answer is correct
  v_is_correct := (v_question.correct_option = p_selected_option);

  -- Calculate credits to award (only if correct AND under daily limit)
  v_credits_to_award := 0;
  IF v_is_correct AND v_daily_earned < v_daily_limit THEN
    v_credits_to_award := get_trivia_config('CREDITS_PER_CORRECT_ANSWER');
    -- Don't exceed daily limit
    IF v_daily_earned + v_credits_to_award > v_daily_limit THEN
      v_credits_to_award := v_daily_limit - v_daily_earned;
    END IF;
  END IF;

  -- Record the question answer
  INSERT INTO lot_trivia_questions (user_id, room_id, question_id, is_correct, credits_earned)
  VALUES (v_user_id, p_room_id, p_question_id, v_is_correct, v_credits_to_award);

  -- Update daily credits
  UPDATE daily_trivia_credits
  SET credits_earned = credits_earned + v_credits_to_award,
      questions_answered = questions_answered + 1
  WHERE user_id = v_user_id AND earn_date = CURRENT_DATE;

  -- Update user's trivia credits balance if credits awarded
  IF v_credits_to_award > 0 THEN
    -- Ensure user has a record
    INSERT INTO user_trivia_credits (user_id, credits, lifetime_earned)
    VALUES (v_user_id, 0, 0)
    ON CONFLICT (user_id) DO NOTHING;

    UPDATE user_trivia_credits
    SET credits = credits + v_credits_to_award,
        lifetime_earned = lifetime_earned + v_credits_to_award,
        updated_at = now()
    WHERE user_id = v_user_id
    RETURNING credits INTO v_new_balance;

    -- Determine transaction type
    v_transaction_type := CASE 
      WHEN p_source = 'TRIVIA_GATE' THEN 'EARNED_TRIVIA_GATE'::trivia_credit_transaction_type
      ELSE 'EARNED_KNOWLEDGE_BOOST'::trivia_credit_transaction_type
    END;

    -- Record transaction
    INSERT INTO trivia_credit_transactions (user_id, room_id, question_id, amount, transaction_type, balance_after)
    VALUES (v_user_id, p_room_id, p_question_id, v_credits_to_award, v_transaction_type, v_new_balance);
  ELSE
    SELECT credits INTO v_new_balance FROM user_trivia_credits WHERE user_id = v_user_id;
  END IF;

  RETURN json_build_object(
    'success', true,
    'is_correct', v_is_correct,
    'correct_option', v_question.correct_option,
    'credits_earned', v_credits_to_award,
    'new_balance', COALESCE(v_new_balance, 0),
    'daily_earned', v_daily_earned + v_credits_to_award,
    'daily_limit', v_daily_limit,
    'lot_questions_answered', v_lot_questions_count + 1,
    'lot_questions_limit', v_lot_limit
  );
END;
$$;

-- 4. Function to enter lot with trivia credits (free entry)
CREATE OR REPLACE FUNCTION public.enter_lot_with_trivia_credits(
  p_room_id UUID,
  p_tickets_to_buy INTEGER DEFAULT 1
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_room RECORD;
  v_credits_per_ticket INTEGER;
  v_credits_required INTEGER;
  v_user_credits INTEGER;
  v_max_free_tickets INTEGER;
  v_current_trivia_tickets INTEGER;
  v_new_balance INTEGER;
  v_entry_id UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  IF p_tickets_to_buy < 1 THEN
    RETURN json_build_object('success', false, 'error', 'Must buy at least 1 ticket');
  END IF;

  -- Get room details
  SELECT * INTO v_room FROM rooms WHERE id = p_room_id;
  
  IF v_room IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Lot not found');
  END IF;

  IF v_room.status != 'OPEN' THEN
    RETURN json_build_object('success', false, 'error', 'Lot is not open for entries');
  END IF;

  -- Get config values
  v_credits_per_ticket := get_trivia_config('CREDITS_PER_FREE_TICKET');
  v_max_free_tickets := get_trivia_config('MAX_FREE_TICKETS_PER_LOT');
  v_credits_required := p_tickets_to_buy * v_credits_per_ticket;

  -- Get user's current trivia credits
  SELECT COALESCE(credits, 0) INTO v_user_credits
  FROM user_trivia_credits WHERE user_id = v_user_id;

  IF v_user_credits < v_credits_required THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Insufficient Trivia Credits',
      'required', v_credits_required,
      'available', COALESCE(v_user_credits, 0)
    );
  END IF;

  -- Check current trivia tickets for this lot
  SELECT COALESCE(trivia_tickets, 0) INTO v_current_trivia_tickets
  FROM room_trivia_entries WHERE room_id = p_room_id AND user_id = v_user_id;

  IF COALESCE(v_current_trivia_tickets, 0) + p_tickets_to_buy > v_max_free_tickets THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Maximum free tickets reached for this lot',
      'max_allowed', v_max_free_tickets,
      'current', COALESCE(v_current_trivia_tickets, 0)
    );
  END IF;

  -- Deduct credits
  UPDATE user_trivia_credits
  SET credits = credits - v_credits_required,
      updated_at = now()
  WHERE user_id = v_user_id
  RETURNING credits INTO v_new_balance;

  -- Record transaction
  INSERT INTO trivia_credit_transactions (user_id, room_id, amount, transaction_type, balance_after)
  VALUES (v_user_id, p_room_id, -v_credits_required, 'SPENT_FREE_ENTRY', v_new_balance);

  -- Create or update room_trivia_entries
  INSERT INTO room_trivia_entries (room_id, user_id, trivia_tickets)
  VALUES (p_room_id, v_user_id, p_tickets_to_buy)
  ON CONFLICT (room_id, user_id) 
  DO UPDATE SET trivia_tickets = room_trivia_entries.trivia_tickets + p_tickets_to_buy
  RETURNING id INTO v_entry_id;

  RETURN json_build_object(
    'success', true,
    'entry_id', v_entry_id,
    'tickets_purchased', p_tickets_to_buy,
    'credits_spent', v_credits_required,
    'new_balance', v_new_balance,
    'total_trivia_tickets', COALESCE(v_current_trivia_tickets, 0) + p_tickets_to_buy
  );
END;
$$;

-- 5. Function to get user's trivia entry for a room
CREATE OR REPLACE FUNCTION public.get_my_trivia_entry(p_room_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_entry RECORD;
  v_questions_answered INTEGER;
  v_max_questions INTEGER;
  v_max_free_tickets INTEGER;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Get trivia entry
  SELECT * INTO v_entry
  FROM room_trivia_entries
  WHERE room_id = p_room_id AND user_id = v_user_id;

  -- Get questions answered for this lot
  SELECT COUNT(*) INTO v_questions_answered
  FROM lot_trivia_questions
  WHERE room_id = p_room_id AND user_id = v_user_id;

  v_max_questions := get_trivia_config('MAX_QUESTIONS_PER_LOT');
  v_max_free_tickets := get_trivia_config('MAX_FREE_TICKETS_PER_LOT');

  RETURN json_build_object(
    'success', true,
    'has_entry', v_entry IS NOT NULL,
    'trivia_tickets', COALESCE(v_entry.trivia_tickets, 0),
    'questions_answered', v_questions_answered,
    'max_questions', v_max_questions,
    'max_free_tickets', v_max_free_tickets,
    'can_answer_more', v_questions_answered < v_max_questions
  );
END;
$$;

-- 6. Update draw_room_winner to include trivia entries with weighted odds
CREATE OR REPLACE FUNCTION public.draw_room_winner(p_room_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room RECORD;
  v_total_weighted_tickets NUMERIC;
  v_trivia_weight NUMERIC;
  v_server_seed TEXT;
  v_client_seed TEXT;
  v_combined_seed TEXT;
  v_nonce INTEGER;
  v_winning_ticket_raw NUMERIC;
  v_winning_ticket INTEGER;
  v_cumulative NUMERIC := 0;
  v_winner_user_id UUID;
  v_winner_entry_id UUID;
  v_winner_type TEXT;
  v_draw_id UUID;
  v_entry RECORD;
  v_trivia_entry RECORD;
BEGIN
  -- Get room details
  SELECT * INTO v_room FROM rooms WHERE id = p_room_id FOR UPDATE;
  
  IF v_room IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Room not found');
  END IF;

  IF v_room.status != 'FUNDED' THEN
    RETURN json_build_object('success', false, 'error', 'Room is not funded');
  END IF;

  -- Get trivia ticket weight (stored as integer, e.g., 10 = 0.1)
  v_trivia_weight := get_trivia_config('TRIVIA_TICKET_WEIGHT')::NUMERIC / 100.0;

  -- Calculate total weighted tickets (paid + trivia*weight)
  SELECT 
    COALESCE(SUM(re.tickets), 0) + 
    COALESCE((SELECT SUM(rte.trivia_tickets) * v_trivia_weight FROM room_trivia_entries rte WHERE rte.room_id = p_room_id), 0)
  INTO v_total_weighted_tickets
  FROM room_entries re
  WHERE re.room_id = p_room_id AND re.status = 'active';

  IF v_total_weighted_tickets <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'No entries in room');
  END IF;

  -- Generate cryptographic seeds
  v_server_seed := encode(gen_random_bytes(32), 'hex');
  v_client_seed := md5(p_room_id::TEXT || v_room.created_at::TEXT || v_total_weighted_tickets::TEXT);
  v_nonce := (SELECT COUNT(*) FROM lottery_draws WHERE room_id = p_room_id)::INTEGER + 1;
  
  -- Combine seeds
  v_combined_seed := encode(sha256((v_server_seed || v_client_seed || v_nonce::TEXT)::bytea), 'hex');
  
  -- Generate winning ticket number (1 to total_weighted_tickets)
  v_winning_ticket_raw := 1 + (('x' || substr(v_combined_seed, 1, 8))::bit(32)::bigint % v_total_weighted_tickets::bigint);
  v_winning_ticket := v_winning_ticket_raw::INTEGER;

  -- Find winner by iterating through all entries (paid first, then trivia)
  -- Paid entries
  FOR v_entry IN 
    SELECT id, user_id, tickets FROM room_entries 
    WHERE room_id = p_room_id AND status = 'active'
    ORDER BY staked_at
  LOOP
    v_cumulative := v_cumulative + v_entry.tickets;
    IF v_cumulative >= v_winning_ticket THEN
      v_winner_user_id := v_entry.user_id;
      v_winner_entry_id := v_entry.id;
      v_winner_type := 'PAID';
      EXIT;
    END IF;
  END LOOP;

  -- If not found in paid entries, check trivia entries
  IF v_winner_user_id IS NULL THEN
    FOR v_trivia_entry IN 
      SELECT id, user_id, trivia_tickets FROM room_trivia_entries 
      WHERE room_id = p_room_id
      ORDER BY created_at
    LOOP
      v_cumulative := v_cumulative + (v_trivia_entry.trivia_tickets * v_trivia_weight);
      IF v_cumulative >= v_winning_ticket THEN
        v_winner_user_id := v_trivia_entry.user_id;
        v_winner_entry_id := v_trivia_entry.id;
        v_winner_type := 'TRIVIA';
        EXIT;
      END IF;
    END LOOP;
  END IF;

  IF v_winner_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Could not determine winner');
  END IF;

  -- Record draw
  INSERT INTO lottery_draws (
    room_id, 
    total_tickets, 
    winning_ticket_number, 
    server_seed, 
    client_seed, 
    nonce,
    random_seed,
    verification_hash,
    winner_user_id,
    winner_entry_id
  ) VALUES (
    p_room_id,
    v_total_weighted_tickets::INTEGER,
    v_winning_ticket,
    v_server_seed,
    v_client_seed,
    v_nonce,
    v_combined_seed,
    encode(sha256(v_combined_seed::bytea), 'hex'),
    v_winner_user_id,
    v_winner_entry_id
  ) RETURNING id INTO v_draw_id;

  -- Update room status
  UPDATE rooms 
  SET status = 'SETTLED',
      winner_user_id = v_winner_user_id,
      winner_entry_id = v_winner_entry_id
  WHERE id = p_room_id;

  -- Update winner's entry
  IF v_winner_type = 'PAID' THEN
    UPDATE room_entries 
    SET outcome = 'WON', status = 'settled'
    WHERE id = v_winner_entry_id;
  END IF;

  -- Mark other paid entries as lost
  UPDATE room_entries 
  SET outcome = 'LOST', status = 'settled'
  WHERE room_id = p_room_id AND id != v_winner_entry_id AND status = 'active';

  RETURN json_build_object(
    'success', true,
    'draw_id', v_draw_id,
    'winner_user_id', v_winner_user_id,
    'winner_entry_id', v_winner_entry_id,
    'winner_type', v_winner_type,
    'winning_ticket', v_winning_ticket,
    'total_weighted_tickets', v_total_weighted_tickets,
    'trivia_weight', v_trivia_weight
  );
END;
$$;

-- 7. Function to get lot trivia stats (questions available, answered, etc.)
CREATE OR REPLACE FUNCTION public.get_lot_trivia_stats(p_room_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_questions_answered INTEGER;
  v_correct_answers INTEGER;
  v_max_questions INTEGER;
  v_credits_per_ticket INTEGER;
  v_max_free_tickets INTEGER;
  v_trivia_tickets INTEGER;
  v_user_credits INTEGER;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Get config
  v_max_questions := get_trivia_config('MAX_QUESTIONS_PER_LOT');
  v_credits_per_ticket := get_trivia_config('CREDITS_PER_FREE_TICKET');
  v_max_free_tickets := get_trivia_config('MAX_FREE_TICKETS_PER_LOT');

  -- Get user's answered questions for this lot
  SELECT COUNT(*), COALESCE(SUM(CASE WHEN is_correct THEN 1 ELSE 0 END), 0)
  INTO v_questions_answered, v_correct_answers
  FROM lot_trivia_questions
  WHERE user_id = v_user_id AND room_id = p_room_id;

  -- Get user's trivia tickets for this lot
  SELECT COALESCE(trivia_tickets, 0) INTO v_trivia_tickets
  FROM room_trivia_entries
  WHERE user_id = v_user_id AND room_id = p_room_id;

  -- Get user's current trivia credits
  SELECT COALESCE(credits, 0) INTO v_user_credits
  FROM user_trivia_credits WHERE user_id = v_user_id;

  RETURN json_build_object(
    'success', true,
    'questions_answered', COALESCE(v_questions_answered, 0),
    'correct_answers', COALESCE(v_correct_answers, 0),
    'max_questions', v_max_questions,
    'can_answer_more', COALESCE(v_questions_answered, 0) < v_max_questions,
    'trivia_tickets', COALESCE(v_trivia_tickets, 0),
    'max_free_tickets', v_max_free_tickets,
    'can_get_more_tickets', COALESCE(v_trivia_tickets, 0) < v_max_free_tickets,
    'user_credits', COALESCE(v_user_credits, 0),
    'credits_per_ticket', v_credits_per_ticket,
    'affordable_tickets', FLOOR(COALESCE(v_user_credits, 0)::NUMERIC / v_credits_per_ticket)
  );
END;
$$;