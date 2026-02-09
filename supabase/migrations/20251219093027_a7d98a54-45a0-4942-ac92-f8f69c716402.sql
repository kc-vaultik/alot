-- Drop existing policy
DROP POLICY IF EXISTS "Anyone can read active product classes" ON product_classes;

-- Create new policy that allows reading active products OR products the user has reveals for
CREATE POLICY "Users can read product classes for their reveals"
ON product_classes
FOR SELECT
USING (
  is_active = true 
  OR EXISTS (
    SELECT 1 FROM reveals 
    WHERE reveals.product_class_id = product_classes.id 
    AND reveals.user_id = auth.uid()
  )
);