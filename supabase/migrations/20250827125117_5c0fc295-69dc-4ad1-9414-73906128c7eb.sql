-- COMPREHENSIVE SECURITY FIX: Secure all customer data tables
-- Only allow public contact form submissions, everything else admin-only

-- 1. Fix contact_inquiries: Allow public INSERT but restrict SELECT to admins
DROP POLICY IF EXISTS "Anyone can submit contact inquiries" ON public.contact_inquiries;
DROP POLICY IF EXISTS "Admins can manage contact inquiries" ON public.contact_inquiries;

CREATE POLICY "Public can submit contact forms"
ON public.contact_inquiries 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Only admins can view contact inquiries"
ON public.contact_inquiries 
FOR SELECT 
USING (public.is_admin_user());

CREATE POLICY "Only admins can manage contact inquiries"
ON public.contact_inquiries 
FOR ALL 
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- 2. Fix leads table: Admin-only access
DROP POLICY IF EXISTS "Anyone can create leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can manage leads" ON public.leads;

CREATE POLICY "Only admins can manage leads"
ON public.leads 
FOR ALL 
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- 3. Fix newsletter_subscriptions: Allow public INSERT but restrict SELECT to admins
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON public.newsletter_subscriptions;
DROP POLICY IF EXISTS "Admins can manage newsletter subscriptions" ON public.newsletter_subscriptions;

CREATE POLICY "Public can subscribe to newsletter"
ON public.newsletter_subscriptions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Only admins can view newsletter subscriptions"
ON public.newsletter_subscriptions 
FOR SELECT 
USING (public.is_admin_user());

CREATE POLICY "Only admins can manage newsletter subscriptions"
ON public.newsletter_subscriptions 
FOR ALL 
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- 4. Fix analytics_events: Admin-only access
DROP POLICY IF EXISTS "Anyone can create analytics events" ON public.analytics_events;
DROP POLICY IF EXISTS "Admins can view all events" ON public.analytics_events;

CREATE POLICY "Only admins can manage analytics events"
ON public.analytics_events 
FOR ALL 
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- 5. Check if service_requests table exists and secure it
DROP POLICY IF EXISTS "Anyone can create service requests" ON public.service_requests;
DROP POLICY IF EXISTS "Admins can view service requests" ON public.service_requests;

-- Only create policies if the table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'service_requests' AND table_schema = 'public') THEN
        EXECUTE 'CREATE POLICY "Only admins can manage service requests" ON public.service_requests FOR ALL USING (public.is_admin_user()) WITH CHECK (public.is_admin_user())';
    END IF;
END$$;

-- 6. Check if user_sessions table exists and secure it
DROP POLICY IF EXISTS "Anyone can create user sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Admins can view user sessions" ON public.user_sessions;

-- Only create policies if the table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_sessions' AND table_schema = 'public') THEN
        EXECUTE 'CREATE POLICY "Only admins can manage user sessions" ON public.user_sessions FOR ALL USING (public.is_admin_user()) WITH CHECK (public.is_admin_user())';
    END IF;
END$$;

-- 7. Secure other sensitive tables that might exist
DROP POLICY IF EXISTS "Anyone can create content interactions" ON public.content_interactions;
DROP POLICY IF EXISTS "Admins can view all interactions" ON public.content_interactions;

CREATE POLICY "Only admins can manage content interactions"
ON public.content_interactions 
FOR ALL 
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "Anyone can create conversions" ON public.conversions;
DROP POLICY IF EXISTS "Admins can view all conversions" ON public.conversions;

CREATE POLICY "Only admins can manage conversions"
ON public.conversions 
FOR ALL 
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "Anyone can create search analytics" ON public.search_analytics;
DROP POLICY IF EXISTS "Admins can view all analytics" ON public.search_analytics;

CREATE POLICY "Only admins can manage search analytics"
ON public.search_analytics 
FOR ALL 
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "Anyone can create item valuations" ON public.item_valuations;
DROP POLICY IF EXISTS "Admins can view all valuations" ON public.item_valuations;
DROP POLICY IF EXISTS "Users can view their own valuations" ON public.item_valuations;

CREATE POLICY "Only admins can manage item valuations"
ON public.item_valuations 
FOR ALL 
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());