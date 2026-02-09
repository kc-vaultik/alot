-- Fix remaining security issues by removing conflicting policies and securing all tables

-- Remove conflicting policies that allow any authenticated user access
DROP POLICY IF EXISTS "Admins can manage service requests" ON public.service_requests;
DROP POLICY IF EXISTS "Admins can view all sessions" ON public.user_sessions;

-- Ensure security_logs is properly secured
DROP POLICY IF EXISTS "Service role can manage security logs" ON public.security_logs;
CREATE POLICY "Only admins can manage security logs"
ON public.security_logs 
FOR ALL 
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- Check if there are any other problematic policies allowing broad access
-- Remove any policies that use "auth.uid() IS NOT NULL" without proper admin check

-- Check and fix quotes table policy to be more restrictive
DROP POLICY IF EXISTS "Secure customer quote access" ON public.quotes;
CREATE POLICY "Admin or customer quote access"
ON public.quotes 
FOR SELECT 
USING (
  public.is_admin_user() OR 
  (customer_email IS NOT NULL AND customer_email = COALESCE(auth.email(), ''))
);

CREATE POLICY "Only admins can modify quotes"
ON public.quotes 
FOR ALL 
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- Ensure all public-readable tables are secured
-- Remove any remaining overly permissive policies
DROP POLICY IF EXISTS "Authentication methods are publicly readable" ON public.authentication_methods;
CREATE POLICY "Only admins can access authentication methods"
ON public.authentication_methods 
FOR ALL 
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "Brands are publicly readable" ON public.brands;
CREATE POLICY "Only admins can access brands"
ON public.brands 
FOR ALL 
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "Categories are publicly readable" ON public.categories;
CREATE POLICY "Only admins can access categories"
ON public.categories 
FOR ALL 
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "Published case studies are publicly readable" ON public.case_studies;
CREATE POLICY "Only admins can access case studies"
ON public.case_studies 
FOR ALL 
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "Published educational content is publicly readable" ON public.educational_content;
CREATE POLICY "Only admins can access educational content"
ON public.educational_content 
FOR ALL 
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "Market price trends are publicly readable" ON public.market_price_trends;
CREATE POLICY "Only admins can access market price trends"
ON public.market_price_trends 
FOR ALL 
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "Pricing plans are publicly readable" ON public.pricing_plans;
CREATE POLICY "Only admins can access pricing plans"
ON public.pricing_plans 
FOR ALL 
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "Plan features are publicly readable" ON public.plan_features;
CREATE POLICY "Only admins can access plan features"
ON public.plan_features 
FOR ALL 
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "Active promotional offers are publicly readable" ON public.promotional_offers;
CREATE POLICY "Only admins can access promotional offers"
ON public.promotional_offers 
FOR ALL 
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());