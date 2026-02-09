
-- Migrate existing room entries to have associated reveal/cards
-- This creates staked cards for entries that were created before the buy_room_entry update

DO $$
DECLARE
  v_entry RECORD;
  v_reveal_id uuid;
  v_serial text;
  v_product product_classes%ROWTYPE;
  v_room rooms%ROWTYPE;
BEGIN
  -- Loop through all room entries without a reveal
  FOR v_entry IN 
    SELECT re.*, r.tier as room_tier, r.product_class_id
    FROM room_entries re
    JOIN rooms r ON re.room_id = r.id
    WHERE re.reveal_id IS NULL
  LOOP
    -- Get product details
    SELECT * INTO v_product FROM product_classes WHERE id = v_entry.product_class_id;
    SELECT * INTO v_room FROM rooms WHERE id = v_entry.room_id;
    
    IF v_product IS NOT NULL THEN
      -- Generate unique serial number
      v_serial := 'RM-' || substr(md5(random()::text || clock_timestamp()::text || v_entry.id::text), 1, 8);
      
      -- Create the reveal/card with staked state
      INSERT INTO reveals (
        user_id,
        product_class_id,
        band,
        serial_number,
        card_state,
        staked_room_id,
        staked_at,
        revealed_at,
        is_golden,
        is_award,
        credits_awarded,
        product_credits_awarded,
        universal_credits_awarded,
        redeem_credits_cents,
        priority_points,
        card_data
      ) VALUES (
        v_entry.user_id,
        v_entry.product_class_id,
        v_product.band,
        v_serial,
        'staked',
        v_entry.room_id,
        v_entry.staked_at,
        v_entry.staked_at,
        false,
        false,
        0,
        0,
        0,
        0,
        0,
        jsonb_build_object(
          'source', 'room_entry_migration',
          'room_tier', v_entry.room_tier,
          'entry_amount_cents', v_entry.amount_spent_cents,
          'migrated_at', now()
        )
      ) RETURNING id INTO v_reveal_id;
      
      -- Link the reveal to the room entry
      UPDATE room_entries 
      SET reveal_id = v_reveal_id,
          stake_snapshot = jsonb_set(
            COALESCE(stake_snapshot, '{}'::jsonb),
            '{entry_type}',
            '"card_entry"'
          )
      WHERE id = v_entry.id;
      
      RAISE NOTICE 'Created reveal % for entry % (room: %, product: %)', 
        v_reveal_id, v_entry.id, v_entry.room_id, v_product.name;
    END IF;
  END LOOP;
END $$;

-- Verify the migration worked
SELECT 
  re.id as entry_id,
  re.reveal_id,
  re.tickets,
  r.tier,
  pc.name as product_name,
  rv.card_state,
  rv.serial_number
FROM room_entries re
JOIN rooms r ON re.room_id = r.id
JOIN product_classes pc ON r.product_class_id = pc.id
LEFT JOIN reveals rv ON re.reveal_id = rv.id
WHERE re.user_id = '3121af0a-5228-4c24-87ab-d652c28db72f';
