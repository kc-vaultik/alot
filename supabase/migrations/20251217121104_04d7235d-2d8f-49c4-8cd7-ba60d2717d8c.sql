-- Allow authenticated users to view public marketplace listings
-- (transfers where to_user_id IS NULL, meaning they're available for anyone)
CREATE POLICY "Anyone can view public marketplace listings"
ON public.card_transfers
FOR SELECT
TO authenticated
USING (
  to_user_id IS NULL 
  AND status = 'PENDING'
  AND transfer_type = 'SWAP'
);