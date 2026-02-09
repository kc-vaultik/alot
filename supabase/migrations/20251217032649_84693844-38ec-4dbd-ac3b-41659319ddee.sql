-- 1.1 Create collector_profiles table
CREATE TABLE public.collector_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 1.2 Create collector_connections table (follow system)
CREATE TABLE public.collector_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'FOLLOWING' CHECK (status IN ('FOLLOWING', 'MUTUAL')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- Create indexes for performance
CREATE INDEX idx_collector_connections_follower ON public.collector_connections(follower_id);
CREATE INDEX idx_collector_connections_following ON public.collector_connections(following_id);
CREATE INDEX idx_collector_profiles_username ON public.collector_profiles(username);

-- 1.3 Create get_collector_score RPC function
CREATE OR REPLACE FUNCTION public.get_collector_score(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_card_count INT := 0;
  v_collection_value NUMERIC := 0;
  v_swaps_completed INT := 0;
  v_gifts_given INT := 0;
  v_battles_won INT := 0;
  v_battles_lost INT := 0;
  v_redemptions INT := 0;
  v_collection_value_score NUMERIC;
  v_card_count_score NUMERIC;
  v_swaps_score NUMERIC;
  v_gifts_score NUMERIC;
  v_battle_score NUMERIC;
  v_redemption_score NUMERIC;
  v_total_score INT;
BEGIN
  -- Get card count and collection value
  SELECT COUNT(*), COALESCE(SUM(pc.retail_value_usd), 0)
  INTO v_card_count, v_collection_value
  FROM reveals r
  JOIN product_classes pc ON pc.id = r.product_class_id
  WHERE r.user_id = p_user_id AND r.revealed_at IS NOT NULL;

  -- Get swaps completed (transfers where user was either sender or receiver with status CLAIMED and type swap)
  SELECT COUNT(*)
  INTO v_swaps_completed
  FROM card_transfers ct
  WHERE (ct.from_user_id = p_user_id OR ct.to_user_id = p_user_id)
    AND ct.status = 'CLAIMED'
    AND ct.transfer_type = 'swap';

  -- Get gifts given
  SELECT COUNT(*)
  INTO v_gifts_given
  FROM card_transfers ct
  WHERE ct.from_user_id = p_user_id
    AND ct.status = 'CLAIMED'
    AND ct.transfer_type = 'gift';

  -- Get battle stats
  SELECT COALESCE(wins, 0), COALESCE(losses, 0)
  INTO v_battles_won, v_battles_lost
  FROM leaderboard_stats
  WHERE user_id = p_user_id AND season_id = 'S1';

  -- Get redemptions (awards with status FULFILLED)
  SELECT COUNT(*)
  INTO v_redemptions
  FROM awards
  WHERE user_id = p_user_id AND status = 'FULFILLED';

  -- Calculate component scores
  -- Collection value: 25% weight (log-scaled, $0-$100K+)
  v_collection_value_score := LEAST(25, (CASE WHEN v_collection_value > 0 THEN log(v_collection_value + 1) / log(100001) * 25 ELSE 0 END));
  
  -- Card count: 15% weight (0-500+ cards)
  v_card_count_score := LEAST(15, (v_card_count::NUMERIC / 500) * 15);
  
  -- Swaps completed: 15% weight (0-50+ swaps)
  v_swaps_score := LEAST(15, (v_swaps_completed::NUMERIC / 50) * 15);
  
  -- Gifts given: 10% weight (0-25+ gifts)
  v_gifts_score := LEAST(10, (v_gifts_given::NUMERIC / 25) * 10);
  
  -- Battle win rate: 20% weight
  v_battle_score := CASE 
    WHEN (v_battles_won + v_battles_lost) > 0 
    THEN (v_battles_won::NUMERIC / (v_battles_won + v_battles_lost)) * 20
    ELSE 0 
  END;
  
  -- Redemptions: 15% weight (0-10+ items)
  v_redemption_score := LEAST(15, (v_redemptions::NUMERIC / 10) * 15);

  -- Calculate total score (1-100, minimum 1)
  v_total_score := GREATEST(1, LEAST(100, ROUND(
    v_collection_value_score + v_card_count_score + v_swaps_score + 
    v_gifts_score + v_battle_score + v_redemption_score
  )::INT));

  RETURN jsonb_build_object(
    'score', v_total_score,
    'card_count', v_card_count,
    'collection_value', v_collection_value,
    'swaps_completed', v_swaps_completed,
    'gifts_given', v_gifts_given,
    'battles_won', v_battles_won,
    'battles_lost', v_battles_lost,
    'redemptions', v_redemptions,
    'breakdown', jsonb_build_object(
      'collection_value_score', ROUND(v_collection_value_score, 2),
      'card_count_score', ROUND(v_card_count_score, 2),
      'swaps_score', ROUND(v_swaps_score, 2),
      'gifts_score', ROUND(v_gifts_score, 2),
      'battle_score', ROUND(v_battle_score, 2),
      'redemption_score', ROUND(v_redemption_score, 2)
    )
  );
END;
$$;

-- 1.4 Create trigger for auto-profile creation on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_username TEXT;
  v_base_username TEXT;
  v_counter INT := 0;
BEGIN
  -- Generate base username from email (before @)
  v_base_username := LOWER(SPLIT_PART(NEW.email, '@', 1));
  -- Remove non-alphanumeric characters
  v_base_username := REGEXP_REPLACE(v_base_username, '[^a-z0-9]', '', 'g');
  -- Ensure minimum length
  IF LENGTH(v_base_username) < 3 THEN
    v_base_username := 'collector';
  END IF;
  
  v_username := v_base_username;
  
  -- Handle uniqueness by appending numbers if needed
  WHILE EXISTS (SELECT 1 FROM collector_profiles WHERE username = v_username) LOOP
    v_counter := v_counter + 1;
    v_username := v_base_username || v_counter::TEXT;
  END LOOP;
  
  -- Insert profile
  INSERT INTO collector_profiles (user_id, username, display_name)
  VALUES (NEW.id, v_username, v_username);
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_profile();

-- 1.5 Enable RLS
ALTER TABLE public.collector_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collector_connections ENABLE ROW LEVEL SECURITY;

-- Profiles RLS: Anyone can read public profiles
CREATE POLICY "Anyone can view public profiles"
ON public.collector_profiles
FOR SELECT
USING (is_public = true OR auth.uid() = user_id);

-- Profiles RLS: Owners can update their own
CREATE POLICY "Users can update own profile"
ON public.collector_profiles
FOR UPDATE
USING (auth.uid() = user_id);

-- Profiles RLS: Users can insert their own (for manual profile creation if trigger fails)
CREATE POLICY "Users can insert own profile"
ON public.collector_profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Connections RLS: Users can view connections involving them or public users
CREATE POLICY "Users can view connections"
ON public.collector_connections
FOR SELECT
USING (
  auth.uid() = follower_id 
  OR auth.uid() = following_id
  OR EXISTS (SELECT 1 FROM collector_profiles WHERE user_id = following_id AND is_public = true)
);

-- Connections RLS: Users can create their own follows
CREATE POLICY "Users can create follows"
ON public.collector_connections
FOR INSERT
WITH CHECK (auth.uid() = follower_id);

-- Connections RLS: Users can delete their own follows
CREATE POLICY "Users can delete own follows"
ON public.collector_connections
FOR DELETE
USING (auth.uid() = follower_id);

-- Connections RLS: System can update for mutual status (via RPC)
CREATE POLICY "Users can update own connections"
ON public.collector_connections
FOR UPDATE
USING (auth.uid() = follower_id OR auth.uid() = following_id);