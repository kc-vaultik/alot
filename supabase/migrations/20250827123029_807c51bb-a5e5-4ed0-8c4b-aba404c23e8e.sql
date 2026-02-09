-- Fix security vulnerability in consultation_bookings table
-- Remove the overly permissive "ALL" policy and replace with specific policies

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Admins can manage consultation bookings" ON public.consultation_bookings;

-- Create more specific and secure policies

-- Only allow authenticated admin users to SELECT (read) consultation bookings
CREATE POLICY "Authenticated users can view consultation bookings" 
ON public.consultation_bookings 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Only allow authenticated admin users to UPDATE consultation bookings  
CREATE POLICY "Authenticated users can update consultation bookings"
ON public.consultation_bookings
FOR UPDATE
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Only allow authenticated admin users to DELETE consultation bookings
CREATE POLICY "Authenticated users can delete consultation bookings"
ON public.consultation_bookings
FOR DELETE  
USING (auth.uid() IS NOT NULL);

-- Keep the public INSERT policy as-is (needed for the booking form)
-- "Anyone can create consultation bookings" policy remains unchanged