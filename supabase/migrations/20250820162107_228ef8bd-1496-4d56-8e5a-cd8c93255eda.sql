-- Create sales support tables for lead scoring, booking, and consultation systems

-- Lead scoring rules and models
CREATE TABLE public.lead_scoring_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_name TEXT NOT NULL UNIQUE,
  description TEXT,
  event_type TEXT NOT NULL,
  event_criteria JSONB NOT NULL, -- conditions that must be met
  score_change INTEGER NOT NULL, -- points to add/subtract
  max_occurrences INTEGER, -- limit how many times this rule can apply
  decay_days INTEGER, -- how many days before score decays
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Lead score history for tracking changes
CREATE TABLE public.lead_score_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  rule_id UUID NOT NULL REFERENCES public.lead_scoring_rules(id),
  score_change INTEGER NOT NULL,
  previous_score INTEGER NOT NULL,
  new_score INTEGER NOT NULL,
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Consultation bookings table
CREATE TABLE public.consultation_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_reference TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  customer_company TEXT,
  consultation_type TEXT NOT NULL CHECK (consultation_type IN ('demo', 'authentication_consultation', 'enterprise_consultation', 'investment_advisory', 'insurance_consultation')),
  preferred_date TIMESTAMP WITH TIME ZONE NOT NULL,
  alternative_date TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rescheduled', 'completed', 'cancelled', 'no_show')),
  meeting_type TEXT NOT NULL DEFAULT 'video_call' CHECK (meeting_type IN ('video_call', 'phone_call', 'in_person')),
  meeting_link TEXT,
  meeting_location TEXT,
  agenda TEXT,
  special_requirements TEXT,
  items_to_discuss JSONB DEFAULT '[]',
  estimated_portfolio_value DECIMAL(12,2),
  lead_source TEXT,
  utm_data JSONB DEFAULT '{}',
  assigned_consultant UUID,
  consultation_notes TEXT,
  follow_up_actions JSONB DEFAULT '[]',
  booking_confirmed_at TIMESTAMP WITH TIME ZONE,
  consultation_completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Service request forms table
CREATE TABLE public.service_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  customer_company TEXT,
  service_type TEXT NOT NULL CHECK (service_type IN ('authentication', 'valuation', 'insurance', 'storage', 'consultation', 'bulk_authentication', 'white_label')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_review', 'quoted', 'approved', 'in_progress', 'completed', 'on_hold', 'cancelled')),
  description TEXT NOT NULL,
  items_details JSONB DEFAULT '[]', -- array of items to be serviced
  estimated_value DECIMAL(12,2),
  requested_timeline TEXT,
  special_instructions TEXT,
  attachments JSONB DEFAULT '[]', -- file URLs and metadata
  internal_notes TEXT,
  assigned_to UUID,
  estimated_completion_date TIMESTAMP WITH TIME ZONE,
  actual_completion_date TIMESTAMP WITH TIME ZONE,
  customer_satisfaction_score INTEGER CHECK (customer_satisfaction_score >= 1 AND customer_satisfaction_score <= 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Quote generation and management
CREATE TABLE public.quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_company TEXT,
  quote_type TEXT NOT NULL CHECK (quote_type IN ('individual', 'bulk', 'enterprise', 'subscription')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired', 'revised')),
  services JSONB NOT NULL, -- array of services and pricing
  subtotal DECIMAL(12,2) NOT NULL,
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  tax_percentage DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
  terms_and_conditions TEXT,
  notes TEXT,
  internal_notes TEXT,
  created_by UUID,
  sent_at TIMESTAMP WITH TIME ZONE,
  viewed_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- CRM integration configurations
CREATE TABLE public.crm_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_name TEXT NOT NULL UNIQUE,
  crm_type TEXT NOT NULL CHECK (crm_type IN ('hubspot', 'salesforce', 'pipedrive', 'zoho', 'custom')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  api_endpoint TEXT,
  api_credentials JSONB, -- encrypted credentials
  field_mappings JSONB NOT NULL, -- maps our fields to CRM fields
  sync_direction TEXT NOT NULL DEFAULT 'bidirectional' CHECK (sync_direction IN ('push_only', 'pull_only', 'bidirectional')),
  sync_frequency_minutes INTEGER DEFAULT 15,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_status TEXT DEFAULT 'idle' CHECK (sync_status IN ('idle', 'syncing', 'error', 'paused')),
  error_message TEXT,
  webhook_url TEXT,
  webhook_secret TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- CRM sync logs for tracking integration activity
CREATE TABLE public.crm_sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_id UUID NOT NULL REFERENCES public.crm_integrations(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL CHECK (sync_type IN ('lead', 'contact', 'deal', 'activity')),
  operation TEXT NOT NULL CHECK (operation IN ('create', 'update', 'delete')),
  record_id TEXT NOT NULL, -- ID in our system
  external_id TEXT, -- ID in CRM system
  sync_direction TEXT NOT NULL CHECK (sync_direction IN ('push', 'pull')),
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'partial')),
  error_message TEXT,
  data_payload JSONB,
  response_data JSONB,
  sync_duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Sales funnel stages and conversion tracking
CREATE TABLE public.sales_funnel_stages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stage_name TEXT NOT NULL UNIQUE,
  stage_order INTEGER NOT NULL,
  description TEXT,
  conversion_goal TEXT,
  expected_duration_days INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Sales funnel progression tracking
CREATE TABLE public.sales_funnel_progression (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  stage_id UUID NOT NULL REFERENCES public.sales_funnel_stages(id),
  entered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  exited_at TIMESTAMP WITH TIME ZONE,
  duration_hours INTEGER,
  conversion_source TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.lead_scoring_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_score_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultation_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_funnel_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_funnel_progression ENABLE ROW LEVEL SECURITY;

-- Create public insert policies for customer-facing forms
CREATE POLICY "Anyone can create consultation bookings"
ON public.consultation_bookings
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can create service requests"
ON public.service_requests
FOR INSERT
WITH CHECK (true);

-- Create public read policies for sales funnel stages
CREATE POLICY "Active sales funnel stages are publicly readable"
ON public.sales_funnel_stages
FOR SELECT
USING (is_active = true);

-- Create user-specific policies for quotes
CREATE POLICY "Customers can view their own quotes"
ON public.quotes
FOR SELECT
USING (customer_email = auth.email() OR auth.uid() IS NOT NULL);

-- Create admin policies for management
CREATE POLICY "Admins can manage lead scoring rules"
ON public.lead_scoring_rules
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can view lead score history"
ON public.lead_score_history
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage consultation bookings"
ON public.consultation_bookings
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage service requests"
ON public.service_requests
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage quotes"
ON public.quotes
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage CRM integrations"
ON public.crm_integrations
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can view CRM sync logs"
ON public.crm_sync_logs
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage sales funnel stages"
ON public.sales_funnel_stages
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can view sales funnel progression"
ON public.sales_funnel_progression
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_lead_scoring_rules_updated_at
  BEFORE UPDATE ON public.lead_scoring_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_consultation_bookings_updated_at
  BEFORE UPDATE ON public.consultation_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_service_requests_updated_at
  BEFORE UPDATE ON public.service_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_crm_integrations_updated_at
  BEFORE UPDATE ON public.crm_integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sales_funnel_stages_updated_at
  BEFORE UPDATE ON public.sales_funnel_stages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_lead_score_history_lead_id ON public.lead_score_history(lead_id);
CREATE INDEX idx_consultation_bookings_email ON public.consultation_bookings(customer_email);
CREATE INDEX idx_consultation_bookings_date ON public.consultation_bookings(preferred_date);
CREATE INDEX idx_consultation_bookings_status ON public.consultation_bookings(status);
CREATE INDEX idx_service_requests_status ON public.service_requests(status);
CREATE INDEX idx_service_requests_email ON public.service_requests(customer_email);
CREATE INDEX idx_quotes_customer_email ON public.quotes(customer_email);
CREATE INDEX idx_quotes_status ON public.quotes(status);
CREATE INDEX idx_crm_sync_logs_integration ON public.crm_sync_logs(integration_id);
CREATE INDEX idx_sales_funnel_progression_lead ON public.sales_funnel_progression(lead_id);

-- Insert initial lead scoring rules
INSERT INTO public.lead_scoring_rules (rule_name, description, event_type, event_criteria, score_change) VALUES
('Website Visit', 'Basic website visit', 'page_view', '{"page_type": "any"}', 1),
('Pricing Page Visit', 'Visited pricing page', 'page_view', '{"page_url": "/pricing"}', 5),
('What We Authenticate Visit', 'Visited authentication page', 'page_view', '{"page_url": "/what-we-authenticate"}', 3),
('Newsletter Signup', 'Subscribed to newsletter', 'conversion', '{"type": "newsletter_signup"}', 15),
('Contact Form Submission', 'Submitted contact form', 'conversion', '{"type": "contact_form"}', 25),
('Item Valuation Request', 'Used valuation tool', 'engagement', '{"tool": "valuation"}', 20),
('ROI Calculator Usage', 'Used ROI calculator', 'engagement', '{"tool": "roi_calculator"}', 10),
('Consultation Booking', 'Booked consultation', 'conversion', '{"type": "consultation_booking"}', 50),
('Repeat Visit (Same Day)', 'Multiple visits same day', 'engagement', '{"frequency": "same_day"}', 5),
('High-Value Item Interest', 'Interested in high-value items', 'engagement', '{"value_threshold": 10000}', 15);

-- Insert initial sales funnel stages
INSERT INTO public.sales_funnel_stages (stage_name, stage_order, description, expected_duration_days) VALUES
('Awareness', 1, 'Initial website visit or brand awareness', 1),
('Interest', 2, 'Engaged with content, used tools, or subscribed', 3),
('Consideration', 3, 'Multiple visits, downloaded resources, or contacted us', 7),
('Intent', 4, 'Requested consultation or quote', 5),
('Evaluation', 5, 'In active discussion, received quote', 10),
('Purchase', 6, 'Converted to customer', 1);

-- Generate unique booking reference function
CREATE OR REPLACE FUNCTION generate_booking_reference()
RETURNS TEXT AS $$
DECLARE
  ref TEXT;
BEGIN
  ref := 'BK-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  -- Ensure uniqueness
  WHILE EXISTS (SELECT 1 FROM public.consultation_bookings WHERE booking_reference = ref) LOOP
    ref := 'BK-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  END LOOP;
  RETURN ref;
END;
$$ LANGUAGE plpgsql;