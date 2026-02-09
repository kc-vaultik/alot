-- Fix security vulnerability in quotes table RLS policy
-- Remove overly permissive policy that allows any authenticated user to see all quotes
DROP POLICY IF EXISTS "Customers can view their own quotes" ON public.quotes;

-- Create secure policy that only allows customers to view quotes where they are the customer
-- OR where they are an admin (using the admin function)
CREATE POLICY "Secure customer quote access"
ON public.quotes 
FOR SELECT 
USING (
  (customer_email = auth.email()) OR 
  public.is_admin_user()
);