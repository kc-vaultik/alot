
-- Direct migration: Create reveals for Rolex and Chanel entries

-- 1. Create reveal for Rolex Submariner entry (75 tickets, $7500)
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
  '3121af0a-5228-4c24-87ab-d652c28db72f',  -- user_id
  '4b0661e9-1c15-4210-8469-e413596a7493',  -- Rolex product_class_id
  'RARE',
  'RM-ROLEX001',
  'staked',
  '55f0805e-7d1f-4b37-8b6e-8ec056e6ec1e',  -- Rolex room_id
  now(),
  now(),
  false,
  false,
  0, 0, 0, 0, 0,
  '{"source": "room_entry_migration", "room_tier": "RARE", "entry_amount_cents": 7500}'::jsonb
);

-- 2. Create reveal for Chanel Classic Flap entry (50 tickets, $5000)
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
  '3121af0a-5228-4c24-87ab-d652c28db72f',  -- user_id
  'a6cd7b9e-7432-4854-9235-ef6c52f4017d',  -- Chanel product_class_id
  'GRAIL',
  'RM-CHANEL01',
  'staked',
  '46c005ce-b851-48ed-b2b9-594edb06a9c5',  -- Chanel room_id
  now(),
  now(),
  false,
  false,
  0, 0, 0, 0, 0,
  '{"source": "room_entry_migration", "room_tier": "GRAIL", "entry_amount_cents": 5000}'::jsonb
);

-- 3. Link the reveals to the room entries
UPDATE room_entries 
SET reveal_id = (
  SELECT id FROM reveals 
  WHERE serial_number = 'RM-ROLEX001' 
  LIMIT 1
)
WHERE id = 'a8426910-cfbc-46e9-a74b-a092b829d8dc';

UPDATE room_entries 
SET reveal_id = (
  SELECT id FROM reveals 
  WHERE serial_number = 'RM-CHANEL01' 
  LIMIT 1
)
WHERE id = '62bffc13-12ce-42c8-b905-8fa6f3abff03';
