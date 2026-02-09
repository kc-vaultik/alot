-- Drop the old 2-parameter versions that cause function overload ambiguity
-- This leaves only the 3-parameter versions with p_to_user_id uuid DEFAULT NULL

-- Drop old create_swap_offer(uuid, text) - the one WITHOUT default
DROP FUNCTION IF EXISTS public.create_swap_offer(uuid, text);

-- Drop old create_gift_transfer(uuid, text) - the one WITHOUT default  
DROP FUNCTION IF EXISTS public.create_gift_transfer(uuid, text);