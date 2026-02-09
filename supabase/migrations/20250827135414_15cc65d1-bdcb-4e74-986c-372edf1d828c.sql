-- Clean up contact form related tables since we now use Resend
-- The contact_inquiries table is no longer needed as contact forms go directly to Resend

-- Drop the contact_inquiries table and its policies
DROP TABLE IF EXISTS public.contact_inquiries;

-- Note: We're keeping the following tables as they may still be useful:
-- - leads (for CRM and lead management)
-- - newsletter_subscriptions (for newsletter management)
-- - crm_integrations and crm_sync_logs (for CRM system integrations)