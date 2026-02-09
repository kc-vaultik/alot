-- Fix security vulnerability: Implement proper user-based access control
-- Users should only see their own bookings, not all customer data

-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view consultation bookings" ON public.consultation_bookings;

-- Create a secure policy that only allows users to see their own bookings
-- This matches the authenticated user's email with the booking's customer email
-- Drop if exists to avoid conflicts with previous migrations
DROP POLICY IF EXISTS "Users can only view their own consultation bookings" ON public.consultation_bookings;

CREATE POLICY "Users can only view their own consultation bookings"
ON public.consultation_bookings
FOR SELECT
USING (
  -- Allow if the authenticated user's email matches the booking's customer email
  auth.email() = customer_email
  OR
  -- OR if the user has admin role (for future admin implementation)
  -- For now, we'll use a more restrictive approach and require explicit admin checks
  FALSE -- Placeholder for future admin role checking
);

-- Update the UPDATE policy to be more restrictive
DROP POLICY IF EXISTS "Authenticated users can update consultation bookings" ON public.consultation_bookings;

-- Only allow users to update their own bookings, and only specific fields
-- Drop if exists to avoid conflicts with previous migrations
DROP POLICY IF EXISTS "Users can update their own consultation bookings" ON public.consultation_bookings;

CREATE POLICY "Users can update their own consultation bookings"
ON public.consultation_bookings
FOR UPDATE
USING (auth.email() = customer_email)
WITH CHECK (auth.email() = customer_email);

-- Update the DELETE policy to be more restrictive  
DROP POLICY IF EXISTS "Authenticated users can delete consultation bookings" ON public.consultation_bookings;

-- Only allow users to delete their own bookings
CREATE POLICY "Users can delete their own consultation bookings"
ON public.consultation_bookings
FOR DELETE
USING (auth.email() = customer_email);

-- Keep the public INSERT policy unchanged for the booking form
-- The "Anyone can create consultation bookings" policy remains as-is