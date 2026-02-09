-- =====================================================
-- SWEEPSTAKES MODEL: TRIVIA CREDITS SYSTEM
-- Phase 1: Database Schema
-- =====================================================

-- 1. Create user_trivia_credits table (global balance per user)
CREATE TABLE public.user_trivia_credits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  credits INTEGER NOT NULL DEFAULT 0 CHECK (credits >= 0),
  lifetime_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_trivia_credits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_trivia_credits
CREATE POLICY "Users can view their own trivia credits"
  ON public.user_trivia_credits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage trivia credits"
  ON public.user_trivia_credits FOR ALL
  USING (true)
  WITH CHECK (true);

-- 2. Create trivia_credit_transaction_type enum
CREATE TYPE public.trivia_credit_transaction_type AS ENUM (
  'EARNED_TRIVIA_GATE',
  'EARNED_KNOWLEDGE_BOOST', 
  'SPENT_FREE_ENTRY',
  'BONUS',
  'ADMIN_ADJUSTMENT'
);

-- 3. Create trivia_credit_transactions table (audit trail)
CREATE TABLE public.trivia_credit_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  room_id UUID REFERENCES public.rooms(id),
  question_id UUID REFERENCES public.product_questions(id),
  amount INTEGER NOT NULL,
  transaction_type public.trivia_credit_transaction_type NOT NULL,
  balance_after INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trivia_credit_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for trivia_credit_transactions
CREATE POLICY "Users can view their own transactions"
  ON public.trivia_credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert transactions"
  ON public.trivia_credit_transactions FOR INSERT
  WITH CHECK (true);

-- 4. Add entry_type and trivia_tickets to room_entries
ALTER TABLE public.room_entries 
  ADD COLUMN IF NOT EXISTS entry_type TEXT NOT NULL DEFAULT 'PAID' CHECK (entry_type IN ('PAID', 'TRIVIA_CREDIT', 'HYBRID')),
  ADD COLUMN IF NOT EXISTS trivia_tickets INTEGER NOT NULL DEFAULT 0 CHECK (trivia_tickets >= 0);

-- 5. Create room_trivia_entries table (free entries via trivia)
CREATE TABLE public.room_trivia_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.rooms(id),
  user_id UUID NOT NULL,
  trivia_tickets INTEGER NOT NULL DEFAULT 0 CHECK (trivia_tickets >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- Enable RLS
ALTER TABLE public.room_trivia_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for room_trivia_entries
CREATE POLICY "Users can view their own trivia entries"
  ON public.room_trivia_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view trivia entries in rooms they participate in"
  ON public.room_trivia_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.room_entries re 
      WHERE re.room_id = room_trivia_entries.room_id 
      AND re.user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage trivia entries"
  ON public.room_trivia_entries FOR ALL
  USING (true)
  WITH CHECK (true);

-- 6. Create trivia_credit_config table for configurable constants
CREATE TABLE public.trivia_credit_config (
  key TEXT PRIMARY KEY,
  value INTEGER NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default configuration values
INSERT INTO public.trivia_credit_config (key, value, description) VALUES
  ('CREDITS_PER_CORRECT_ANSWER', 1, 'Trivia Credits earned per correct answer'),
  ('CREDITS_PER_FREE_TICKET', 10, 'Trivia Credits required to get 1 free ticket'),
  ('TRIVIA_TICKET_WEIGHT', 10, 'Weight of trivia ticket in draw (10 = 0.1x, 100 = 1x)'),
  ('MAX_CREDITS_PER_DAY', 10, 'Maximum Trivia Credits earnable per day'),
  ('MAX_QUESTIONS_PER_LOT', 5, 'Maximum trivia questions per lot per user'),
  ('MAX_FREE_TICKETS_PER_LOT', 3, 'Maximum free tickets per lot per user');

-- RLS for config (read-only for authenticated users)
ALTER TABLE public.trivia_credit_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read config"
  ON public.trivia_credit_config FOR SELECT
  USING (true);

-- 7. Create daily_trivia_credits table to track daily caps
CREATE TABLE public.daily_trivia_credits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  earn_date DATE NOT NULL DEFAULT CURRENT_DATE,
  credits_earned INTEGER NOT NULL DEFAULT 0,
  questions_answered INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, earn_date)
);

-- Enable RLS
ALTER TABLE public.daily_trivia_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own daily credits"
  ON public.daily_trivia_credits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage daily credits"
  ON public.daily_trivia_credits FOR ALL
  USING (true)
  WITH CHECK (true);

-- 8. Create lot_trivia_questions table to track per-lot question limits
CREATE TABLE public.lot_trivia_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  room_id UUID NOT NULL REFERENCES public.rooms(id),
  question_id UUID NOT NULL REFERENCES public.product_questions(id),
  is_correct BOOLEAN NOT NULL,
  credits_earned INTEGER NOT NULL DEFAULT 0,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, room_id, question_id)
);

-- Enable RLS
ALTER TABLE public.lot_trivia_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own lot questions"
  ON public.lot_trivia_questions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage lot questions"
  ON public.lot_trivia_questions FOR ALL
  USING (true)
  WITH CHECK (true);

-- 9. Create indexes for performance
CREATE INDEX idx_trivia_credit_transactions_user_id ON public.trivia_credit_transactions(user_id);
CREATE INDEX idx_trivia_credit_transactions_room_id ON public.trivia_credit_transactions(room_id);
CREATE INDEX idx_room_trivia_entries_room_id ON public.room_trivia_entries(room_id);
CREATE INDEX idx_room_trivia_entries_user_id ON public.room_trivia_entries(user_id);
CREATE INDEX idx_daily_trivia_credits_user_date ON public.daily_trivia_credits(user_id, earn_date);
CREATE INDEX idx_lot_trivia_questions_user_room ON public.lot_trivia_questions(user_id, room_id);

-- 10. Update timestamp trigger for user_trivia_credits
CREATE TRIGGER update_user_trivia_credits_updated_at
  BEFORE UPDATE ON public.user_trivia_credits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();