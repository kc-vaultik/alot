-- Phase 1: 1v1 Battles Database Schema

-- 1.1 New Enum Types
CREATE TYPE public.battle_status AS ENUM ('QUEUED', 'ACTIVE', 'COMPLETE', 'EXPIRED', 'CANCELLED');
CREATE TYPE public.round_winner AS ENUM ('A', 'B', 'TIE');
CREATE TYPE public.opponent_type AS ENUM ('human', 'agent');
CREATE TYPE public.agent_tier AS ENUM ('rookie', 'skilled', 'pro', 'elite');

-- 1.2 Battle Sets Table (user's 5-card lineup)
CREATE TABLE public.battle_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reveal_ids UUID[] NOT NULL CHECK (array_length(reveal_ids, 1) = 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- 1.3 Battle Queue Table (for matchmaking)
CREATE TABLE public.battle_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  battle_set_id UUID NOT NULL REFERENCES battle_sets(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL DEFAULT 1000,
  queued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '2 minutes'),
  UNIQUE(user_id)
);

-- 1.4 Battles Table
CREATE TABLE public.battles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status public.battle_status NOT NULL DEFAULT 'QUEUED',
  opponent_type public.opponent_type NOT NULL DEFAULT 'human',
  user_a UUID NOT NULL REFERENCES auth.users(id),
  user_b UUID REFERENCES auth.users(id),
  battle_set_a UUID NOT NULL REFERENCES battle_sets(id),
  battle_set_b UUID REFERENCES battle_sets(id),
  agent_tier public.agent_tier,
  agent_seed TEXT,
  agent_deck JSONB,
  round_categories TEXT[] NOT NULL DEFAULT '{}',
  score_a INTEGER NOT NULL DEFAULT 0,
  score_b INTEGER NOT NULL DEFAULT 0,
  winner_user_id UUID REFERENCES auth.users(id),
  is_ranked BOOLEAN NOT NULL DEFAULT true,
  reward_multiplier NUMERIC(3,2) NOT NULL DEFAULT 1.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '10 minutes')
);

-- 1.5 Battle Rounds Table
CREATE TABLE public.battle_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id UUID NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
  round_index INTEGER NOT NULL CHECK (round_index BETWEEN 1 AND 3),
  category TEXT NOT NULL,
  reveal_a_id UUID REFERENCES reveals(id),
  reveal_b_id UUID REFERENCES reveals(id),
  agent_card JSONB,
  score_a NUMERIC(6,2),
  score_b NUMERIC(6,2),
  winner public.round_winner,
  a_submitted_at TIMESTAMPTZ,
  b_submitted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(battle_id, round_index)
);

-- 1.6 Leaderboard Stats Table
CREATE TABLE public.leaderboard_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  season_id TEXT NOT NULL DEFAULT 'S1',
  rating INTEGER NOT NULL DEFAULT 1000,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  streak_current INTEGER NOT NULL DEFAULT 0,
  streak_best INTEGER NOT NULL DEFAULT 0,
  wins_by_category JSONB NOT NULL DEFAULT '{}',
  last_battle_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, season_id)
);

-- Enable RLS on all tables
ALTER TABLE public.battle_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battle_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battle_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_stats ENABLE ROW LEVEL SECURITY;

-- 1.7 RLS Policies

-- battle_sets: Users can manage their own
CREATE POLICY "Users can view own battle sets" ON public.battle_sets
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own battle sets" ON public.battle_sets
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own battle sets" ON public.battle_sets
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own battle sets" ON public.battle_sets
FOR DELETE USING (auth.uid() = user_id);

-- battle_queue: Users can manage their own queue entry
CREATE POLICY "Users can view own queue entry" ON public.battle_queue
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own queue entry" ON public.battle_queue
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own queue entry" ON public.battle_queue
FOR DELETE USING (auth.uid() = user_id);

-- battles: Users can read battles they're in
CREATE POLICY "Users can view own battles" ON public.battles
FOR SELECT USING (auth.uid() IN (user_a, user_b));

-- battle_rounds: Users can view rounds of their battles
CREATE POLICY "Users can view own battle rounds" ON public.battle_rounds
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.battles 
    WHERE battles.id = battle_rounds.battle_id 
    AND auth.uid() IN (battles.user_a, battles.user_b)
  )
);

-- leaderboard_stats: Anyone can read (public leaderboard)
CREATE POLICY "Anyone can view leaderboard" ON public.leaderboard_stats
FOR SELECT USING (true);

-- Enable realtime for battles and battle_rounds
ALTER PUBLICATION supabase_realtime ADD TABLE public.battles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.battle_rounds;