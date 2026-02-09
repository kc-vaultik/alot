-- Add admin access policy for consultation bookings management
-- This will allow designated admin users to manage all bookings

-- Create a security definer function to check admin role
-- This will be used when you implement user roles in the future
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  -- For now, we'll use a simple check - you can enhance this later with proper role tables
  -- This is a placeholder that always returns false until you implement admin roles
  -- You would replace this with actual role checking logic like:
  -- SELECT EXISTS(SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Add admin SELECT policy
CREATE POLICY "Admins can view all consultation bookings" 
ON public.consultation_bookings 
FOR SELECT 
USING (public.is_admin_user());

-- Add admin UPDATE policy  
CREATE POLICY "Admins can update all consultation bookings"
ON public.consultation_bookings
FOR UPDATE
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- Add admin DELETE policy
CREATE POLICY "Admins can delete all consultation bookings"
ON public.consultation_bookings
FOR DELETE
USING (public.is_admin_user());