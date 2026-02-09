-- Add clear admin access policies for consultation bookings management

-- Simple admin access - clear and auditable
CREATE POLICY "Admins have full access to all consultation bookings - clear and secure"
ON public.consultation_bookings
FOR ALL
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- Remove duplicate admin policies that were created earlier
DROP POLICY IF EXISTS "Admins can view all consultation bookings" ON public.consultation_bookings;
DROP POLICY IF EXISTS "Admins can update all consultation bookings" ON public.consultation_bookings;
DROP POLICY IF EXISTS "Admins can delete all consultation bookings" ON public.consultation_bookings;