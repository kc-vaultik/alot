-- Enable RLS on promo_spend_daily (no policies = service role only access)
ALTER TABLE public.promo_spend_daily ENABLE ROW LEVEL SECURITY;