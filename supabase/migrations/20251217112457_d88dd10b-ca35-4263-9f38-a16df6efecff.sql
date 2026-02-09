-- Add admin-only RLS policies for internal/financial tables flagged by linter

-- inventory_items
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Only admins can read inventory" ON public.inventory_items;
DROP POLICY IF EXISTS "Only admins can modify inventory" ON public.inventory_items;
CREATE POLICY "Only admins can read inventory"
ON public.inventory_items
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Only admins can modify inventory"
ON public.inventory_items
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- pool_ledger
ALTER TABLE public.pool_ledger ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Only admins can read pool ledger" ON public.pool_ledger;
DROP POLICY IF EXISTS "Only admins can modify pool ledger" ON public.pool_ledger;
CREATE POLICY "Only admins can read pool ledger"
ON public.pool_ledger
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Only admins can modify pool ledger"
ON public.pool_ledger
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- promo_spend_daily
ALTER TABLE public.promo_spend_daily ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Only admins can read promo spend" ON public.promo_spend_daily;
DROP POLICY IF EXISTS "Only admins can modify promo spend" ON public.promo_spend_daily;
CREATE POLICY "Only admins can read promo spend"
ON public.promo_spend_daily
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Only admins can modify promo spend"
ON public.promo_spend_daily
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- webhook_events
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Only admins can read webhook events" ON public.webhook_events;
DROP POLICY IF EXISTS "Only admins can modify webhook events" ON public.webhook_events;
CREATE POLICY "Only admins can read webhook events"
ON public.webhook_events
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Only admins can modify webhook events"
ON public.webhook_events
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));