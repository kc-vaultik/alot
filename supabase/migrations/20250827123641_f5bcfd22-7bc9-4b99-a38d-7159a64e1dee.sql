-- Strengthen security for consultation_bookings with additional safeguards

-- Add a user_id column to link authenticated users to their bookings
ALTER TABLE public.consultation_bookings 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create an audit log table for tracking access to sensitive data
CREATE TABLE IF NOT EXISTS public.consultation_booking_access_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES public.consultation_bookings(id) ON DELETE CASCADE,
    accessed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    access_type TEXT NOT NULL, -- 'view', 'update', 'delete'
    accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_agent TEXT,
    ip_address TEXT
);

-- Enable RLS on the audit log
ALTER TABLE public.consultation_booking_access_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view booking access logs"
ON public.consultation_booking_access_log
FOR SELECT
USING (public.is_admin_user());

-- Create a function to log access attempts with additional validation
CREATE OR REPLACE FUNCTION public.log_booking_access(
    p_booking_id UUID,
    p_access_type TEXT
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_agent_val TEXT;
    ip_address_val TEXT;
BEGIN
    -- Get user agent and IP from request headers
    user_agent_val := COALESCE(
        current_setting('request.headers', true)::json->>'user-agent', 
        'unknown'
    );
    ip_address_val := COALESCE(
        current_setting('request.headers', true)::json->>'x-forwarded-for',
        current_setting('request.headers', true)::json->>'x-real-ip',
        'unknown'
    );
    
    -- Insert audit log
    INSERT INTO public.consultation_booking_access_log (
        booking_id,
        accessed_by,
        access_type,
        user_agent,
        ip_address
    ) VALUES (
        p_booking_id,
        auth.uid(),
        p_access_type,
        user_agent_val,
        ip_address_val
    );
END;
$$;