-- Fix Supabase OTP expiry settings and add security configurations

-- Update auth.users table to include security fields if not exists
DO $$
BEGIN
  -- Add columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_sign_in_at' AND table_schema = 'auth') THEN
    -- This column should already exist in Supabase auth schema
    NULL;
  END IF;
END $$;

-- Create a function to cleanup expired sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
BEGIN
  -- Delete expired refresh tokens (older than 30 days)
  DELETE FROM auth.refresh_tokens 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  -- Delete expired sessions (older than 7 days inactive)
  DELETE FROM auth.sessions 
  WHERE updated_at < NOW() - INTERVAL '7 days';
END;
$$;

-- Create a function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  event_type text,
  user_id uuid DEFAULT NULL,
  details jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.security_logs (
    event_type,
    user_id,
    details,
    ip_address,
    user_agent,
    created_at
  ) VALUES (
    event_type,
    user_id,
    details,
    COALESCE(current_setting('request.headers', true)::json->>'x-forwarded-for', 'unknown'),
    COALESCE(current_setting('request.headers', true)::json->>'user-agent', 'unknown'),
    NOW()
  );
END;
$$;

-- Create security logs table for tracking authentication and security events
CREATE TABLE IF NOT EXISTS public.security_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS on security logs
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for security logs (only service role can access)
CREATE POLICY "Service role can manage security logs" 
ON public.security_logs 
FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');

-- Create indexes for security logs
CREATE INDEX IF NOT EXISTS idx_security_logs_event_type ON public.security_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON public.security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON public.security_logs(created_at);

-- Create rate limiting table for API endpoints
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL, -- IP address or user ID
  endpoint TEXT NOT NULL,
  requests_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS on rate limits
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Create policies for rate limits (only service role can access)
CREATE POLICY "Service role can manage rate limits" 
ON public.rate_limits 
FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');

-- Create indexes for rate limits
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier_endpoint ON public.rate_limits(identifier, endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start ON public.rate_limits(window_start);

-- Create function to check rate limits
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier text,
  p_endpoint text,
  p_max_requests integer DEFAULT 100,
  p_window_minutes integer DEFAULT 60
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_count integer;
  window_start_time timestamp with time zone;
BEGIN
  window_start_time := NOW() - INTERVAL '1 minute' * p_window_minutes;
  
  -- Get current count for this identifier and endpoint in the time window
  SELECT COALESCE(SUM(requests_count), 0)
  INTO current_count
  FROM public.rate_limits
  WHERE identifier = p_identifier
    AND endpoint = p_endpoint
    AND window_start > window_start_time;
  
  -- If under limit, record this request
  IF current_count < p_max_requests THEN
    INSERT INTO public.rate_limits (identifier, endpoint, requests_count)
    VALUES (p_identifier, p_endpoint, 1)
    ON CONFLICT (identifier, endpoint) 
    DO UPDATE SET 
      requests_count = rate_limits.requests_count + 1,
      window_start = CASE 
        WHEN rate_limits.window_start < window_start_time 
        THEN NOW() 
        ELSE rate_limits.window_start 
      END;
    
    RETURN true;
  ELSE
    -- Log rate limit exceeded
    PERFORM public.log_security_event(
      'rate_limit_exceeded',
      NULL,
      jsonb_build_object(
        'identifier', p_identifier,
        'endpoint', p_endpoint,
        'current_count', current_count,
        'max_requests', p_max_requests
      )
    );
    
    RETURN false;
  END IF;
END;
$$;

-- Create cleanup function that runs periodically
CREATE OR REPLACE FUNCTION public.cleanup_old_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Cleanup old security logs (keep 90 days)
  DELETE FROM public.security_logs 
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  -- Cleanup old rate limit entries (keep 24 hours)
  DELETE FROM public.rate_limits 
  WHERE created_at < NOW() - INTERVAL '24 hours';
  
  -- Cleanup expired sessions
  PERFORM public.cleanup_expired_sessions();
END;
$$;