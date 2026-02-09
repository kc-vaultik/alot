-- Phase 4: Data Migration

-- 4.1.1 Convert existing credits_awarded to redeem_credits_cents (1 credit = $0.01 = 1 cent)
UPDATE reveals
SET redeem_credits_cents = credits_awarded
WHERE redeem_credits_cents = 0 AND credits_awarded > 0;

-- 4.1.2 Initialize priority_points based on rarity band
-- ICON: 10 PP, RARE: 25 PP, GRAIL: 50 PP, MYTHIC: 100 PP
UPDATE reveals
SET priority_points = CASE band
  WHEN 'ICON' THEN 10
  WHEN 'RARE' THEN 25
  WHEN 'GRAIL' THEN 50
  WHEN 'MYTHIC' THEN 100
  ELSE 10
END
WHERE priority_points = 0;

-- 4.1.3 Ensure all existing cards have card_state = 'owned'
UPDATE reveals
SET card_state = 'owned'
WHERE card_state IS NULL OR card_state = '';