-- Configure OTP settings for better security
-- NOTE: These settings are now configured via Supabase Dashboard > Authentication > Email Auth
-- or via environment variables in newer Supabase versions.
-- The auth.config table is no longer directly writable.

-- OTP expiry: Set to 10 minutes (600 seconds) in Dashboard
-- Password reset token validity: Set to 1 hour (3600 seconds) in Dashboard

-- Migration placeholder (no-op)
SELECT 1;