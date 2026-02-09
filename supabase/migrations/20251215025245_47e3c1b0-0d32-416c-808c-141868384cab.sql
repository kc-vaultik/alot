-- Phase 2: Battle System Database Functions (RPCs)

-- 2.1 compute_card_score: Pure scoring function
CREATE OR REPLACE FUNCTION public.compute_card_score(
  p_reveal_id UUID,
  p_is_joker BOOLEAN DEFAULT false
)
RETURNS NUMERIC(6,2)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_band rarity_band;
  v_retail_value NUMERIC;
  v_rarity_score NUMERIC;
  v_value_score NUMERIC;
  v_attributes_score NUMERIC;
  v_card_score NUMERIC;
  v_clamped_value NUMERIC;
BEGIN
  -- Get card data
  SELECT pc.band, pc.retail_value_usd
  INTO v_band, v_retail_value
  FROM reveals r
  JOIN product_classes pc ON pc.id = r.product_class_id
  WHERE r.id = p_reveal_id;

  IF v_band IS NULL THEN
    RAISE EXCEPTION 'Card not found: %', p_reveal_id;
  END IF;

  -- RarityScore (0-100)
  v_rarity_score := CASE v_band
    WHEN 'ICON' THEN 40
    WHEN 'RARE' THEN 60
    WHEN 'GRAIL' THEN 80
    WHEN 'MYTHIC' THEN 100
  END;

  -- ValueScore (log-scaled, 0-100)
  v_clamped_value := LEAST(GREATEST(COALESCE(v_retail_value, 50), 50), 100000);
  v_value_score := 100 * (log(v_clamped_value) - log(50)) / (log(100000) - log(50));

  -- AttributesScore (MVP: use band as proxy)
  v_attributes_score := CASE v_band
    WHEN 'ICON' THEN 35
    WHEN 'RARE' THEN 50
    WHEN 'GRAIL' THEN 70
    WHEN 'MYTHIC' THEN 90
  END;

  -- Final score: Value 45%, Rarity 35%, Attributes 20%
  v_card_score := (v_value_score * 0.45) + (v_rarity_score * 0.35) + (v_attributes_score * 0.20);

  -- Joker penalty (15% reduction for cross-category play)
  IF p_is_joker THEN
    v_card_score := v_card_score * 0.85;
  END IF;

  RETURN ROUND(v_card_score, 2);
END;
$$;

-- 2.2 save_battle_set: Validate and store user's 5-card deck
CREATE OR REPLACE FUNCTION public.save_battle_set(p_reveal_ids UUID[])
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_battle_set_id UUID;
  v_owned_count INT;
BEGIN
  -- Validate exactly 5 cards
  IF array_length(p_reveal_ids, 1) != 5 THEN
    RAISE EXCEPTION 'Battle set must contain exactly 5 cards, got %', array_length(p_reveal_ids, 1);
  END IF;

  -- Validate user owns all cards and they are revealed
  SELECT COUNT(*) INTO v_owned_count
  FROM reveals r
  WHERE r.id = ANY(p_reveal_ids)
    AND r.user_id = v_user_id
    AND r.revealed_at IS NOT NULL;

  IF v_owned_count != 5 THEN
    RAISE EXCEPTION 'You must own all 5 revealed cards. Found % valid cards.', v_owned_count;
  END IF;

  -- Upsert battle set (one active set per user)
  INSERT INTO battle_sets (user_id, reveal_ids)
  VALUES (v_user_id, p_reveal_ids)
  ON CONFLICT (user_id) 
  DO UPDATE SET reveal_ids = p_reveal_ids, created_at = now()
  RETURNING id INTO v_battle_set_id;

  RETURN v_battle_set_id;
END;
$$;

-- 2.3 get_available_categories: Helper to get categories from a battle set
CREATE OR REPLACE FUNCTION public.get_battle_set_categories(p_battle_set_id UUID)
RETURNS TEXT[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_categories TEXT[];
BEGIN
  SELECT ARRAY_AGG(DISTINCT pc.category::TEXT)
  INTO v_categories
  FROM battle_sets bs
  CROSS JOIN UNNEST(bs.reveal_ids) AS rid
  JOIN reveals r ON r.id = rid
  JOIN product_classes pc ON pc.id = r.product_class_id
  WHERE bs.id = p_battle_set_id;

  RETURN v_categories;
END;
$$;

-- 2.4 start_battle: Matchmaking and battle creation
CREATE OR REPLACE FUNCTION public.start_battle(p_battle_set_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_user_rating INT;
  v_queued_battle RECORD;
  v_battle_id UUID;
  v_my_categories TEXT[];
  v_opponent_categories TEXT[];
  v_common_categories TEXT[];
  v_round_categories TEXT[];
  v_i INT;
BEGIN
  -- Get or create user's leaderboard stats
  INSERT INTO leaderboard_stats (user_id)
  VALUES (v_user_id)
  ON CONFLICT (user_id, season_id) DO NOTHING;

  SELECT rating INTO v_user_rating
  FROM leaderboard_stats
  WHERE user_id = v_user_id AND season_id = 'S1';

  -- Get my categories
  v_my_categories := get_battle_set_categories(p_battle_set_id);

  -- Look for a queued battle within rating range (±200)
  SELECT b.* INTO v_queued_battle
  FROM battles b
  JOIN leaderboard_stats ls ON ls.user_id = b.user_a
  WHERE b.status = 'QUEUED'
    AND b.user_b IS NULL
    AND b.user_a != v_user_id
    AND b.opponent_type = 'human'
    AND b.expires_at > now()
    AND ABS(ls.rating - v_user_rating) <= 200
  ORDER BY b.created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF v_queued_battle.id IS NOT NULL THEN
    -- Found an opponent! Join the battle
    v_opponent_categories := get_battle_set_categories(v_queued_battle.battle_set_a);
    
    -- Find common categories
    SELECT ARRAY_AGG(cat) INTO v_common_categories
    FROM (
      SELECT UNNEST(v_my_categories) AS cat
      INTERSECT
      SELECT UNNEST(v_opponent_categories) AS cat
    ) AS common;

    -- If not enough common categories, use all available from both
    IF array_length(v_common_categories, 1) IS NULL OR array_length(v_common_categories, 1) < 3 THEN
      SELECT ARRAY_AGG(DISTINCT cat) INTO v_common_categories
      FROM (
        SELECT UNNEST(v_my_categories) AS cat
        UNION
        SELECT UNNEST(v_opponent_categories) AS cat
      ) AS all_cats;
    END IF;

    -- Select 3 random categories for rounds
    SELECT ARRAY_AGG(cat ORDER BY random()) INTO v_round_categories
    FROM (
      SELECT UNNEST(v_common_categories) AS cat
      ORDER BY random()
      LIMIT 3
    ) AS selected;

    -- Pad with repeats if needed
    WHILE array_length(v_round_categories, 1) < 3 LOOP
      v_round_categories := array_append(v_round_categories, v_common_categories[1]);
    END LOOP;

    -- Update battle to active
    UPDATE battles
    SET user_b = v_user_id,
        battle_set_b = p_battle_set_id,
        status = 'ACTIVE',
        started_at = now(),
        round_categories = v_round_categories,
        expires_at = now() + INTERVAL '15 minutes'
    WHERE id = v_queued_battle.id
    RETURNING id INTO v_battle_id;

    -- Initialize opponent's leaderboard stats if not exists
    INSERT INTO leaderboard_stats (user_id)
    VALUES (v_queued_battle.user_a)
    ON CONFLICT (user_id, season_id) DO NOTHING;

    -- Create 3 battle rounds
    FOR v_i IN 1..3 LOOP
      INSERT INTO battle_rounds (battle_id, round_index, category)
      VALUES (v_battle_id, v_i, v_round_categories[v_i]);
    END LOOP;

    RETURN jsonb_build_object(
      'status', 'matched',
      'battle_id', v_battle_id,
      'opponent_type', 'human',
      'round_categories', v_round_categories
    );
  ELSE
    -- No opponent found, create queued battle
    INSERT INTO battles (
      user_a, battle_set_a, status, opponent_type, is_ranked
    ) VALUES (
      v_user_id, p_battle_set_id, 'QUEUED', 'human', true
    ) RETURNING id INTO v_battle_id;

    RETURN jsonb_build_object(
      'status', 'queued',
      'battle_id', v_battle_id,
      'message', 'Waiting for opponent...'
    );
  END IF;
END;
$$;

-- 2.5 start_agent_battle: Create practice match vs AI
CREATE OR REPLACE FUNCTION public.start_agent_battle(p_battle_set_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_user_rating INT;
  v_agent_tier agent_tier;
  v_battle_id UUID;
  v_my_categories TEXT[];
  v_round_categories TEXT[];
  v_agent_deck JSONB;
  v_i INT;
BEGIN
  -- Get user's rating
  INSERT INTO leaderboard_stats (user_id)
  VALUES (v_user_id)
  ON CONFLICT (user_id, season_id) DO NOTHING;

  SELECT rating INTO v_user_rating
  FROM leaderboard_stats
  WHERE user_id = v_user_id AND season_id = 'S1';

  -- Determine agent tier based on rating
  v_agent_tier := CASE
    WHEN v_user_rating < 900 THEN 'rookie'
    WHEN v_user_rating < 1200 THEN 'skilled'
    WHEN v_user_rating < 1500 THEN 'pro'
    ELSE 'elite'
  END;

  -- Get categories from battle set
  v_my_categories := get_battle_set_categories(p_battle_set_id);

  -- Generate 3 random categories
  SELECT ARRAY_AGG(cat ORDER BY random()) INTO v_round_categories
  FROM (
    SELECT UNNEST(v_my_categories) AS cat
    ORDER BY random()
    LIMIT 3
  ) AS selected;

  -- Pad if needed
  WHILE array_length(v_round_categories, 1) IS NULL OR array_length(v_round_categories, 1) < 3 LOOP
    v_round_categories := array_append(COALESCE(v_round_categories, '{}'), v_my_categories[1]);
  END LOOP;

  -- Generate agent deck (5 virtual cards from product_classes)
  SELECT jsonb_agg(card_data) INTO v_agent_deck
  FROM (
    SELECT jsonb_build_object(
      'product_class_id', pc.id,
      'category', pc.category,
      'band', pc.band,
      'retail_value_usd', pc.retail_value_usd,
      'name', pc.name
    ) AS card_data
    FROM product_classes pc
    WHERE pc.is_active = true
    ORDER BY 
      CASE v_agent_tier
        WHEN 'rookie' THEN CASE WHEN pc.band = 'ICON' THEN 0 ELSE 1 END
        WHEN 'skilled' THEN CASE WHEN pc.band IN ('ICON', 'RARE') THEN 0 ELSE 1 END
        WHEN 'pro' THEN CASE WHEN pc.band IN ('RARE', 'GRAIL') THEN 0 ELSE 1 END
        ELSE 0
      END,
      random()
    LIMIT 5
  ) AS deck;

  -- Create battle
  INSERT INTO battles (
    user_a, battle_set_a, status, opponent_type, agent_tier,
    agent_seed, agent_deck, round_categories, is_ranked,
    reward_multiplier, started_at
  ) VALUES (
    v_user_id, p_battle_set_id, 'ACTIVE', 'agent', v_agent_tier,
    gen_random_uuid()::TEXT, v_agent_deck, v_round_categories, false,
    0.30, now()
  ) RETURNING id INTO v_battle_id;

  -- Create 3 battle rounds
  FOR v_i IN 1..3 LOOP
    INSERT INTO battle_rounds (battle_id, round_index, category)
    VALUES (v_battle_id, v_i, v_round_categories[v_i]);
  END LOOP;

  RETURN jsonb_build_object(
    'status', 'matched',
    'battle_id', v_battle_id,
    'opponent_type', 'agent',
    'agent_tier', v_agent_tier,
    'round_categories', v_round_categories
  );
END;
$$;

-- 2.6 compute_agent_card_score: Score for agent's virtual card
CREATE OR REPLACE FUNCTION public.compute_agent_card_score(
  p_card_data JSONB,
  p_is_joker BOOLEAN DEFAULT false
)
RETURNS NUMERIC(6,2)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_band TEXT;
  v_retail_value NUMERIC;
  v_rarity_score NUMERIC;
  v_value_score NUMERIC;
  v_attributes_score NUMERIC;
  v_card_score NUMERIC;
  v_clamped_value NUMERIC;
BEGIN
  v_band := p_card_data->>'band';
  v_retail_value := COALESCE((p_card_data->>'retail_value_usd')::NUMERIC, 100);

  -- RarityScore
  v_rarity_score := CASE v_band
    WHEN 'ICON' THEN 40
    WHEN 'RARE' THEN 60
    WHEN 'GRAIL' THEN 80
    WHEN 'MYTHIC' THEN 100
    ELSE 40
  END;

  -- ValueScore (log-scaled)
  v_clamped_value := LEAST(GREATEST(v_retail_value, 50), 100000);
  v_value_score := 100 * (log(v_clamped_value) - log(50)) / (log(100000) - log(50));

  -- AttributesScore
  v_attributes_score := CASE v_band
    WHEN 'ICON' THEN 35
    WHEN 'RARE' THEN 50
    WHEN 'GRAIL' THEN 70
    WHEN 'MYTHIC' THEN 90
    ELSE 35
  END;

  -- Final score
  v_card_score := (v_value_score * 0.45) + (v_rarity_score * 0.35) + (v_attributes_score * 0.20);

  IF p_is_joker THEN
    v_card_score := v_card_score * 0.85;
  END IF;

  RETURN ROUND(v_card_score, 2);
END;
$$;

-- 2.7 submit_round_pick: Record player's card choice and process round
CREATE OR REPLACE FUNCTION public.submit_round_pick(
  p_battle_id UUID,
  p_round_index INT,
  p_reveal_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_battle RECORD;
  v_round RECORD;
  v_is_user_a BOOLEAN;
  v_card_category TEXT;
  v_is_joker BOOLEAN;
  v_my_score NUMERIC(6,2);
  v_opponent_score NUMERIC(6,2);
  v_round_winner round_winner;
  v_agent_card JSONB;
  v_agent_category TEXT;
BEGIN
  -- Get battle
  SELECT * INTO v_battle
  FROM battles
  WHERE id = p_battle_id
  FOR UPDATE;

  IF v_battle IS NULL THEN
    RAISE EXCEPTION 'Battle not found';
  END IF;

  IF v_battle.status != 'ACTIVE' THEN
    RAISE EXCEPTION 'Battle is not active';
  END IF;

  -- Determine if user is player A or B
  v_is_user_a := (v_battle.user_a = v_user_id);
  
  IF NOT v_is_user_a AND v_battle.user_b != v_user_id THEN
    RAISE EXCEPTION 'You are not part of this battle';
  END IF;

  -- Get round
  SELECT * INTO v_round
  FROM battle_rounds
  WHERE battle_id = p_battle_id AND round_index = p_round_index
  FOR UPDATE;

  IF v_round IS NULL THEN
    RAISE EXCEPTION 'Round not found';
  END IF;

  -- Check if already submitted
  IF v_is_user_a AND v_round.reveal_a_id IS NOT NULL THEN
    RAISE EXCEPTION 'You already submitted for this round';
  END IF;
  
  IF NOT v_is_user_a AND v_round.reveal_b_id IS NOT NULL THEN
    RAISE EXCEPTION 'You already submitted for this round';
  END IF;

  -- Validate card ownership
  IF NOT EXISTS (
    SELECT 1 FROM reveals r
    WHERE r.id = p_reveal_id 
    AND r.user_id = v_user_id
    AND r.revealed_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'You do not own this card';
  END IF;

  -- Get card category
  SELECT pc.category::TEXT INTO v_card_category
  FROM reveals r
  JOIN product_classes pc ON pc.id = r.product_class_id
  WHERE r.id = p_reveal_id;

  -- Check if joker (cross-category play)
  v_is_joker := (v_card_category != v_round.category);

  -- Calculate score
  v_my_score := compute_card_score(p_reveal_id, v_is_joker);

  -- Record the pick
  IF v_is_user_a THEN
    UPDATE battle_rounds
    SET reveal_a_id = p_reveal_id,
        score_a = v_my_score,
        a_submitted_at = now()
    WHERE id = v_round.id;
  ELSE
    UPDATE battle_rounds
    SET reveal_b_id = p_reveal_id,
        score_b = v_my_score,
        b_submitted_at = now()
    WHERE id = v_round.id;
  END IF;

  -- If agent battle, process agent pick immediately
  IF v_battle.opponent_type = 'agent' THEN
    -- Agent picks best matching card from deck
    SELECT card INTO v_agent_card
    FROM (
      SELECT card,
        CASE WHEN card->>'category' = v_round.category THEN 1 ELSE 0 END AS category_match,
        (random() * 0.2) AS randomness
      FROM jsonb_array_elements(v_battle.agent_deck) AS card
    ) AS picks
    ORDER BY category_match DESC, randomness DESC
    LIMIT 1;

    v_agent_category := v_agent_card->>'category';
    v_opponent_score := compute_agent_card_score(v_agent_card, v_agent_category != v_round.category);

    UPDATE battle_rounds
    SET agent_card = v_agent_card,
        score_b = v_opponent_score,
        b_submitted_at = now()
    WHERE id = v_round.id;
  END IF;

  -- Refresh round data
  SELECT * INTO v_round
  FROM battle_rounds
  WHERE id = v_round.id;

  -- Check if both players submitted
  IF v_round.a_submitted_at IS NOT NULL AND v_round.b_submitted_at IS NOT NULL THEN
    -- Determine round winner
    IF v_round.score_a > v_round.score_b THEN
      v_round_winner := 'A';
    ELSIF v_round.score_b > v_round.score_a THEN
      v_round_winner := 'B';
    ELSE
      -- Tiebreaker: compare rarity, then value, then coin flip
      v_round_winner := CASE WHEN random() < 0.5 THEN 'A' ELSE 'B' END;
    END IF;

    -- Update round
    UPDATE battle_rounds
    SET winner = v_round_winner,
        completed_at = now()
    WHERE id = v_round.id;

    -- Update battle scores
    IF v_round_winner = 'A' THEN
      UPDATE battles SET score_a = score_a + 1 WHERE id = p_battle_id;
    ELSE
      UPDATE battles SET score_b = score_b + 1 WHERE id = p_battle_id;
    END IF;

    -- Refresh battle
    SELECT * INTO v_battle FROM battles WHERE id = p_battle_id;

    -- Check for match completion (first to 2)
    IF v_battle.score_a >= 2 OR v_battle.score_b >= 2 OR p_round_index = 3 THEN
      PERFORM complete_battle(p_battle_id);
    END IF;

    RETURN jsonb_build_object(
      'round_complete', true,
      'my_score', v_my_score,
      'opponent_score', v_round.score_b,
      'winner', v_round_winner,
      'battle_score_a', v_battle.score_a + CASE WHEN v_round_winner = 'A' THEN 1 ELSE 0 END,
      'battle_score_b', v_battle.score_b + CASE WHEN v_round_winner = 'B' THEN 1 ELSE 0 END
    );
  END IF;

  RETURN jsonb_build_object(
    'round_complete', false,
    'my_score', v_my_score,
    'waiting_for_opponent', true
  );
END;
$$;

-- 2.8 complete_battle: Finalize match and award rewards
CREATE OR REPLACE FUNCTION public.complete_battle(p_battle_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_battle RECORD;
  v_winner_id UUID;
  v_loser_id UUID;
  v_winner_reward INT;
  v_loser_reward INT;
  v_k_factor INT := 32;
  v_winner_rating INT;
  v_loser_rating INT;
  v_expected_winner NUMERIC;
  v_rating_change INT;
  v_round RECORD;
BEGIN
  SELECT * INTO v_battle
  FROM battles
  WHERE id = p_battle_id
  FOR UPDATE;

  IF v_battle.status = 'COMPLETE' THEN
    RETURN; -- Already completed
  END IF;

  -- Determine winner
  IF v_battle.score_a > v_battle.score_b THEN
    v_winner_id := v_battle.user_a;
    v_loser_id := v_battle.user_b;
  ELSE
    v_winner_id := v_battle.user_b;
    v_loser_id := v_battle.user_a;
  END IF;

  -- Calculate rewards (with multiplier for agent battles)
  v_winner_reward := FLOOR(50 * v_battle.reward_multiplier);
  v_loser_reward := FLOOR(10 * v_battle.reward_multiplier);

  -- Award credits to winner
  INSERT INTO user_universal_credits (user_id, credits)
  VALUES (v_winner_id, v_winner_reward)
  ON CONFLICT (user_id)
  DO UPDATE SET credits = user_universal_credits.credits + v_winner_reward, updated_at = now();

  -- Award credits to loser (if human)
  IF v_loser_id IS NOT NULL THEN
    INSERT INTO user_universal_credits (user_id, credits)
    VALUES (v_loser_id, v_loser_reward)
    ON CONFLICT (user_id)
    DO UPDATE SET credits = user_universal_credits.credits + v_loser_reward, updated_at = now();
  END IF;

  -- Update leaderboard stats (only for ranked human battles)
  IF v_battle.is_ranked AND v_battle.opponent_type = 'human' AND v_loser_id IS NOT NULL THEN
    -- Get current ratings
    SELECT rating INTO v_winner_rating
    FROM leaderboard_stats WHERE user_id = v_winner_id AND season_id = 'S1';
    
    SELECT rating INTO v_loser_rating
    FROM leaderboard_stats WHERE user_id = v_loser_id AND season_id = 'S1';

    -- Calculate ELO change
    v_expected_winner := 1.0 / (1.0 + power(10, (v_loser_rating - v_winner_rating)::NUMERIC / 400));
    v_rating_change := ROUND(v_k_factor * (1 - v_expected_winner));

    -- Update winner stats
    UPDATE leaderboard_stats
    SET rating = rating + v_rating_change,
        wins = wins + 1,
        streak_current = streak_current + 1,
        streak_best = GREATEST(streak_best, streak_current + 1),
        last_battle_at = now(),
        updated_at = now()
    WHERE user_id = v_winner_id AND season_id = 'S1';

    -- Update loser stats
    UPDATE leaderboard_stats
    SET rating = GREATEST(rating - v_rating_change, 100),
        losses = losses + 1,
        streak_current = 0,
        last_battle_at = now(),
        updated_at = now()
    WHERE user_id = v_loser_id AND season_id = 'S1';

    -- Update wins_by_category for each round won
    FOR v_round IN 
      SELECT * FROM battle_rounds WHERE battle_id = p_battle_id AND winner IS NOT NULL
    LOOP
      IF v_round.winner = 'A' AND v_battle.user_a = v_winner_id THEN
        UPDATE leaderboard_stats
        SET wins_by_category = jsonb_set(
          COALESCE(wins_by_category, '{}'),
          ARRAY[v_round.category],
          to_jsonb(COALESCE((wins_by_category->>v_round.category)::INT, 0) + 1)
        )
        WHERE user_id = v_winner_id AND season_id = 'S1';
      ELSIF v_round.winner = 'B' AND v_battle.user_b = v_winner_id THEN
        UPDATE leaderboard_stats
        SET wins_by_category = jsonb_set(
          COALESCE(wins_by_category, '{}'),
          ARRAY[v_round.category],
          to_jsonb(COALESCE((wins_by_category->>v_round.category)::INT, 0) + 1)
        )
        WHERE user_id = v_winner_id AND season_id = 'S1';
      END IF;
    END LOOP;
  END IF;

  -- Mark battle complete
  UPDATE battles
  SET status = 'COMPLETE',
      winner_user_id = v_winner_id,
      completed_at = now()
  WHERE id = p_battle_id;
END;
$$;

-- 2.9 cancel_queued_battle: Allow user to leave queue
CREATE OR REPLACE FUNCTION public.cancel_queued_battle(p_battle_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  UPDATE battles
  SET status = 'CANCELLED'
  WHERE id = p_battle_id
    AND user_a = v_user_id
    AND status = 'QUEUED';

  RETURN FOUND;
END;
$$;

-- 2.10 get_active_battle: Get user's current active battle
CREATE OR REPLACE FUNCTION public.get_active_battle()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_battle RECORD;
BEGIN
  SELECT * INTO v_battle
  FROM battles
  WHERE (user_a = v_user_id OR user_b = v_user_id)
    AND status IN ('QUEUED', 'ACTIVE')
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_battle IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN jsonb_build_object(
    'id', v_battle.id,
    'status', v_battle.status,
    'opponent_type', v_battle.opponent_type,
    'agent_tier', v_battle.agent_tier,
    'is_user_a', v_battle.user_a = v_user_id,
    'score_a', v_battle.score_a,
    'score_b', v_battle.score_b,
    'round_categories', v_battle.round_categories,
    'started_at', v_battle.started_at
  );
END;
$$;