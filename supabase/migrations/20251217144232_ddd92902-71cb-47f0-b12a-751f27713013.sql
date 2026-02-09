-- Drop old battle function that conflicts
DROP FUNCTION IF EXISTS public.cancel_queued_battle(uuid);

-- Phase 2: Rooms RPC Functions

-- 2.1 join_room: Stake a card into a room
CREATE OR REPLACE FUNCTION public.join_room(p_room_id uuid, p_reveal_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_reveal RECORD;
  v_room RECORD;
  v_product RECORD;
  v_entry_count INT;
  v_entry_id UUID;
  v_stake_snapshot JSONB;
BEGIN
  -- Get room with lock
  SELECT * INTO v_room
  FROM rooms
  WHERE id = p_room_id
  FOR UPDATE;

  IF v_room IS NULL THEN
    RAISE EXCEPTION 'Room not found';
  END IF;

  IF v_room.status != 'OPEN' THEN
    RAISE EXCEPTION 'Room is not open for entries (status: %)', v_room.status;
  END IF;

  -- Check capacity
  SELECT COUNT(*) INTO v_entry_count
  FROM room_entries
  WHERE room_id = p_room_id;

  IF v_entry_count >= v_room.max_participants THEN
    RAISE EXCEPTION 'Room is at maximum capacity';
  END IF;

  -- Get reveal with lock
  SELECT * INTO v_reveal
  FROM reveals
  WHERE id = p_reveal_id
  FOR UPDATE;

  IF v_reveal IS NULL THEN
    RAISE EXCEPTION 'Card not found';
  END IF;

  IF v_reveal.user_id != v_user_id THEN
    RAISE EXCEPTION 'You do not own this card';
  END IF;

  IF v_reveal.card_state != 'owned' THEN
    RAISE EXCEPTION 'Card is not available for staking (state: %)', v_reveal.card_state;
  END IF;

  IF v_reveal.revealed_at IS NULL THEN
    RAISE EXCEPTION 'Card must be revealed before staking';
  END IF;

  -- Get product to check value
  SELECT * INTO v_product
  FROM product_classes
  WHERE id = v_reveal.product_class_id;

  IF v_product IS NULL THEN
    RAISE EXCEPTION 'Product not found for this card';
  END IF;

  -- Convert product value to cents for comparison
  IF (v_product.retail_value_usd * 100) > v_room.tier_cap_cents THEN
    RAISE EXCEPTION 'Card value ($%) exceeds room tier cap ($%)', 
      v_product.retail_value_usd, 
      v_room.tier_cap_cents / 100;
  END IF;

  -- Check category filter if room has one
  IF v_room.category IS NOT NULL AND v_room.category != v_product.category::text THEN
    RAISE EXCEPTION 'Card category (%) does not match room category (%)', 
      v_product.category, 
      v_room.category;
  END IF;

  -- Build stake snapshot
  v_stake_snapshot := jsonb_build_object(
    'rc_cents', v_reveal.redeem_credits_cents,
    'pp', v_reveal.priority_points,
    'rs', CASE v_reveal.band
      WHEN 'ICON' THEN 40
      WHEN 'RARE' THEN 60
      WHEN 'GRAIL' THEN 80
      WHEN 'MYTHIC' THEN 100
      ELSE 40
    END,
    'product_value_cents', (v_product.retail_value_usd * 100)::bigint,
    'product_name', v_product.name,
    'band', v_reveal.band
  );

  -- Update reveal state
  UPDATE reveals
  SET card_state = 'staked',
      staked_room_id = p_room_id,
      staked_at = now()
  WHERE id = p_reveal_id;

  -- Insert room entry
  INSERT INTO room_entries (room_id, user_id, reveal_id, stake_snapshot)
  VALUES (p_room_id, v_user_id, p_reveal_id, v_stake_snapshot)
  RETURNING id INTO v_entry_id;

  -- Return updated room and entry info
  RETURN jsonb_build_object(
    'success', true,
    'entry_id', v_entry_id,
    'room', jsonb_build_object(
      'id', v_room.id,
      'tier', v_room.tier,
      'status', v_room.status,
      'participants', v_entry_count + 1,
      'max_participants', v_room.max_participants,
      'escrow_balance_cents', v_room.escrow_balance_cents,
      'escrow_target_cents', v_room.escrow_target_cents
    ),
    'stake_snapshot', v_stake_snapshot
  );
END;
$$;

-- 2.2 leave_room: Unstake a card from a room (before lock time)
CREATE OR REPLACE FUNCTION public.leave_room(p_room_id uuid, p_reveal_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_reveal RECORD;
  v_room RECORD;
  v_entry RECORD;
  v_lock_threshold TIMESTAMPTZ;
BEGIN
  -- Get room
  SELECT * INTO v_room
  FROM rooms
  WHERE id = p_room_id;

  IF v_room IS NULL THEN
    RAISE EXCEPTION 'Room not found';
  END IF;

  IF v_room.status NOT IN ('OPEN', 'LOCKED') THEN
    RAISE EXCEPTION 'Cannot leave room in status: %', v_room.status;
  END IF;

  -- Calculate lock threshold (50% of room duration)
  v_lock_threshold := v_room.start_at + ((v_room.end_at - v_room.start_at) / 2);

  IF now() > v_lock_threshold THEN
    RAISE EXCEPTION 'Cannot leave room after lock time (past 50%% of room duration)';
  END IF;

  -- Get entry
  SELECT * INTO v_entry
  FROM room_entries
  WHERE room_id = p_room_id AND reveal_id = p_reveal_id;

  IF v_entry IS NULL THEN
    RAISE EXCEPTION 'Entry not found';
  END IF;

  IF v_entry.user_id != v_user_id THEN
    RAISE EXCEPTION 'You do not own this entry';
  END IF;

  -- Get reveal with lock
  SELECT * INTO v_reveal
  FROM reveals
  WHERE id = p_reveal_id
  FOR UPDATE;

  IF v_reveal IS NULL OR v_reveal.staked_room_id != p_room_id THEN
    RAISE EXCEPTION 'Card is not staked in this room';
  END IF;

  -- Restore reveal state
  UPDATE reveals
  SET card_state = 'owned',
      staked_room_id = NULL,
      staked_at = NULL
  WHERE id = p_reveal_id;

  -- Delete entry
  DELETE FROM room_entries
  WHERE room_id = p_room_id AND reveal_id = p_reveal_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Successfully left room',
    'reveal_id', p_reveal_id
  );
END;
$$;

-- 2.3 settle_room: Compute winners and finalize room (called by cron)
CREATE OR REPLACE FUNCTION public.settle_room(p_room_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_room RECORD;
  v_entry RECORD;
  v_winner_entry RECORD;
  v_max_pp INT := 1;
  v_max_rs INT := 1;
  v_rc_pct NUMERIC;
  v_pp_norm NUMERIC;
  v_rs_norm NUMERIC;
  v_priority_score NUMERIC;
  v_is_funded BOOLEAN;
  v_entries_updated INT := 0;
BEGIN
  -- Get room with lock
  SELECT * INTO v_room
  FROM rooms
  WHERE id = p_room_id
  FOR UPDATE;

  IF v_room IS NULL THEN
    RAISE EXCEPTION 'Room not found';
  END IF;

  IF v_room.status = 'SETTLED' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Room already settled');
  END IF;

  IF v_room.status NOT IN ('OPEN', 'LOCKED', 'FUNDED', 'CLOSED') THEN
    RAISE EXCEPTION 'Room cannot be settled in status: %', v_room.status;
  END IF;

  -- Check if room time has ended
  IF now() < v_room.end_at THEN
    RAISE EXCEPTION 'Room has not ended yet';
  END IF;

  -- Get max PP and RS for normalization
  SELECT 
    GREATEST(MAX((stake_snapshot->>'pp')::INT), 1),
    GREATEST(MAX((stake_snapshot->>'rs')::INT), 1)
  INTO v_max_pp, v_max_rs
  FROM room_entries
  WHERE room_id = p_room_id;

  -- Compute priority scores for all entries
  FOR v_entry IN 
    SELECT * FROM room_entries 
    WHERE room_id = p_room_id
    FOR UPDATE
  LOOP
    -- RC% = min(100, rc_cents / product_value_cents * 100)
    v_rc_pct := LEAST(100, 
      ((v_entry.stake_snapshot->>'rc_cents')::NUMERIC / 
       GREATEST((v_entry.stake_snapshot->>'product_value_cents')::NUMERIC, 1)) * 100
    );
    
    -- PP_norm = PP / maxPP * 100
    v_pp_norm := ((v_entry.stake_snapshot->>'pp')::NUMERIC / v_max_pp) * 100;
    
    -- RS_norm = RS / maxRS * 100
    v_rs_norm := ((v_entry.stake_snapshot->>'rs')::NUMERIC / v_max_rs) * 100;
    
    -- Score = 0.55 * RC_pct + 0.35 * PP_norm + 0.10 * RS_norm
    v_priority_score := (0.55 * v_rc_pct) + (0.35 * v_pp_norm) + (0.10 * v_rs_norm);
    
    -- Update entry with score
    UPDATE room_entries
    SET priority_score = ROUND(v_priority_score, 4)
    WHERE id = v_entry.id;
    
    v_entries_updated := v_entries_updated + 1;
  END LOOP;

  -- Assign ranks (higher score = lower rank number = better)
  WITH ranked AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY priority_score DESC, staked_at ASC) as rank_num
    FROM room_entries
    WHERE room_id = p_room_id
  )
  UPDATE room_entries re
  SET rank = ranked.rank_num
  FROM ranked
  WHERE re.id = ranked.id;

  -- Check if funded
  v_is_funded := v_room.escrow_balance_cents >= v_room.escrow_target_cents;

  -- Get winner (rank 1)
  SELECT * INTO v_winner_entry
  FROM room_entries
  WHERE room_id = p_room_id AND rank = 1;

  IF v_winner_entry IS NOT NULL THEN
    -- Mark winner
    UPDATE room_entries
    SET status = 'WON'
    WHERE id = v_winner_entry.id;

    -- Update winner's reveal state
    UPDATE reveals
    SET card_state = CASE WHEN v_is_funded THEN 'won' ELSE 'owned' END
    WHERE id = v_winner_entry.reveal_id;

    -- Update room with winner
    UPDATE rooms
    SET winner_entry_id = v_winner_entry.id,
        winner_user_id = v_winner_entry.user_id,
        status = 'SETTLED'
    WHERE id = p_room_id;

    -- Mark losers and apply PP decay
    UPDATE room_entries
    SET status = 'LOST'
    WHERE room_id = p_room_id AND id != v_winner_entry.id;

    -- Apply 20% PP decay to losers' cards
    UPDATE reveals r
    SET priority_points = FLOOR(priority_points * 0.80),
        card_state = 'owned',
        staked_room_id = NULL,
        staked_at = NULL
    FROM room_entries re
    WHERE re.reveal_id = r.id
      AND re.room_id = p_room_id
      AND re.id != v_winner_entry.id;
  ELSE
    -- No entries, just close the room
    UPDATE rooms
    SET status = 'SETTLED'
    WHERE id = p_room_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'room_id', p_room_id,
    'is_funded', v_is_funded,
    'entries_processed', v_entries_updated,
    'winner_entry_id', v_winner_entry.id,
    'winner_user_id', v_winner_entry.user_id,
    'winner_score', v_winner_entry.priority_score
  );
END;
$$;

-- 2.4 claim_redemption: Winner claims their prize
CREATE OR REPLACE FUNCTION public.claim_redemption(p_room_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_room RECORD;
  v_entry RECORD;
  v_reveal RECORD;
  v_product RECORD;
  v_product_value_cents BIGINT;
  v_pay_cents BIGINT;
  v_award_id UUID;
BEGIN
  -- Get room
  SELECT * INTO v_room
  FROM rooms
  WHERE id = p_room_id;

  IF v_room IS NULL THEN
    RAISE EXCEPTION 'Room not found';
  END IF;

  IF v_room.status != 'SETTLED' THEN
    RAISE EXCEPTION 'Room is not settled yet';
  END IF;

  IF v_room.winner_user_id != v_user_id THEN
    RAISE EXCEPTION 'You are not the winner of this room';
  END IF;

  -- Get winner entry
  SELECT * INTO v_entry
  FROM room_entries
  WHERE id = v_room.winner_entry_id;

  IF v_entry IS NULL OR v_entry.status != 'WON' THEN
    RAISE EXCEPTION 'Winner entry not found';
  END IF;

  -- Get reveal
  SELECT * INTO v_reveal
  FROM reveals
  WHERE id = v_entry.reveal_id
  FOR UPDATE;

  IF v_reveal IS NULL THEN
    RAISE EXCEPTION 'Card not found';
  END IF;

  IF v_reveal.redeemed_at IS NOT NULL THEN
    RAISE EXCEPTION 'Already redeemed';
  END IF;

  -- Get product
  SELECT * INTO v_product
  FROM product_classes
  WHERE id = v_reveal.product_class_id;

  v_product_value_cents := (v_product.retail_value_usd * 100)::BIGINT;

  -- Calculate payment needed
  v_pay_cents := GREATEST(0, v_product_value_cents - v_reveal.redeem_credits_cents);

  IF v_pay_cents > 0 THEN
    -- Return Stripe checkout info (actual Stripe session created by edge function)
    RETURN jsonb_build_object(
      'success', true,
      'requires_payment', true,
      'pay_cents', v_pay_cents,
      'product_value_cents', v_product_value_cents,
      'redeem_credits_cents', v_reveal.redeem_credits_cents,
      'product', jsonb_build_object(
        'id', v_product.id,
        'name', v_product.name,
        'brand', v_product.brand,
        'model', v_product.model,
        'image_url', v_product.image_url
      ),
      'room_id', p_room_id,
      'reveal_id', v_reveal.id
    );
  END IF;

  -- Free redemption: create award immediately
  INSERT INTO awards (user_id, product_class_id, bucket, reserved_cost_usd, status, reveal_id)
  VALUES (
    v_user_id, 
    v_reveal.product_class_id, 
    'room_redemption', 
    v_product.expected_fulfillment_cost_usd,
    'RESERVED',
    v_reveal.id
  )
  RETURNING id INTO v_award_id;

  -- Mark reveal as redeemed
  UPDATE reveals
  SET redeemed_at = now(),
      card_state = 'redeemed',
      is_award = true,
      award_id = v_award_id
  WHERE id = v_reveal.id;

  -- Deduct from room escrow
  UPDATE rooms
  SET escrow_balance_cents = escrow_balance_cents - (v_product.expected_fulfillment_cost_usd * 100)::BIGINT
  WHERE id = p_room_id;

  -- Log to escrow ledger
  INSERT INTO escrow_ledger (scope, room_id, delta_cents, reason, ref_id)
  VALUES ('room_escrow', p_room_id, -(v_product.expected_fulfillment_cost_usd * 100)::BIGINT, 'redemption_purchase', v_award_id::TEXT);

  RETURN jsonb_build_object(
    'success', true,
    'requires_payment', false,
    'redeemed', true,
    'award_id', v_award_id,
    'product', jsonb_build_object(
      'id', v_product.id,
      'name', v_product.name,
      'brand', v_product.brand,
      'model', v_product.model,
      'image_url', v_product.image_url
    )
  );
END;
$$;

-- 2.5 Helper: get_room_leaderboard
CREATE OR REPLACE FUNCTION public.get_room_leaderboard(p_room_id uuid, p_limit int DEFAULT 50)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_room RECORD;
  v_leaderboard JSONB;
BEGIN
  SELECT * INTO v_room FROM rooms WHERE id = p_room_id;
  
  IF v_room IS NULL THEN
    RAISE EXCEPTION 'Room not found';
  END IF;

  SELECT jsonb_agg(entry_data ORDER BY rank_num ASC) INTO v_leaderboard
  FROM (
    SELECT 
      jsonb_build_object(
        'rank', COALESCE(re.rank, ROW_NUMBER() OVER (ORDER BY re.priority_score DESC NULLS LAST, re.staked_at ASC)),
        'entry_id', re.id,
        'user_id', re.user_id,
        'reveal_id', re.reveal_id,
        'priority_score', COALESCE(re.priority_score, 0),
        'status', re.status,
        'stake_snapshot', re.stake_snapshot,
        'username', cp.username,
        'display_name', cp.display_name,
        'avatar_url', cp.avatar_url
      ) as entry_data,
      COALESCE(re.rank, ROW_NUMBER() OVER (ORDER BY re.priority_score DESC NULLS LAST, re.staked_at ASC)) as rank_num
    FROM room_entries re
    LEFT JOIN collector_profiles cp ON cp.user_id = re.user_id
    WHERE re.room_id = p_room_id
    LIMIT p_limit
  ) sub;

  RETURN jsonb_build_object(
    'room', jsonb_build_object(
      'id', v_room.id,
      'tier', v_room.tier,
      'status', v_room.status,
      'category', v_room.category,
      'start_at', v_room.start_at,
      'end_at', v_room.end_at,
      'escrow_balance_cents', v_room.escrow_balance_cents,
      'escrow_target_cents', v_room.escrow_target_cents,
      'winner_user_id', v_room.winner_user_id
    ),
    'leaderboard', COALESCE(v_leaderboard, '[]'::jsonb)
  );
END;
$$;

-- 2.6 Helper: get_my_eligible_cards (cards user can stake in a room)
CREATE OR REPLACE FUNCTION public.get_my_eligible_cards(p_room_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_room RECORD;
  v_cards JSONB;
BEGIN
  SELECT * INTO v_room FROM rooms WHERE id = p_room_id;
  
  IF v_room IS NULL THEN
    RAISE EXCEPTION 'Room not found';
  END IF;

  SELECT jsonb_agg(card_data) INTO v_cards
  FROM (
    SELECT jsonb_build_object(
      'reveal_id', r.id,
      'product_class_id', r.product_class_id,
      'band', r.band,
      'serial_number', r.serial_number,
      'redeem_credits_cents', r.redeem_credits_cents,
      'priority_points', r.priority_points,
      'card_state', r.card_state,
      'product', jsonb_build_object(
        'id', pc.id,
        'name', pc.name,
        'brand', pc.brand,
        'model', pc.model,
        'category', pc.category,
        'retail_value_usd', pc.retail_value_usd,
        'image_url', pc.image_url
      ),
      'preview_score', ROUND(
        (0.55 * LEAST(100, (r.redeem_credits_cents::NUMERIC / GREATEST(pc.retail_value_usd * 100, 1)) * 100)) +
        (0.35 * (r.priority_points::NUMERIC / GREATEST(100, 1)) * 100) +
        (0.10 * CASE r.band WHEN 'ICON' THEN 40 WHEN 'RARE' THEN 60 WHEN 'GRAIL' THEN 80 WHEN 'MYTHIC' THEN 100 ELSE 40 END)
      , 2)
    ) as card_data
    FROM reveals r
    JOIN product_classes pc ON pc.id = r.product_class_id
    WHERE r.user_id = v_user_id
      AND r.card_state = 'owned'
      AND r.revealed_at IS NOT NULL
      AND (pc.retail_value_usd * 100) <= v_room.tier_cap_cents
      AND (v_room.category IS NULL OR pc.category::text = v_room.category)
    ORDER BY pc.retail_value_usd DESC
  ) sub;

  RETURN jsonb_build_object(
    'room_id', p_room_id,
    'tier', v_room.tier,
    'tier_cap_cents', v_room.tier_cap_cents,
    'category', v_room.category,
    'cards', COALESCE(v_cards, '[]'::jsonb)
  );
END;
$$;

-- 2.7 Helper: get_active_rooms
CREATE OR REPLACE FUNCTION public.get_active_rooms(p_tier text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_rooms JSONB;
BEGIN
  SELECT jsonb_agg(room_data ORDER BY end_at ASC) INTO v_rooms
  FROM (
    SELECT jsonb_build_object(
      'id', r.id,
      'tier', r.tier,
      'tier_cap_cents', r.tier_cap_cents,
      'category', r.category,
      'status', r.status,
      'start_at', r.start_at,
      'end_at', r.end_at,
      'min_participants', r.min_participants,
      'max_participants', r.max_participants,
      'escrow_target_cents', r.escrow_target_cents,
      'escrow_balance_cents', r.escrow_balance_cents,
      'participant_count', (SELECT COUNT(*) FROM room_entries WHERE room_id = r.id),
      'is_funded', r.escrow_balance_cents >= r.escrow_target_cents
    ) as room_data
    FROM rooms r
    WHERE r.status IN ('OPEN', 'LOCKED', 'FUNDED')
      AND (p_tier IS NULL OR r.tier = p_tier)
    ORDER BY r.end_at ASC
  ) sub;

  RETURN jsonb_build_object(
    'rooms', COALESCE(v_rooms, '[]'::jsonb)
  );
END;
$$;