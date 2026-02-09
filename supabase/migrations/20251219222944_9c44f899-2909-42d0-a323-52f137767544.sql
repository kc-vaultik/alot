
-- Update settle_room to properly handle card state transitions
-- Winners: card_state = 'won', clear staked_room_id (can redeem immediately)
-- Losers: card_state = 'owned', clear staked_room_id, add credits to redeem_credits_cents

CREATE OR REPLACE FUNCTION public.settle_room(p_room_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_room RECORD;
  v_product RECORD;
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
  v_card_credits_cents bigint;
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

  -- Get product details for calculating loser credits
  SELECT * INTO v_product FROM product_classes WHERE id = v_room.product_class_id;

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
    
    -- ============================================================
    -- CARD STATE TRANSITIONS - The key logic for card unlocking
    -- ============================================================
    IF v_current_rank = 1 THEN
      -- WINNER: Card becomes 'won', can redeem the product immediately
      -- Set redeem_credits_cents to 100% of product value (fully redeemable)
      UPDATE reveals 
      SET 
        card_state = 'won',
        staked_room_id = NULL,
        staked_at = NULL,
        redeem_credits_cents = COALESCE(v_product.retail_value_usd, 0) * 100  -- 100% progress
      WHERE id = v_entry.reveal_id;
      
      v_winner_entry := v_entry;
    ELSE
      -- LOSER: Card becomes 'owned', gets credits toward redemption based on entry amount
      -- Calculate credits: entry amount spent goes toward product redemption
      -- This incentivizes playing more to accumulate credits
      v_card_credits_cents := v_entry.amount_spent_cents;
      
      UPDATE reveals 
      SET 
        card_state = 'owned',
        staked_room_id = NULL,
        staked_at = NULL,
        -- Add entry amount as credits toward this product's redemption
        redeem_credits_cents = COALESCE(redeem_credits_cents, 0) + v_card_credits_cents
      WHERE id = v_entry.reveal_id;
    END IF;
    
    -- Add to results
    v_results := v_results || jsonb_build_object(
      'user_id', v_entry.user_id,
      'rank', v_current_rank,
      'percentile_band', v_percentile_band,
      'credits_awarded', v_credits_awarded,
      'packs_awarded', v_packs_awarded,
      'card_credits_cents', CASE WHEN v_current_rank = 1 THEN COALESCE(v_product.retail_value_usd, 0) * 100 ELSE v_card_credits_cents END
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

-- Add comment for documentation
COMMENT ON FUNCTION public.settle_room IS 'Settles a room by determining winner, distributing rewards, and updating card states. Winners get 100% redemption credits. Losers get their entry amount added to card credits for future redemption.';
