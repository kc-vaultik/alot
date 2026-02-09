-- Seed Initial 4 Lottery Rooms

-- 1. Rolex Submariner Room (high-value: $12,000 retail × 2.5 = $30,000 funding target)
INSERT INTO public.rooms (
  product_class_id,
  tier,
  tier_cap_cents,
  funding_target_cents,
  escrow_target_cents,
  status,
  is_mystery,
  start_at,
  end_at,
  deadline_at,
  min_participants,
  max_participants,
  category,
  leaderboard_visibility
) VALUES (
  '4b0661e9-1c15-4210-8469-e413596a7493', -- Rolex Submariner
  'RARE',
  1200000, -- $12,000 tier cap
  3000000, -- $30,000 funding target (2.5x retail)
  3000000,
  'OPEN',
  false,
  NOW(),
  NOW() + INTERVAL '14 days',
  NOW() + INTERVAL '14 days',
  10,
  500,
  'WATCHES',
  'after_close'
);

-- 2. Chanel Classic Flap Room (high-value: $11,000 retail × 2.5 = $27,500 funding target)
INSERT INTO public.rooms (
  product_class_id,
  tier,
  tier_cap_cents,
  funding_target_cents,
  escrow_target_cents,
  status,
  is_mystery,
  start_at,
  end_at,
  deadline_at,
  min_participants,
  max_participants,
  category,
  leaderboard_visibility
) VALUES (
  'a6cd7b9e-7432-4854-9235-ef6c52f4017d', -- Chanel Classic Flap
  'GRAIL',
  1100000, -- $11,000 tier cap
  2750000, -- $27,500 funding target (2.5x retail)
  2750000,
  'OPEN',
  false,
  NOW(),
  NOW() + INTERVAL '14 days',
  NOW() + INTERVAL '14 days',
  10,
  500,
  'HANDBAGS',
  'after_close'
);

-- 3. Messi Jersey Room (low-value: $500 retail × 2.5 = $1,250 funding target)
INSERT INTO public.rooms (
  product_class_id,
  tier,
  tier_cap_cents,
  funding_target_cents,
  escrow_target_cents,
  status,
  is_mystery,
  start_at,
  end_at,
  deadline_at,
  min_participants,
  max_participants,
  category,
  leaderboard_visibility
) VALUES (
  'a876f489-574e-4d89-b2bd-b7e8868d3435', -- Messi Argentina World Cup Jersey
  'ICON',
  50000, -- $500 tier cap
  125000, -- $1,250 funding target (2.5x retail)
  125000,
  'OPEN',
  false,
  NOW(),
  NOW() + INTERVAL '7 days',
  NOW() + INTERVAL '7 days',
  5,
  200,
  'SPORT_MEMORABILIA',
  'after_close'
);

-- 4. Mystery Room (low-value, product hidden until funded)
-- Using Messi Jersey as the mystery product (will be revealed when funded)
INSERT INTO public.rooms (
  product_class_id,
  mystery_product_id,
  tier,
  tier_cap_cents,
  funding_target_cents,
  escrow_target_cents,
  status,
  is_mystery,
  start_at,
  end_at,
  deadline_at,
  min_participants,
  max_participants,
  category,
  leaderboard_visibility
) VALUES (
  NULL, -- Hidden until funded
  'a876f489-574e-4d89-b2bd-b7e8868d3435', -- Mystery product: Messi Jersey (hidden)
  'ICON',
  50000, -- $500 tier cap
  125000, -- $1,250 funding target (2.5x retail)
  125000,
  'OPEN',
  true, -- This is a mystery room
  NOW(),
  NOW() + INTERVAL '7 days',
  NOW() + INTERVAL '7 days',
  5,
  200,
  NULL, -- Category hidden for mystery
  'after_close'
);