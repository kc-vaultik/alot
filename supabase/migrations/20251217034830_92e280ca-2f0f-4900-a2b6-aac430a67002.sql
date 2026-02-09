-- Backfill collector profiles for existing users who don't have one
INSERT INTO public.collector_profiles (user_id, username, display_name)
SELECT 
  u.id,
  LOWER(REGEXP_REPLACE(COALESCE(u.raw_user_meta_data->>'full_name', SPLIT_PART(u.email, '@', 1)), '[^a-zA-Z0-9]', '', 'g')) || '_' || FLOOR(RANDOM() * 9000 + 1000)::TEXT,
  COALESCE(u.raw_user_meta_data->>'full_name', SPLIT_PART(u.email, '@', 1))
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.collector_profiles cp WHERE cp.user_id = u.id
)
ON CONFLICT (user_id) DO NOTHING;