-- Fix the security warning for the admin function
-- Set proper search_path to prevent security issues

CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER 
STABLE
SET search_path = public
AS $$
BEGIN
  -- For now, we'll use a simple check - you can enhance this later with proper role tables
  -- This is a placeholder that always returns false until you implement admin roles
  -- You would replace this with actual role checking logic like:
  -- SELECT EXISTS(SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  RETURN FALSE;
END;
$$;