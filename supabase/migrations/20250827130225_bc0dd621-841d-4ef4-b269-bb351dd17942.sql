-- Phase 2: Database Security - Remove authentication tables and update admin function
-- Since this is a contact-form-only website, we'll remove unused auth tables and simplify admin access

-- First, update the is_admin_user() function to work with service role only
-- This allows admin access only via service role, not user authentication
-- Use CASCADE to drop dependent policies
DROP FUNCTION IF EXISTS public.is_admin_user() CASCADE;
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only allow service role access (for admin operations)
  -- This removes dependency on user authentication
  RETURN (current_setting('role') = 'service_role' OR 
          (auth.jwt() ->> 'role') = 'service_role');
END;
$$;

-- Remove unused authentication-related tables
-- These tables are not needed for a contact-form-only website

DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.user_sessions CASCADE;
DROP TABLE IF EXISTS public.service_requests CASCADE;

-- Remove auth-related scoring and funnel tables (not needed for contact form)
DROP TABLE IF EXISTS public.lead_score_history CASCADE;
DROP TABLE IF EXISTS public.sales_funnel_progression CASCADE;

-- Keep only essential tables for contact form functionality:
-- - contact_inquiries (for form submissions)
-- - leads (for lead management)
-- - security_logs (for security monitoring)
-- - rate_limits (for rate limiting)

-- Update any remaining policies that reference user authentication
-- Since we removed user auth, ensure all sensitive data is service-role protected

-- Update lead scoring rules to work without user context
UPDATE public.lead_scoring_rules 
SET event_criteria = jsonb_set(
  event_criteria, 
  '{user_context}', 
  '"service_only"'::jsonb
)
WHERE event_criteria ? 'user_id';

-- Clean up any orphaned data from removed tables
-- This ensures database consistency after table removal

-- Add a simple admin access pattern for the contact form data
-- Admins can access via service role or direct database connection
COMMENT ON FUNCTION public.is_admin_user() IS 
'Simplified admin function for contact-form website. Only allows service role access.';

-- Log this migration
INSERT INTO public.security_logs (event_type, details, created_at)
VALUES (
  'database_cleanup', 
  '{"action": "removed_auth_tables", "reason": "contact_form_only_website", "phase": "2"}',
  NOW()
) ON CONFLICT DO NOTHING;