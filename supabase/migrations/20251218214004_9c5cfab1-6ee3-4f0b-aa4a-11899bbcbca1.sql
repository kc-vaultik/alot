-- Update get_room_leaderboard to include tickets and amount_spent_cents for lottery rooms
CREATE OR REPLACE FUNCTION public.get_room_leaderboard(p_room_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_room RECORD;
  v_leaderboard jsonb;
  v_my_entry jsonb;
  v_total_tickets bigint;
BEGIN
  -- Get room
  SELECT * INTO v_room FROM rooms WHERE id = p_room_id;
  
  IF v_room IS NULL THEN
    RAISE EXCEPTION 'Room not found';
  END IF;

  -- Calculate total tickets for lottery rooms
  SELECT COALESCE(SUM(tickets), 0) INTO v_total_tickets
  FROM room_entries 
  WHERE room_id = p_room_id AND status = 'STAKED';

  -- If room is OPEN or LOCKED, only return the calling user's entry (sealed)
  IF v_room.status IN ('OPEN', 'LOCKED') THEN
    -- Return only user's own entry (sealed leaderboard)
    SELECT jsonb_build_object(
      'rank', NULL,
      'entry_id', re.id,
      'user_id', re.user_id,
      'reveal_id', re.reveal_id,
      'priority_score', re.priority_score,
      'status', re.status,
      'stake_snapshot', re.stake_snapshot,
      'early_stake_bonus', re.early_stake_bonus,
      -- Add lottery-specific fields
      'tickets', re.tickets,
      'amount_spent_cents', re.amount_spent_cents
    ) INTO v_my_entry
    FROM room_entries re
    WHERE re.room_id = p_room_id AND re.user_id = v_user_id AND re.status = 'STAKED';

    -- For lottery rooms (OPEN status), also return participant list with tickets
    -- but hide priority scores to maintain fairness
    IF v_room.is_mystery = false THEN
      SELECT jsonb_agg(
        jsonb_build_object(
          'rank', NULL,
          'entry_id', re.id,
          'user_id', re.user_id,
          'tickets', re.tickets,
          'username', cp.username,
          'display_name', cp.display_name,
          'avatar_url', cp.avatar_url
        ) ORDER BY re.tickets DESC
      ) INTO v_leaderboard
      FROM room_entries re
      LEFT JOIN collector_profiles cp ON cp.user_id = re.user_id
      WHERE re.room_id = p_room_id AND re.status = 'STAKED';
    END IF;

    RETURN jsonb_build_object(
      'room', jsonb_build_object(
        'id', v_room.id,
        'tier', v_room.tier,
        'tier_cap_cents', v_room.tier_cap_cents,
        'category', v_room.category,
        'status', v_room.status,
        'start_at', v_room.start_at,
        'end_at', v_room.end_at,
        'lock_at', v_room.lock_at,
        'min_participants', v_room.min_participants,
        'max_participants', v_room.max_participants,
        'escrow_target_cents', v_room.escrow_target_cents,
        'escrow_balance_cents', v_room.escrow_balance_cents,
        'leaderboard_visibility', v_room.leaderboard_visibility,
        'participant_count', (SELECT COUNT(*) FROM room_entries WHERE room_id = p_room_id AND status = 'STAKED'),
        'is_mystery', v_room.is_mystery
      ),
      'leaderboard', COALESCE(v_leaderboard, '[]'::jsonb),
      'my_entry', v_my_entry,
      'is_sealed', v_room.is_mystery,
      'total_tickets', v_total_tickets
    );
  END IF;

  -- Room is SETTLED or CLOSED - return full leaderboard
  SELECT jsonb_agg(
    jsonb_build_object(
      'rank', ranked.rank,
      'entry_id', ranked.id,
      'user_id', ranked.user_id,
      'reveal_id', ranked.reveal_id,
      'priority_score', ranked.priority_score,
      'status', ranked.status,
      'stake_snapshot', ranked.stake_snapshot,
      'percentile_band', ranked.percentile_band,
      'credits_awarded', ranked.credits_awarded,
      'packs_awarded', ranked.packs_awarded,
      'tickets', ranked.tickets,
      'amount_spent_cents', ranked.amount_spent_cents,
      'username', cp.username,
      'display_name', cp.display_name,
      'avatar_url', cp.avatar_url
    ) ORDER BY ranked.rank
  ) INTO v_leaderboard
  FROM (
    SELECT re.*, re.rank as rank
    FROM room_entries re
    WHERE re.room_id = p_room_id
    ORDER BY re.rank NULLS LAST, re.priority_score DESC
  ) ranked
  LEFT JOIN collector_profiles cp ON cp.user_id = ranked.user_id;

  RETURN jsonb_build_object(
    'room', jsonb_build_object(
      'id', v_room.id,
      'tier', v_room.tier,
      'tier_cap_cents', v_room.tier_cap_cents,
      'category', v_room.category,
      'status', v_room.status,
      'start_at', v_room.start_at,
      'end_at', v_room.end_at,
      'lock_at', v_room.lock_at,
      'min_participants', v_room.min_participants,
      'max_participants', v_room.max_participants,
      'escrow_target_cents', v_room.escrow_target_cents,
      'escrow_balance_cents', v_room.escrow_balance_cents,
      'winner_entry_id', v_room.winner_entry_id,
      'winner_user_id', v_room.winner_user_id,
      'leaderboard_visibility', v_room.leaderboard_visibility,
      'participant_count', (SELECT COUNT(*) FROM room_entries WHERE room_id = p_room_id),
      'is_mystery', v_room.is_mystery
    ),
    'leaderboard', COALESCE(v_leaderboard, '[]'::jsonb),
    'is_sealed', false,
    'total_tickets', v_total_tickets
  );
END;
$function$;