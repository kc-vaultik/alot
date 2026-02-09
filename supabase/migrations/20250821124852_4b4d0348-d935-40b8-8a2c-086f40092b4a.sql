-- GDPR and Legal Compliance Tables

-- Data export requests tracking
CREATE TABLE public.data_export_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  data_types TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  download_url TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Data deletion requests tracking
CREATE TABLE public.data_deletion_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  scheduled_for TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Consent records for GDPR compliance
CREATE TABLE public.consent_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  consent_type TEXT NOT NULL, -- 'analytics', 'marketing', 'data_processing', etc.
  granted BOOLEAN NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address INET,
  user_agent TEXT,
  consent_method TEXT, -- 'cookie_banner', 'settings_page', 'registration', etc.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User preferences for privacy settings
CREATE TABLE public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  preference_key TEXT NOT NULL,
  preference_value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, preference_key)
);

-- Enable Row Level Security
ALTER TABLE public.data_export_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_deletion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for data export requests
CREATE POLICY "Users can view their own export requests" 
ON public.data_export_requests 
FOR SELECT 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own export requests" 
ON public.data_export_requests 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id::text);

-- RLS Policies for data deletion requests
CREATE POLICY "Users can view their own deletion requests" 
ON public.data_deletion_requests 
FOR SELECT 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own deletion requests" 
ON public.data_deletion_requests 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own deletion requests" 
ON public.data_deletion_requests 
FOR UPDATE 
USING (auth.uid()::text = user_id::text);

-- RLS Policies for consent records
CREATE POLICY "Users can view their own consent records" 
ON public.consent_records 
FOR SELECT 
USING (auth.uid()::text = user_id::text OR user_id IS NULL);

CREATE POLICY "Anyone can create consent records" 
ON public.consent_records 
FOR INSERT 
WITH CHECK (true); -- Allow anonymous consent recording

CREATE POLICY "Users can update their own consent records" 
ON public.consent_records 
FOR UPDATE 
USING (auth.uid()::text = user_id::text);

-- RLS Policies for user preferences
CREATE POLICY "Users can view their own preferences" 
ON public.user_preferences 
FOR SELECT 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own preferences" 
ON public.user_preferences 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own preferences" 
ON public.user_preferences 
FOR UPDATE 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own preferences" 
ON public.user_preferences 
FOR DELETE 
USING (auth.uid()::text = user_id::text);

-- Indexes for performance
CREATE INDEX idx_data_export_requests_user_id ON public.data_export_requests(user_id);
CREATE INDEX idx_data_export_requests_status ON public.data_export_requests(status);
CREATE INDEX idx_data_deletion_requests_user_id ON public.data_deletion_requests(user_id);
CREATE INDEX idx_data_deletion_requests_status ON public.data_deletion_requests(status);
CREATE INDEX idx_data_deletion_requests_scheduled ON public.data_deletion_requests(scheduled_for) WHERE status = 'pending';
CREATE INDEX idx_consent_records_user_id ON public.consent_records(user_id);
CREATE INDEX idx_consent_records_type ON public.consent_records(consent_type);
CREATE INDEX idx_user_preferences_user_key ON public.user_preferences(user_id, preference_key);

-- Triggers for updated_at timestamps
CREATE TRIGGER update_data_export_requests_updated_at
  BEFORE UPDATE ON public.data_export_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_data_deletion_requests_updated_at
  BEFORE UPDATE ON public.data_deletion_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_consent_records_updated_at
  BEFORE UPDATE ON public.consent_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to automatically clean up expired data (for data retention)
CREATE OR REPLACE FUNCTION cleanup_expired_data() RETURNS void AS $$
BEGIN
  -- Clean up old security logs (older than 1 year)
  DELETE FROM public.security_logs 
  WHERE created_at < NOW() - INTERVAL '1 year';
  
  -- Clean up old consent records (keep only latest for each type per user)
  WITH latest_consents AS (
    SELECT DISTINCT ON (user_id, consent_type) 
      id, user_id, consent_type, recorded_at
    FROM public.consent_records 
    ORDER BY user_id, consent_type, recorded_at DESC
  )
  DELETE FROM public.consent_records 
  WHERE id NOT IN (SELECT id FROM latest_consents)
    AND recorded_at < NOW() - INTERVAL '2 years';
    
  -- Clean up completed export requests older than 30 days
  DELETE FROM public.data_export_requests 
  WHERE status = 'completed' 
    AND completed_at < NOW() - INTERVAL '30 days';
    
  -- Clean up failed requests older than 90 days
  DELETE FROM public.data_export_requests 
  WHERE status = 'failed' 
    AND created_at < NOW() - INTERVAL '90 days';
    
  DELETE FROM public.data_deletion_requests 
  WHERE status = 'failed' 
    AND created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users for cleanup function
GRANT EXECUTE ON FUNCTION cleanup_expired_data() TO authenticated;