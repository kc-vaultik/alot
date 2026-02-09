-- Fix awards RLS policy
DROP POLICY IF EXISTS "Users can read their own awards" ON awards;
CREATE POLICY "Users can read their own awards"
ON awards FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Fix battle_queue RLS policies
DROP POLICY IF EXISTS "Users can view own queue entry" ON battle_queue;
CREATE POLICY "Users can view own queue entry"
ON battle_queue FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own queue entry" ON battle_queue;
CREATE POLICY "Users can insert own queue entry"
ON battle_queue FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own queue entry" ON battle_queue;
CREATE POLICY "Users can delete own queue entry"
ON battle_queue FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Fix battle_rounds RLS policy
DROP POLICY IF EXISTS "Users can view own battle rounds" ON battle_rounds;
CREATE POLICY "Users can view own battle rounds"
ON battle_rounds FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM battles
  WHERE battles.id = battle_rounds.battle_id
  AND (auth.uid() = battles.user_a OR auth.uid() = battles.user_b)
));

-- Fix battles RLS policy
DROP POLICY IF EXISTS "Users can view own battles" ON battles;
CREATE POLICY "Users can view own battles"
ON battles FOR SELECT TO authenticated
USING (auth.uid() = user_a OR auth.uid() = user_b);

-- Fix battle_sets RLS policies
DROP POLICY IF EXISTS "Users can view own battle sets" ON battle_sets;
CREATE POLICY "Users can view own battle sets"
ON battle_sets FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own battle sets" ON battle_sets;
CREATE POLICY "Users can insert own battle sets"
ON battle_sets FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own battle sets" ON battle_sets;
CREATE POLICY "Users can update own battle sets"
ON battle_sets FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own battle sets" ON battle_sets;
CREATE POLICY "Users can delete own battle sets"
ON battle_sets FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Fix daily_free_pulls RLS policy
DROP POLICY IF EXISTS "daily_free_pulls_read_own" ON daily_free_pulls;
CREATE POLICY "daily_free_pulls_read_own"
ON daily_free_pulls FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Fix user_product_credits RLS policy
DROP POLICY IF EXISTS "Users can read their own product credits" ON user_product_credits;
CREATE POLICY "Users can read their own product credits"
ON user_product_credits FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Fix user_universal_credits RLS policy
DROP POLICY IF EXISTS "Users can read their own universal credits" ON user_universal_credits;
CREATE POLICY "Users can read their own universal credits"
ON user_universal_credits FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Fix purchases RLS policy
DROP POLICY IF EXISTS "Users can read their own purchases" ON purchases;
CREATE POLICY "Users can read their own purchases"
ON purchases FOR SELECT TO authenticated
USING (auth.uid() = user_id);