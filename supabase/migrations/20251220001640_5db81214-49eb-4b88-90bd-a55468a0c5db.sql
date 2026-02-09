-- Add status field to collector_profiles for moderation
ALTER TABLE public.collector_profiles 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' 
CHECK (status IN ('active', 'suspended', 'banned'));

-- Add index for status filtering
CREATE INDEX IF NOT EXISTS idx_collector_profiles_status ON public.collector_profiles(status);

-- Create moderation_logs table for audit trail
CREATE TABLE IF NOT EXISTS public.moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  reason TEXT,
  details JSONB,
  performed_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.moderation_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view/create moderation logs
CREATE POLICY "Admins can view moderation logs"
ON public.moderation_logs FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create moderation logs"
ON public.moderation_logs FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));