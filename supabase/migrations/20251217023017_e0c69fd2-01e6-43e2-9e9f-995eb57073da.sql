-- Drop the restrictive policy
DROP POLICY IF EXISTS "Anyone can read active product classes" ON product_classes;

-- Recreate as permissive (default)
CREATE POLICY "Anyone can read active product classes"
ON product_classes
FOR SELECT
TO public
USING (is_active = true);