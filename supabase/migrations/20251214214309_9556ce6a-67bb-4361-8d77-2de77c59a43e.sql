-- Phase 1.2-1.5: Promo Pool remaining schema changes

-- 1.2 Initialize promo bucket balance
INSERT INTO public.bucket_balances(bucket, balance_usd)
VALUES ('promo', 0)
ON CONFLICT (bucket) DO NOTHING;

-- 1.3 Create daily_free_pulls table
CREATE TABLE IF NOT EXISTS public.daily_free_pulls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  pull_date DATE NOT NULL,
  reveal_id UUID REFERENCES public.reveals(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, pull_date)
);

ALTER TABLE public.daily_free_pulls ENABLE ROW LEVEL SECURITY;

-- Users can only read their own claims
CREATE POLICY "daily_free_pulls_read_own"
ON public.daily_free_pulls FOR SELECT
USING (auth.uid() = user_id);

-- 1.4 Create promo_spend_daily table (service role only - no RLS policies)
CREATE TABLE IF NOT EXISTS public.promo_spend_daily (
  spend_date DATE PRIMARY KEY,
  spent_usd NUMERIC(14,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1.5 Enable realtime for daily_free_pulls
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_free_pulls;