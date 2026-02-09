-- Phase 2: Update RPCs for Sealed Rooms & Rewards

-- 2.1 Update join_room RPC with lock check and early stake bonus
CREATE OR REPLACE FUNCTION public.join_room(p_room_id uuid, p_reveal_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_room RECORD;
  v_reveal RECORD;
  v_product RECORD;
  v_entry_id uuid;
  v_rc_cents bigint;
  v_pp integer;
  v_rs numeric;
  v_priority_score numeric;
  v_stake_snapshot jsonb;
  v_participant_count integer;
  v_early_stake_bonus numeric := 0;
  v_room_duration_hours numeric;
  v_time_since_start_hours numeric;
BEGIN
  -- Check authentication
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get room with lock
  SELECT * INTO v_room FROM rooms WHERE id = p_room_id FOR UPDATE;
  
  IF v_room IS NULL THEN
    RAISE EXCEPTION 'Room not found';
  END IF;

  -- Check room status
  IF v_room.status != 'OPEN' THEN
    RAISE EXCEPTION 'Room is not open for entries';
  END IF;

  -- Check if room is locked (new check)
  IF v_room.lock_at IS NOT NULL AND now() >= v_room.lock_at THEN
    RAISE EXCEPTION 'Room is locked for new entries';
  END IF;

  -- Check max participants
  SELECT COUNT(*) INTO v_participant_count 
  FROM room_entries WHERE room_id = p_room_id AND status = 'STAKED';
  
  IF v_participant_count >= v_room.max_participants THEN
    RAISE EXCEPTION 'Room is full';
  END IF;

  -- Check user doesn't already have an entry
  IF EXISTS (SELECT 1 FROM room_entries WHERE room_id = p_room_id AND user_id = v_user_id AND status = 'STAKED') THEN
    RAISE EXCEPTION 'Already entered this room';
  END IF;

  -- Get the reveal and verify ownership
  SELECT * INTO v_reveal FROM reveals WHERE id = p_reveal_id AND user_id = v_user_id;
  
  IF v_reveal IS NULL THEN
    RAISE EXCEPTION 'Card not found or not owned';
  END IF;

  -- Check card state
  IF v_reveal.card_state != 'owned' THEN
    RAISE EXCEPTION 'Card is not available for staking';
  END IF;

  -- Get product details
  SELECT * INTO v_product FROM product_classes WHERE id = v_reveal.product_class_id;
  
  IF v_product IS NULL THEN
    RAISE EXCEPTION 'Product not found';
  END IF;

  -- Check tier eligibility (card value must be <= tier cap)
  IF (v_product.retail_value_usd * 100) > v_room.tier_cap_cents THEN
    RAISE EXCEPTION 'Card value exceeds room tier cap';
  END IF;

  -- Calculate RC (redeem credits in cents)
  v_rc_cents := v_reveal.redeem_credits_cents;

  -- Calculate PP (priority points)
  v_pp := v_reveal.priority_points;

  -- Calculate RS (rarity score based on band)
  v_rs := CASE v_reveal.band
    WHEN 'ICON' THEN 25
    WHEN 'RARE' THEN 50
    WHEN 'GRAIL' THEN 75
    WHEN 'MYTHIC' THEN 100
    ELSE 25
  END;

  -- Calculate early stake bonus (up to +3 points for early entry)
  IF v_room.lock_at IS NOT NULL AND v_room.start_at IS NOT NULL THEN
    v_room_duration_hours := EXTRACT(EPOCH FROM (v_room.lock_at - v_room.start_at)) / 3600;
    v_time_since_start_hours := EXTRACT(EPOCH FROM (now() - v_room.start_at)) / 3600;
    
    IF v_room_duration_hours > 0 THEN
      -- Linear bonus: 3 points at start, 0 at lock time
      v_early_stake_bonus := GREATEST(0, 3 * (1 - (v_time_since_start_hours / v_room_duration_hours)));
    END IF;
  END IF;

  -- Calculate priority score using weights: RC 55%, PP 35%, RS 10%
  -- Normalize RC to 0-100 scale based on tier cap
  v_priority_score := (
    (LEAST(v_rc_cents::numeric / v_room.tier_cap_cents, 1) * 100 * 0.55) +
    (LEAST(v_pp::numeric / 1000, 1) * 100 * 0.35) +
    (v_rs * 0.10) +
    v_early_stake_bonus
  );

  -- Build stake snapshot
  v_stake_snapshot := jsonb_build_object(
    'rc_cents', v_rc_cents,
    'pp', v_pp,
    'rs', v_rs,
    'product_value_cents', (v_product.retail_value_usd * 100)::bigint,
    'product_name', v_product.name,
    'band', v_reveal.band
  );

  -- Create room entry
  INSERT INTO room_entries (room_id, user_id, reveal_id, stake_snapshot, priority_score, status, early_stake_bonus)
  VALUES (p_room_id, v_user_id, p_reveal_id, v_stake_snapshot, v_priority_score, 'STAKED', v_early_stake_bonus)
  RETURNING id INTO v_entry_id;

  -- Update card state to staked
  UPDATE reveals 
  SET card_state = 'staked', staked_at = now(), staked_room_id = p_room_id
  WHERE id = p_reveal_id;

  -- Update room escrow balance
  UPDATE rooms 
  SET escrow_balance_cents = escrow_balance_cents + (v_product.retail_value_usd * 100)::bigint
  WHERE id = p_room_id;

  RETURN jsonb_build_object(
    'success', true,
    'entry_id', v_entry_id,
    'room', jsonb_build_object(
      'id', v_room.id,
      'tier', v_room.tier,
      'status', v_room.status,
      'participants', v_participant_count + 1,
      'max_participants', v_room.max_participants,
      'escrow_balance_cents', v_room.escrow_balance_cents + (v_product.retail_value_usd * 100)::bigint,
      'escrow_target_cents', v_room.escrow_target_cents
    ),
    'stake_snapshot', v_stake_snapshot,
    'priority_score', v_priority_score,
    'early_stake_bonus', v_early_stake_bonus
  );
END;
$function$;

-- 2.2 Update leave_room RPC with lock check
CREATE OR REPLACE FUNCTION public.leave_room(p_room_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_room RECORD;
  v_entry RECORD;
  v_product_value_cents bigint;
BEGIN
  -- Check authentication
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get room with lock
  SELECT * INTO v_room FROM rooms WHERE id = p_room_id FOR UPDATE;
  
  IF v_room IS NULL THEN
    RAISE EXCEPTION 'Room not found';
  END IF;

  -- Check room status - can only leave OPEN rooms
  IF v_room.status != 'OPEN' THEN
    RAISE EXCEPTION 'Cannot leave room that is not open';
  END IF;

  -- Check if room is locked (new check)
  IF v_room.lock_at IS NOT NULL AND now() >= v_room.lock_at THEN
    RAISE EXCEPTION 'Cannot leave after room is locked';
  END IF;

  -- Get user's entry
  SELECT * INTO v_entry 
  FROM room_entries 
  WHERE room_id = p_room_id AND user_id = v_user_id AND status = 'STAKED'
  FOR UPDATE;
  
  IF v_entry IS NULL THEN
    RAISE EXCEPTION 'No active entry found in this room';
  END IF;

  -- Get product value from snapshot
  v_product_value_cents := (v_entry.stake_snapshot->>'product_value_cents')::bigint;

  -- Delete the entry
  DELETE FROM room_entries WHERE id = v_entry.id;

  -- Return card to owned state
  UPDATE reveals 
  SET card_state = 'owned', staked_at = NULL, staked_room_id = NULL
  WHERE id = v_entry.reveal_id;

  -- Update room escrow balance
  UPDATE rooms 
  SET escrow_balance_cents = escrow_balance_cents - v_product_value_cents
  WHERE id = p_room_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Successfully left the room',
    'reveal_id', v_entry.reveal_id
  );
END;
$function$;

-- 2.3 Update get_room_leaderboard RPC with sealed visibility
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
BEGIN
  -- Get room
  SELECT * INTO v_room FROM rooms WHERE id = p_room_id;
  
  IF v_room IS NULL THEN
    RAISE EXCEPTION 'Room not found';
  END IF;

  -- If room is OPEN or LOCKED, only return the calling user's entry
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
      'early_stake_bonus', re.early_stake_bonus
    ) INTO v_my_entry
    FROM room_entries re
    WHERE re.room_id = p_room_id AND re.user_id = v_user_id AND re.status = 'STAKED';

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
        'participant_count', (SELECT COUNT(*) FROM room_entries WHERE room_id = p_room_id AND status = 'STAKED')
      ),
      'leaderboard', '[]'::jsonb,
      'my_entry', v_my_entry,
      'is_sealed', true
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
      'participant_count', (SELECT COUNT(*) FROM room_entries WHERE room_id = p_room_id)
    ),
    'leaderboard', COALESCE(v_leaderboard, '[]'::jsonb),
    'is_sealed', false
  );
END;
$function$;

-- 2.4 Create get_my_room_entry RPC
CREATE OR REPLACE FUNCTION public.get_my_room_entry(p_room_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_room RECORD;
  v_entry RECORD;
  v_competitiveness_band text;
  v_improvement_tips jsonb := '[]'::jsonb;
  v_participant_count integer;
  v_avg_score numeric;
BEGIN
  -- Check authentication
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get room
  SELECT * INTO v_room FROM rooms WHERE id = p_room_id;
  
  IF v_room IS NULL THEN
    RAISE EXCEPTION 'Room not found';
  END IF;

  -- Get user's entry
  SELECT * INTO v_entry 
  FROM room_entries 
  WHERE room_id = p_room_id AND user_id = v_user_id AND status = 'STAKED';
  
  IF v_entry IS NULL THEN
    RETURN jsonb_build_object(
      'has_entry', false,
      'room_id', p_room_id,
      'room_status', v_room.status
    );
  END IF;

  -- Get participant count and average score for context
  SELECT COUNT(*), AVG(priority_score) 
  INTO v_participant_count, v_avg_score
  FROM room_entries 
  WHERE room_id = p_room_id AND status = 'STAKED';

  -- Determine competitiveness band based on score thresholds
  v_competitiveness_band := CASE
    WHEN v_entry.priority_score >= 70 THEN 'High'
    WHEN v_entry.priority_score >= 40 THEN 'Medium'
    ELSE 'Low'
  END;

  -- Build improvement tips based on stake snapshot
  IF (v_entry.stake_snapshot->>'rc_cents')::numeric < v_room.tier_cap_cents * 0.5 THEN
    v_improvement_tips := v_improvement_tips || '"Earn more Redeem Credits to boost your score"'::jsonb;
  END IF;
  
  IF (v_entry.stake_snapshot->>'pp')::integer < 500 THEN
    v_improvement_tips := v_improvement_tips || '"Gain Priority Points through battles and activities"'::jsonb;
  END IF;
  
  IF v_entry.stake_snapshot->>'band' IN ('ICON', 'RARE') THEN
    v_improvement_tips := v_improvement_tips || '"Higher rarity cards provide better Rarity Score"'::jsonb;
  END IF;

  RETURN jsonb_build_object(
    'has_entry', true,
    'entry', jsonb_build_object(
      'id', v_entry.id,
      'room_id', v_entry.room_id,
      'reveal_id', v_entry.reveal_id,
      'priority_score', v_entry.priority_score,
      'early_stake_bonus', v_entry.early_stake_bonus,
      'stake_snapshot', v_entry.stake_snapshot,
      'staked_at', v_entry.staked_at,
      'status', v_entry.status,
      'percentile_band', v_entry.percentile_band,
      'credits_awarded', v_entry.credits_awarded,
      'packs_awarded', v_entry.packs_awarded
    ),
    'competitiveness_band', v_competitiveness_band,
    'improvement_tips', v_improvement_tips,
    'room_status', v_room.status,
    'participant_count', v_participant_count,
    'avg_score', ROUND(v_avg_score, 2)
  );
END;
$function$;

-- 2.5 Update settle_room RPC with rewards calculation
CREATE OR REPLACE FUNCTION public.settle_room(p_room_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_room RECORD;
  v_winner_entry RECORD;
  v_entry RECORD;
  v_reward_config RECORD;
  v_total_entries integer;
  v_current_rank integer := 0;
  v_percentile numeric;
  v_percentile_band text;
  v_placement_bonus integer;
  v_pack_bonus integer;
  v_credits_awarded integer;
  v_packs_awarded integer;
  v_results jsonb := '[]'::jsonb;
BEGIN
  -- Get room with lock
  SELECT * INTO v_room FROM rooms WHERE id = p_room_id FOR UPDATE;
  
  IF v_room IS NULL THEN
    RAISE EXCEPTION 'Room not found';
  END IF;

  -- Check room can be settled
  IF v_room.status NOT IN ('LOCKED', 'OPEN') THEN
    RAISE EXCEPTION 'Room cannot be settled - status: %', v_room.status;
  END IF;

  -- Get reward config for this tier
  SELECT * INTO v_reward_config FROM room_reward_config WHERE tier = v_room.tier;
  
  IF v_reward_config IS NULL THEN
    -- Use defaults if no config
    v_reward_config := ROW('ICON', 1.0, 40, 0, 0)::room_reward_config;
  END IF;

  -- Get total entries
  SELECT COUNT(*) INTO v_total_entries FROM room_entries WHERE room_id = p_room_id AND status = 'STAKED';
  
  IF v_total_entries = 0 THEN
    -- No entries, just close the room
    UPDATE rooms SET status = 'SETTLED' WHERE id = p_room_id;
    RETURN jsonb_build_object('success', true, 'message', 'Room settled with no entries', 'winner', null);
  END IF;

  -- Rank all entries and calculate rewards
  FOR v_entry IN 
    SELECT re.* 
    FROM room_entries re 
    WHERE re.room_id = p_room_id AND re.status = 'STAKED'
    ORDER BY re.priority_score DESC, re.staked_at ASC
  LOOP
    v_current_rank := v_current_rank + 1;
    
    -- Calculate percentile (1 = top, 100 = bottom)
    v_percentile := (v_current_rank::numeric / v_total_entries) * 100;
    
    -- Determine percentile band
    v_percentile_band := CASE
      WHEN v_percentile <= 10 THEN 'S'
      WHEN v_percentile <= 30 THEN 'A'
      WHEN v_percentile <= 60 THEN 'B'
      ELSE 'C'
    END;
    
    -- Determine placement bonus credits
    v_placement_bonus := CASE v_percentile_band
      WHEN 'S' THEN 120
      WHEN 'A' THEN 70
      WHEN 'B' THEN 35
      ELSE 0
    END;
    
    -- Determine pack bonus
    v_pack_bonus := CASE v_percentile_band
      WHEN 'S' THEN 1
      WHEN 'A' THEN 1
      ELSE 0
    END;
    
    -- Calculate total credits: (base + placement_bonus) * tier_multiplier
    v_credits_awarded := FLOOR((v_reward_config.base_participation_credits + v_placement_bonus) * v_reward_config.multiplier);
    
    -- Calculate packs: min(base_packs + bonus_packs, cap)
    v_packs_awarded := LEAST(v_reward_config.base_packs + v_pack_bonus, v_reward_config.packs_cap);
    
    -- Update entry with rank, band, and rewards
    UPDATE room_entries 
    SET rank = v_current_rank,
        percentile_band = v_percentile_band,
        credits_awarded = v_credits_awarded,
        packs_awarded = v_packs_awarded,
        status = CASE WHEN v_current_rank = 1 THEN 'WON' ELSE 'LOST' END
    WHERE id = v_entry.id;
    
    -- Insert room reward record
    INSERT INTO room_rewards (room_id, user_id, entry_id, percentile_band, final_rank, credits_awarded, packs_awarded)
    VALUES (p_room_id, v_entry.user_id, v_entry.id, v_percentile_band, v_current_rank, v_credits_awarded, v_packs_awarded);
    
    -- Credit universal credits to user
    INSERT INTO user_universal_credits (user_id, credits)
    VALUES (v_entry.user_id, v_credits_awarded)
    ON CONFLICT (user_id)
    DO UPDATE SET credits = user_universal_credits.credits + v_credits_awarded, updated_at = now();
    
    -- Create reward pack grants
    FOR i IN 1..v_packs_awarded LOOP
      INSERT INTO reward_pack_grants (user_id, source_type, source_id)
      SELECT v_entry.user_id, 'room_reward', rr.id
      FROM room_rewards rr 
      WHERE rr.room_id = p_room_id AND rr.user_id = v_entry.user_id;
    END LOOP;
    
    -- Update card state based on outcome
    IF v_current_rank = 1 THEN
      -- Winner gets the card back as 'won'
      UPDATE reveals SET card_state = 'won' WHERE id = v_entry.reveal_id;
    ELSE
      -- Losers get their cards back as 'owned'
      UPDATE reveals SET card_state = 'owned', staked_at = NULL, staked_room_id = NULL WHERE id = v_entry.reveal_id;
    END IF;
    
    -- Track winner
    IF v_current_rank = 1 THEN
      v_winner_entry := v_entry;
    END IF;
    
    -- Add to results
    v_results := v_results || jsonb_build_object(
      'user_id', v_entry.user_id,
      'rank', v_current_rank,
      'percentile_band', v_percentile_band,
      'credits_awarded', v_credits_awarded,
      'packs_awarded', v_packs_awarded
    );
  END LOOP;

  -- Update room as settled
  UPDATE rooms 
  SET status = 'SETTLED',
      winner_entry_id = v_winner_entry.id,
      winner_user_id = v_winner_entry.user_id
  WHERE id = p_room_id;

  RETURN jsonb_build_object(
    'success', true,
    'room_id', p_room_id,
    'total_entries', v_total_entries,
    'winner', jsonb_build_object(
      'user_id', v_winner_entry.user_id,
      'entry_id', v_winner_entry.id,
      'priority_score', v_winner_entry.priority_score
    ),
    'results', v_results
  );
END;
$function$;

-- 2.6 Create claim_reward_pack RPC
CREATE OR REPLACE FUNCTION public.claim_reward_pack(p_pack_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_pack RECORD;
  v_band rarity_band;
  v_product RECORD;
  v_credits_grant integer := 150; -- Reward packs give 150 credits
  v_product_credits integer;
  v_universal_credits integer;
  v_reveal_id uuid;
  v_serial text;
  v_random numeric;
BEGIN
  -- Check authentication
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get pack with lock
  SELECT * INTO v_pack FROM reward_pack_grants WHERE id = p_pack_id AND user_id = v_user_id FOR UPDATE;
  
  IF v_pack IS NULL THEN
    RAISE EXCEPTION 'Reward pack not found or not owned';
  END IF;

  IF v_pack.status != 'PENDING' THEN
    RAISE EXCEPTION 'Reward pack already opened';
  END IF;

  -- Band selection for reward packs (weighted toward lower tiers - no golden, no awards)
  v_random := random();
  v_band := CASE
    WHEN v_random < 0.80 THEN 'ICON'::rarity_band
    WHEN v_random < 0.95 THEN 'RARE'::rarity_band
    WHEN v_random < 0.99 THEN 'GRAIL'::rarity_band
    ELSE 'MYTHIC'::rarity_band
  END;

  -- Select product from band
  SELECT * INTO v_product
  FROM product_classes pc
  WHERE pc.band = v_band AND pc.is_active = true
  ORDER BY random() LIMIT 1;

  -- Fallback to ICON if no product found
  IF v_product IS NULL THEN
    SELECT * INTO v_product FROM product_classes WHERE band = 'ICON' AND is_active = true ORDER BY random() LIMIT 1;
    v_band := 'ICON';
  END IF;

  IF v_product IS NULL THEN
    RAISE EXCEPTION 'No products available';
  END IF;

  -- Split credits (70% product, 30% universal)
  v_product_credits := FLOOR(v_credits_grant * 0.7);
  v_universal_credits := v_credits_grant - v_product_credits;

  -- Generate serial
  v_serial := LPAD((FLOOR(random() * 10000)::INT)::TEXT, 4, '0') || '/10000';

  -- Insert reveal (no award, no golden for reward packs)
  INSERT INTO reveals (
    purchase_id, user_id, product_class_id, band, is_golden,
    credits_awarded, product_credits_awarded, universal_credits_awarded,
    is_award, serial_number
  ) VALUES (
    NULL, v_user_id, v_product.id, v_band, false,
    v_credits_grant, v_product_credits, v_universal_credits,
    false, v_serial
  ) RETURNING id INTO v_reveal_id;

  -- Upsert credits
  INSERT INTO user_product_credits (user_id, product_class_id, credits)
  VALUES (v_user_id, v_product.id, v_product_credits)
  ON CONFLICT (user_id, product_class_id)
  DO UPDATE SET credits = user_product_credits.credits + v_product_credits, updated_at = now();

  INSERT INTO user_universal_credits (user_id, credits)
  VALUES (v_user_id, v_universal_credits)
  ON CONFLICT (user_id)
  DO UPDATE SET credits = user_universal_credits.credits + v_universal_credits, updated_at = now();

  -- Mark pack as opened
  UPDATE reward_pack_grants SET status = 'OPENED', opened_at = now() WHERE id = p_pack_id;

  RETURN jsonb_build_object(
    'success', true,
    'reveal', jsonb_build_object(
      'id', v_reveal_id,
      'product_class_id', v_product.id,
      'band', v_band,
      'is_golden', false,
      'is_award', false,
      'serial_number', v_serial,
      'credits_awarded', v_credits_grant,
      'product', jsonb_build_object(
        'id', v_product.id,
        'name', v_product.name,
        'brand', v_product.brand,
        'model', v_product.model,
        'category', v_product.category,
        'retail_value_usd', v_product.retail_value_usd,
        'image_url', v_product.image_url
      )
    )
  );
END;
$function$;