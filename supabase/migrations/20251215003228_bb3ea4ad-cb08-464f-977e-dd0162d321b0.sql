-- Add revealed_at column to track when user has seen the reveal animation
ALTER TABLE public.reveals
ADD COLUMN IF NOT EXISTS revealed_at TIMESTAMPTZ;

-- Backfill: mark all existing reveals as already seen (so they appear in vault)
UPDATE public.reveals
SET revealed_at = created_at
WHERE revealed_at IS NULL;

-- Create RPC function to mark a reveal as seen after animation completes
CREATE OR REPLACE FUNCTION public.mark_reveal_seen(p_reveal_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  UPDATE public.reveals
  SET revealed_at = now()
  WHERE id = p_reveal_id
    AND user_id = auth.uid();
$$;