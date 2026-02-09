-- Phase 1: Rooms Feature Database Schema

-- 1.1 Extend reveals table with Product Card mechanics
ALTER TABLE reveals ADD COLUMN IF NOT EXISTS redeem_credits_cents bigint NOT NULL DEFAULT 0;
ALTER TABLE reveals ADD COLUMN IF NOT EXISTS priority_points int NOT NULL DEFAULT 0;
ALTER TABLE reveals ADD COLUMN IF NOT EXISTS staked_room_id uuid NULL;
ALTER TABLE reveals ADD COLUMN IF NOT EXISTS staked_at timestamptz NULL;
ALTER TABLE reveals ADD COLUMN IF NOT EXISTS redeemed_at timestamptz NULL;
ALTER TABLE reveals ADD COLUMN IF NOT EXISTS card_state text NOT NULL DEFAULT 'owned';
-- card_state values: 'owned' | 'staked' | 'won' | 'redeemed'

-- 1.2 Create rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier text NOT NULL,  -- 'SILVER' | 'GOLD' | 'PLATINUM'
  tier_cap_cents bigint NOT NULL,  -- e.g., 500000 = $5,000
  category text NULL,  -- optional category filter (WATCHES, HANDBAGS, etc.)
  status text NOT NULL DEFAULT 'OPEN',  -- OPEN | LOCKED | FUNDED | CLOSED | SETTLED
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  min_participants int NOT NULL DEFAULT 10,
  max_participants int NOT NULL DEFAULT 100,
  escrow_target_cents bigint NOT NULL,  -- tier_cap + 8% buffer
  escrow_balance_cents bigint NOT NULL DEFAULT 0,
  winner_entry_id uuid NULL,
  winner_user_id uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 1.3 Create room_entries table
CREATE TABLE IF NOT EXISTS room_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  reveal_id uuid NOT NULL REFERENCES reveals(id),
  stake_snapshot jsonb NOT NULL,  -- {rc_cents, pp, rs, product_value_cents}
  priority_score numeric NULL,
  rank int NULL,
  status text NOT NULL DEFAULT 'STAKED',  -- STAKED | LOST | WON
  staked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(room_id, reveal_id)  -- A card can only be staked once per room
);

-- 1.4 Create tier_escrow_pools table
CREATE TABLE IF NOT EXISTS tier_escrow_pools (
  tier text PRIMARY KEY,
  tier_cap_cents bigint NOT NULL,
  balance_cents bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed initial tiers
INSERT INTO tier_escrow_pools (tier, tier_cap_cents) VALUES
  ('SILVER', 100000),    -- $1,000
  ('GOLD', 500000),      -- $5,000
  ('PLATINUM', 1500000)  -- $15,000
ON CONFLICT (tier) DO NOTHING;

-- 1.5 Create escrow_ledger table (audit trail)
CREATE TABLE IF NOT EXISTS escrow_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL,  -- 'tier_pool' | 'room_escrow'
  tier text NULL,
  room_id uuid NULL REFERENCES rooms(id),
  delta_cents bigint NOT NULL,
  reason text NOT NULL,  -- pack_allocation, room_funding, redemption_purchase
  ref_id text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE tier_escrow_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_ledger ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rooms (public read, admin write)
CREATE POLICY "Anyone can view rooms"
  ON rooms FOR SELECT
  USING (true);

-- RLS Policies for room_entries
CREATE POLICY "Users can view room entries"
  ON room_entries FOR SELECT
  USING (true);

CREATE POLICY "Users can view their own entries"
  ON room_entries FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policies for tier_escrow_pools (public read)
CREATE POLICY "Anyone can view tier escrow pools"
  ON tier_escrow_pools FOR SELECT
  USING (true);

-- RLS Policies for escrow_ledger (admin only)
CREATE POLICY "Only admins can view escrow ledger"
  ON escrow_ledger FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add foreign key constraint for reveals.staked_room_id
ALTER TABLE reveals ADD CONSTRAINT reveals_staked_room_id_fkey 
  FOREIGN KEY (staked_room_id) REFERENCES rooms(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);
CREATE INDEX IF NOT EXISTS idx_rooms_tier ON rooms(tier);
CREATE INDEX IF NOT EXISTS idx_rooms_end_at ON rooms(end_at);
CREATE INDEX IF NOT EXISTS idx_room_entries_room_id ON room_entries(room_id);
CREATE INDEX IF NOT EXISTS idx_room_entries_user_id ON room_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_room_entries_reveal_id ON room_entries(reveal_id);
CREATE INDEX IF NOT EXISTS idx_reveals_card_state ON reveals(card_state);
CREATE INDEX IF NOT EXISTS idx_reveals_staked_room_id ON reveals(staked_room_id);