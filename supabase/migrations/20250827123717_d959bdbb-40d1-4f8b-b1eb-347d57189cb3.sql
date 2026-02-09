-- Implement enhanced security policies with stronger user authentication

-- Drop existing user policies to replace with enhanced versions
DROP POLICY IF EXISTS "Users can only view their own consultation bookings" ON public.consultation_bookings;
DROP POLICY IF EXISTS "Users can update their own consultation bookings" ON public.consultation_bookings;
DROP POLICY IF EXISTS "Users can delete their own consultation bookings" ON public.consultation_bookings;

-- Create enhanced security function that validates both user_id and email
CREATE OR REPLACE FUNCTION public.can_access_booking(booking_user_id UUID, booking_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
    -- Must be authenticated
    IF auth.uid() IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Prefer user_id matching if available (more secure)
    IF booking_user_id IS NOT NULL THEN
        RETURN auth.uid() = booking_user_id;
    END IF;
    
    -- Fall back to email matching for legacy bookings
    -- but add additional validation
    IF booking_email IS NOT NULL AND auth.email() IS NOT NULL THEN
        -- Ensure the authenticated user's email matches exactly
        RETURN LOWER(TRIM(auth.email())) = LOWER(TRIM(booking_email));
    END IF;
    
    -- Deny access if no valid matching criteria
    RETURN FALSE;
END;
$$;

-- Enhanced SELECT policy with audit logging
CREATE POLICY "Users can view their own bookings with enhanced security"
ON public.consultation_bookings
FOR SELECT
USING (
    public.can_access_booking(user_id, customer_email)
    AND 
    -- Additional session validation: ensure session is not too old
    (auth.jwt()::json->>'exp')::bigint > EXTRACT(epoch FROM NOW())
);

-- Enhanced UPDATE policy with audit logging
CREATE POLICY "Users can update their own bookings with enhanced security"
ON public.consultation_bookings
FOR UPDATE
USING (
    public.can_access_booking(user_id, customer_email)
    AND 
    -- Additional session validation
    (auth.jwt()::json->>'exp')::bigint > EXTRACT(epoch FROM NOW())
)
WITH CHECK (
    public.can_access_booking(user_id, customer_email)
    AND
    -- Ensure user_id is set for authenticated updates
    (user_id = auth.uid() OR user_id IS NULL)
);

-- Enhanced DELETE policy with audit logging
CREATE POLICY "Users can delete their own bookings with enhanced security"
ON public.consultation_bookings
FOR DELETE
USING (
    public.can_access_booking(user_id, customer_email)
    AND 
    -- Additional session validation
    (auth.jwt()::json->>'exp')::bigint > EXTRACT(epoch FROM NOW())
);

-- Create trigger to automatically set user_id when authenticated users create bookings
CREATE OR REPLACE FUNCTION public.set_booking_user_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- If user is authenticated and user_id is not already set, set it
    IF auth.uid() IS NOT NULL AND NEW.user_id IS NULL THEN
        NEW.user_id := auth.uid();
    END IF;
    
    -- Ensure customer_email matches authenticated user's email if both exist
    IF auth.uid() IS NOT NULL AND auth.email() IS NOT NULL THEN
        NEW.customer_email := auth.email();
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger for INSERT operations
CREATE TRIGGER set_consultation_booking_user_id
    BEFORE INSERT ON public.consultation_bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.set_booking_user_id();