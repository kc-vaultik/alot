-- Phase 1: Lottery Rooms Schema Updates

-- Add new columns to rooms table
ALTER TABLE public.rooms 
ADD COLUMN IF NOT EXISTS product_class_id uuid REFERENCES public.product_classes(id),
ADD COLUMN IF NOT EXISTS funding_target_cents bigint,
ADD COLUMN IF NOT EXISTS is_mystery boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS mystery_product_id uuid REFERENCES public.product_classes(id),
ADD COLUMN IF NOT EXISTS deadline_at timestamp with time zone;

-- Add comment for clarity
COMMENT ON COLUMN public.rooms.product_class_id IS 'The product being funded in this room (null for mystery rooms until revealed)';
COMMENT ON COLUMN public.rooms.funding_target_cents IS 'Target funding amount (retail_value × 2.5)';
COMMENT ON COLUMN public.rooms.is_mystery IS 'Whether this is a mystery room with hidden product';
COMMENT ON COLUMN public.rooms.mystery_product_id IS 'For mystery rooms: the actual product (revealed after funding)';
COMMENT ON COLUMN public.rooms.deadline_at IS 'Optional deadline for room funding';

-- Update status column to support new values
-- Current values: OPEN, LOCKED, FUNDED, CLOSED, SETTLED
-- New values: OPEN, FUNDED, DRAWING, SETTLED, EXPIRED, REFUNDING
-- We'll add a check constraint for valid statuses

ALTER TABLE public.rooms DROP CONSTRAINT IF EXISTS rooms_status_check;
ALTER TABLE public.rooms ADD CONSTRAINT rooms_status_check 
CHECK (status IN ('OPEN', 'FUNDED', 'DRAWING', 'SETTLED', 'EXPIRED', 'REFUNDING', 'LOCKED', 'CLOSED'));

-- Create index for product lookups
CREATE INDEX IF NOT EXISTS idx_rooms_product_class_id ON public.rooms(product_class_id);
CREATE INDEX IF NOT EXISTS idx_rooms_is_mystery ON public.rooms(is_mystery) WHERE is_mystery = true;
CREATE INDEX IF NOT EXISTS idx_rooms_status ON public.rooms(status);