-- Configure OTP settings for better security
-- Set OTP expiry to 10 minutes (600 seconds) instead of default
UPDATE auth.config SET 
  otp_expiry = 600,
  sms_otp_expiry = 600
WHERE true;

-- Also configure password reset expiry to be more secure
UPDATE auth.config SET 
  password_reset_token_validity_period = 3600 -- 1 hour
WHERE true;