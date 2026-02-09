-- Allow viewing reveals that are part of public marketplace listings
CREATE POLICY "Users can view reveals in public marketplace"
ON public.reveals
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.card_transfers ct
    WHERE ct.reveal_id = reveals.id
      AND ct.status = 'PENDING'
      AND ct.transfer_type = 'SWAP'
      AND ct.to_user_id IS NULL
  )
);