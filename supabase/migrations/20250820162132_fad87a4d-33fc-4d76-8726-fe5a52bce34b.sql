-- Fix function security issue
CREATE OR REPLACE FUNCTION generate_booking_reference()
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  ref TEXT;
BEGIN
  ref := 'BK-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  -- Ensure uniqueness
  WHILE EXISTS (SELECT 1 FROM public.consultation_bookings WHERE booking_reference = ref) LOOP
    ref := 'BK-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  END LOOP;
  RETURN ref;
END;
$$;