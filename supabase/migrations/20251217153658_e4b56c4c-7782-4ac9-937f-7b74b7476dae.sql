-- Phase 1: Sealed Rooms & Rewards Schema Updates

-- 1.1 Add columns to rooms table
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS lock_at timestamptz;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS leaderboard_visibility text DEFAULT 'after_close';
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS reward_budget_cents bigint DEFAULT 0;

-- 1.2 Add columns to room_entries table
ALTER TABLE room_entries ADD COLUMN IF NOT EXISTS percentile_band text;
ALTER TABLE room_entries ADD COLUMN IF NOT EXISTS credits_awarded integer DEFAULT 0;
ALTER TABLE room_entries ADD COLUMN IF NOT EXISTS packs_awarded integer DEFAULT 0;
ALTER TABLE room_entries ADD COLUMN IF NOT EXISTS early_stake_bonus numeric DEFAULT 0;

-- 1.3 Create room_rewards table (immutable payouts)
CREATE TABLE IF NOT EXISTS room_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  entry_id uuid NOT NULL REFERENCES room_entries(id) ON DELETE CASCADE,
  percentile_band text NOT NULL,
  final_rank integer NOT NULL,
  credits_awarded integer NOT NULL DEFAULT 0,
  packs_awarded integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- Enable RLS on room_rewards
ALTER TABLE room_rewards ENABLE ROW LEVEL SECURITY;

-- Users can view their own rewards
CREATE POLICY "Users can view their own room rewards"
  ON room_rewards FOR SELECT
  USING (auth.uid() = user_id);

-- 1.4 Create reward_pack_grants table
CREATE TABLE IF NOT EXISTS reward_pack_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source_type text NOT NULL DEFAULT 'room_reward',
  source_id uuid,
  status text NOT NULL DEFAULT 'PENDING',
  opened_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on reward_pack_grants
ALTER TABLE reward_pack_grants ENABLE ROW LEVEL SECURITY;

-- Users can view their own reward packs
CREATE POLICY "Users can view their own reward packs"
  ON reward_pack_grants FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own reward packs (to mark as opened)
CREATE POLICY "Users can update their own reward packs"
  ON reward_pack_grants FOR UPDATE
  USING (auth.uid() = user_id);

-- 1.5 Create reward configuration table
CREATE TABLE IF NOT EXISTS room_reward_config (
  tier text PRIMARY KEY,
  multiplier numeric NOT NULL,
  base_participation_credits integer NOT NULL,
  base_packs integer NOT NULL DEFAULT 0,
  packs_cap integer NOT NULL DEFAULT 0
);

-- Enable RLS on room_reward_config
ALTER TABLE room_reward_config ENABLE ROW LEVEL SECURITY;

-- Anyone can read reward config
CREATE POLICY "Anyone can read reward config"
  ON room_reward_config FOR SELECT
  USING (true);

-- Insert default reward configuration
INSERT INTO room_reward_config (tier, multiplier, base_participation_credits, base_packs, packs_cap) VALUES
  ('ICON', 1.0, 40, 0, 0),
  ('RARE', 1.5, 60, 0, 0),
  ('GRAIL', 2.2, 90, 1, 2),
  ('MYTHIC', 3.5, 140, 1, 2)
ON CONFLICT (tier) DO UPDATE SET
  multiplier = EXCLUDED.multiplier,
  base_participation_credits = EXCLUDED.base_participation_credits,
  base_packs = EXCLUDED.base_packs,
  packs_cap = EXCLUDED.packs_cap;

-- Update existing rooms with default lock_at (1 hour before end_at)
UPDATE rooms 
SET lock_at = end_at - INTERVAL '1 hour'
WHERE lock_at IS NULL AND end_at IS NOT NULL;