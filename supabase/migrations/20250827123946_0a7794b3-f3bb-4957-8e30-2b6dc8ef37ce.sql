-- SECURITY FIX: Replace complex access control with simple, bulletproof policies
-- Clear, auditable policies that eliminate potential vulnerabilities

-- Drop all existing complex policies
DROP POLICY IF EXISTS "Users can view their own bookings with enhanced security" ON public.consultation_bookings;
DROP POLICY IF EXISTS "Users can update their own bookings with enhanced security" ON public.consultation_bookings;  
DROP POLICY IF EXISTS "Users can delete their own bookings with enhanced security" ON public.consultation_bookings;

-- Drop the complex access control function
DROP FUNCTION IF EXISTS public.can_access_booking(UUID, TEXT);

-- Create simple, bulletproof user access policies
-- CRYSTAL CLEAR: Users can only access bookings where user_id exactly matches their auth.uid()

CREATE POLICY "Users can view only their own bookings - simple and secure"
ON public.consultation_bookings
FOR SELECT
USING (
    auth.uid() IS NOT NULL 
    AND user_id IS NOT NULL 
    AND user_id = auth.uid()
);

CREATE POLICY "Users can update only their own bookings - simple and secure"
ON public.consultation_bookings
FOR UPDATE
USING (
    auth.uid() IS NOT NULL 
    AND user_id IS NOT NULL 
    AND user_id = auth.uid()
)
WITH CHECK (
    auth.uid() IS NOT NULL 
    AND user_id IS NOT NULL 
    AND user_id = auth.uid()
);

CREATE POLICY "Users can delete only their own bookings - simple and secure"
ON public.consultation_bookings
FOR DELETE
USING (
    auth.uid() IS NOT NULL 
    AND user_id IS NOT NULL 
    AND user_id = auth.uid()
);

-- Update the INSERT trigger to ALWAYS set user_id for authenticated users
-- and validate email consistency
CREATE OR REPLACE FUNCTION public.secure_booking_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- If user is authenticated, MUST set user_id and ensure email consistency
    IF auth.uid() IS NOT NULL THEN
        NEW.user_id := auth.uid();
        
        -- If authenticated user has an email, use their verified email
        IF auth.email() IS NOT NULL THEN
            NEW.customer_email := auth.email();
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Replace the existing trigger
DROP TRIGGER IF EXISTS set_consultation_booking_user_id ON public.consultation_bookings;
CREATE TRIGGER secure_consultation_booking_insert
    BEFORE INSERT ON public.consultation_bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.secure_booking_insert();