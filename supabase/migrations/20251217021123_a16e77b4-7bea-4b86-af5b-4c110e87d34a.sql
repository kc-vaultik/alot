-- Drop the restrictive policy
DROP POLICY IF EXISTS "Users can read their own reveals" ON reveals;

-- Recreate as permissive (default)
CREATE POLICY "Users can read their own reveals"
ON reveals
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);