-- Fix rooms table RLS - make it permissive so anyone can view
DROP POLICY IF EXISTS "Anyone can view rooms" ON rooms;

CREATE POLICY "Anyone can view rooms"
ON rooms FOR SELECT
TO authenticated, anon
USING (true);

-- Fix room_entries RLS - make SELECT permissive
DROP POLICY IF EXISTS "Users can view room entries" ON room_entries;
DROP POLICY IF EXISTS "Users can view their own entries" ON room_entries;

CREATE POLICY "Anyone can view room entries"
ON room_entries FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Users can view their own entries"
ON room_entries FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Fix tier_escrow_pools RLS - make it permissive
DROP POLICY IF EXISTS "Anyone can view tier escrow pools" ON tier_escrow_pools;

CREATE POLICY "Anyone can view tier escrow pools"
ON tier_escrow_pools FOR SELECT
TO authenticated, anon
USING (true);

-- Ensure tier_escrow_pools has rows for our new tiers
INSERT INTO tier_escrow_pools (tier, tier_cap_cents, balance_cents)
VALUES 
  ('ICON', 100000, 0),
  ('RARE', 800000, 0),
  ('GRAIL', 5000000, 0),
  ('MYTHIC', 10000000, 0)
ON CONFLICT (tier) DO NOTHING;