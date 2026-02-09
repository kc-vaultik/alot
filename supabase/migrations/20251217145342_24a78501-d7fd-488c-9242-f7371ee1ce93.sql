-- Drop and recreate get_active_rooms with correct column references
DROP FUNCTION IF EXISTS public.get_active_rooms(text);

CREATE OR REPLACE FUNCTION public.get_active_rooms(p_tier text DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result json;
BEGIN
  SELECT json_agg(room_data)
  INTO v_result
  FROM (
    SELECT 
      r.id,
      r.tier,
      r.tier_cap_cents,
      r.category,
      r.status,
      r.start_at,
      r.end_at,
      r.min_participants,
      r.max_participants,
      r.escrow_target_cents,
      r.escrow_balance_cents,
      r.created_at,
      (SELECT COUNT(*) FROM room_entries re WHERE re.room_id = r.id AND re.status = 'STAKED') as participant_count
    FROM rooms r
    WHERE r.status IN ('OPEN', 'LOCKED')
      AND (p_tier IS NULL OR r.tier = p_tier)
    ORDER BY r.end_at ASC
  ) room_data;

  RETURN COALESCE(v_result, '[]'::json);
END;
$$;