-- Create card_transfers table for tracking gifts and swaps
CREATE TABLE public.card_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reveal_id uuid NOT NULL REFERENCES public.reveals(id) ON DELETE CASCADE,
  from_user_id uuid NOT NULL,
  to_user_id uuid,
  transfer_type TEXT NOT NULL CHECK (transfer_type IN ('GIFT', 'SWAP')),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CLAIMED', 'EXPIRED', 'CANCELLED')),
  claim_token TEXT UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  claimed_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days')
);

-- Create swap_offers table for tracking swap requests
CREATE TABLE public.swap_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offerer_transfer_id uuid NOT NULL REFERENCES public.card_transfers(id) ON DELETE CASCADE,
  receiver_reveal_id uuid REFERENCES public.reveals(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

-- Enable RLS on both tables
ALTER TABLE public.card_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swap_offers ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_card_transfers_from_user ON public.card_transfers(from_user_id);
CREATE INDEX idx_card_transfers_to_user ON public.card_transfers(to_user_id);
CREATE INDEX idx_card_transfers_reveal ON public.card_transfers(reveal_id);
CREATE INDEX idx_card_transfers_claim_token ON public.card_transfers(claim_token);
CREATE INDEX idx_card_transfers_status ON public.card_transfers(status);
CREATE INDEX idx_swap_offers_transfer ON public.swap_offers(offerer_transfer_id);

-- RLS Policies for card_transfers

-- Users can view transfers they sent or received
CREATE POLICY "Users can view their own transfers"
ON public.card_transfers
FOR SELECT
USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- Users can create transfers for cards they own
CREATE POLICY "Users can create transfers for their cards"
ON public.card_transfers
FOR INSERT
WITH CHECK (
  auth.uid() = from_user_id 
  AND EXISTS (
    SELECT 1 FROM public.reveals 
    WHERE id = reveal_id AND user_id = auth.uid()
  )
);

-- Users can update their own pending transfers (cancel)
CREATE POLICY "Users can update their own transfers"
ON public.card_transfers
FOR UPDATE
USING (auth.uid() = from_user_id AND status = 'PENDING');

-- Users can delete their own pending transfers
CREATE POLICY "Users can delete their own transfers"
ON public.card_transfers
FOR DELETE
USING (auth.uid() = from_user_id AND status = 'PENDING');

-- RLS Policies for swap_offers

-- Users can view swap offers related to their transfers or cards
CREATE POLICY "Users can view their swap offers"
ON public.swap_offers
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.card_transfers ct 
    WHERE ct.id = offerer_transfer_id 
    AND (ct.from_user_id = auth.uid() OR ct.to_user_id = auth.uid())
  )
  OR EXISTS (
    SELECT 1 FROM public.reveals r 
    WHERE r.id = receiver_reveal_id AND r.user_id = auth.uid()
  )
);

-- Users can create swap offers for transfers targeting them
CREATE POLICY "Users can create swap offers"
ON public.swap_offers
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.reveals r 
    WHERE r.id = receiver_reveal_id AND r.user_id = auth.uid()
  )
);

-- Users can update swap offers they're involved in
CREATE POLICY "Users can update their swap offers"
ON public.swap_offers
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.card_transfers ct 
    WHERE ct.id = offerer_transfer_id 
    AND ct.from_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.reveals r 
    WHERE r.id = receiver_reveal_id AND r.user_id = auth.uid()
  )
);