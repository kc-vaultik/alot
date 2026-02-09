import { describe, it, expect } from 'vitest';
import {
  bandToRarityScore,
  getDesignTraitsForBand,
  getRewardsForTier,
  calculateShards,
  isValidUUID,
  mapRevealToCollectCard,
  mapFreePullRevealToCard,
  formatDigitalNumber,
  getExpireDate,
} from './cardMappers';
import type { RevealRow, FreePullReveal } from '../types';

describe('cardMappers', () => {
  describe('bandToRarityScore', () => {
    it('returns correct score for MYTHIC band', () => {
      expect(bandToRarityScore('MYTHIC')).toBe(97);
    });

    it('returns correct score for GRAIL band', () => {
      expect(bandToRarityScore('GRAIL')).toBe(85);
    });

    it('returns correct score for RARE band', () => {
      expect(bandToRarityScore('RARE')).toBe(65);
    });

    it('returns correct score for ICON band', () => {
      expect(bandToRarityScore('ICON')).toBe(30);
    });

    it('returns ICON score for unknown bands', () => {
      expect(bandToRarityScore('UNKNOWN')).toBe(30);
    });
  });

  describe('getDesignTraitsForBand', () => {
    it('returns correct traits for MYTHIC band', () => {
      const traits = getDesignTraitsForBand('MYTHIC');
      expect(traits.background).toBe('obsidian');
      expect(traits.texture).toBe('holographic');
      expect(traits.foilType).toBe('full');
    });

    it('returns correct traits for ICON band', () => {
      const traits = getDesignTraitsForBand('ICON');
      expect(traits.background).toBe('matte-black');
      expect(traits.texture).toBe('smooth');
      expect(traits.foilType).toBe('none');
    });

    it('returns ICON traits for unknown bands', () => {
      const traits = getDesignTraitsForBand('UNKNOWN');
      expect(traits.background).toBe('matte-black');
    });
  });

  describe('getRewardsForTier', () => {
    it('returns golden rewards when isGolden is true', () => {
      const rewards = getRewardsForTier('icon', true);
      expect(rewards).toContain('+2 daily free packs');
      expect(rewards).toContain('Cooldown -50%');
    });

    it('returns tier-specific rewards when not golden', () => {
      const iconRewards = getRewardsForTier('icon', false);
      expect(iconRewards).toContain('Cooldown -10%');
      expect(iconRewards).not.toContain('+2 daily free packs');
    });

    it('returns mythic rewards for mythic tier', () => {
      const rewards = getRewardsForTier('mythic', false);
      expect(rewards).toContain('+1 daily free pack');
      expect(rewards).toContain('Room entry fee reduced');
    });
  });

  describe('calculateShards', () => {
    it('returns 0 when fulfillment cost is 0', () => {
      expect(calculateShards(100, 0)).toBe(0);
    });

    it('returns 0 when fulfillment cost is negative', () => {
      expect(calculateShards(100, -100)).toBe(0);
    });

    it('calculates correct percentage', () => {
      // 50 credits toward $1 product (100 credits needed) = 50%
      expect(calculateShards(50, 1)).toBe(50);
    });

    it('caps at 100%', () => {
      // 500 credits toward $1 product = 500%, capped at 100
      expect(calculateShards(500, 1)).toBe(100);
    });

    it('handles fractional progress correctly', () => {
      // 25 credits toward $1 product = 25%
      expect(calculateShards(25, 1)).toBe(25);
    });
  });

  describe('isValidUUID', () => {
    it('validates correct UUID format', () => {
      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    });

    it('validates uppercase UUIDs', () => {
      expect(isValidUUID('550E8400-E29B-41D4-A716-446655440000')).toBe(true);
    });

    it('rejects invalid UUID formats', () => {
      expect(isValidUUID('not-a-uuid')).toBe(false);
      expect(isValidUUID('demo-golden-123')).toBe(false);
      expect(isValidUUID('')).toBe(false);
      expect(isValidUUID('550e8400-e29b-41d4-a716')).toBe(false);
    });
  });

  describe('formatDigitalNumber', () => {
    it('formats serial number with spaces', () => {
      expect(formatDigitalNumber('1234567890123456')).toBe('1234  5678  9012  3456');
    });

    it('pads short serial numbers', () => {
      expect(formatDigitalNumber('1234')).toBe('0000  0000  0000  1234');
    });

    it('handles non-numeric characters', () => {
      expect(formatDigitalNumber('ABC-1234')).toBe('0000  0000  0000  1234');
    });

    it('truncates long serial numbers', () => {
      expect(formatDigitalNumber('12345678901234567890')).toBe('1234  5678  9012  3456');
    });
  });

  describe('getExpireDate', () => {
    it('returns consistent date for same card ID', () => {
      const cardId = 'test-card-123';
      const date1 = getExpireDate(cardId);
      const date2 = getExpireDate(cardId);
      expect(date1).toBe(date2);
    });

    it('returns date in MM/YY format', () => {
      const date = getExpireDate('any-card');
      expect(date).toMatch(/^\d{2}\/\d{2}$/);
    });

    it('returns month between 01 and 12', () => {
      const date = getExpireDate('test-id');
      const month = parseInt(date.split('/')[0], 10);
      expect(month).toBeGreaterThanOrEqual(1);
      expect(month).toBeLessThanOrEqual(12);
    });
  });

  describe('mapRevealToCollectCard', () => {
    const mockReveal: RevealRow = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      purchase_id: 'purchase-123',
      user_id: 'user-123',
      product_class_id: 'product-123',
      band: 'RARE',
      is_golden: false,
      credits_awarded: 100,
      product_credits_awarded: 70,
      universal_credits_awarded: 30,
      is_award: false,
      award_id: null,
      serial_number: '0001/10000',
      card_data: null,
      created_at: '2024-01-01T00:00:00Z',
      revealed_at: '2024-01-01T00:00:01Z',
      // Room Stats
      priority_points: 50,
      redeem_credits_cents: 1000,
      card_state: 'owned',
      staked_room_id: null,
      product_classes: {
        id: 'product-123',
        name: 'Test Product',
        brand: 'TestBrand',
        model: 'TestModel',
        category: 'WATCHES',
        band: 'RARE',
        retail_value_usd: 5000,
        image_url: '/test-image.png',
        expected_fulfillment_cost_usd: 4000,
      },
    };

    it('maps reveal to CollectCard correctly', () => {
      const card = mapRevealToCollectCard(mockReveal);
      expect(card).not.toBeNull();
      if (!card) return;

      expect(card.card_id).toBe(mockReveal.id);
      expect(card.brand).toBe('TestBrand');
      expect(card.model).toBe('TestModel');
      expect(card.product_value).toBe(5000);
      expect(card.is_golden).toBe(false);
      expect(card.serial_number).toBe('0001/10000');
    });

    it('calculates correct rarity score from band', () => {
      const card = mapRevealToCollectCard(mockReveal);
      expect(card).not.toBeNull();
      if (!card) return;
      expect(card.rarity_score).toBe(65); // RARE band score
    });

    it('includes rewards with calculated shards', () => {
      const card = mapRevealToCollectCard(mockReveal);
      expect(card).not.toBeNull();
      if (!card) return;
      expect(card.rewards?.points).toBe(100);
      expect(card.rewards?.progress.shards_earned).toBeCloseTo(0.0175, 4); // 70 / (4000 * 100) * 100
    });

    it('sets 100% shards for golden cards', () => {
      const goldenReveal = { ...mockReveal, is_golden: true };
      const card = mapRevealToCollectCard(goldenReveal);
      expect(card).not.toBeNull();
      if (!card) return;
      expect(card.rewards?.progress.shards_earned).toBe(100);
    });

    it('includes prize info for award reveals', () => {
      const awardReveal = { ...mockReveal, is_award: true };
      const card = mapRevealToCollectCard(awardReveal);
      expect(card).not.toBeNull();
      if (!card) return;
      expect(card.rewards?.prize).toBeDefined();
      expect(card.rewards?.prize?.redeemable).toBe(true);
    });

    it('returns null when product_classes is missing', () => {
      const revealWithoutProduct = { ...mockReveal, product_classes: undefined };
      const card = mapRevealToCollectCard(revealWithoutProduct as RevealRow);
      expect(card).toBeNull();
    });
  });

  describe('mapFreePullRevealToCard', () => {
    const mockFreePull: FreePullReveal = {
      id: '550e8400-e29b-41d4-a716-446655440001',
      band: 'ICON',
      is_golden: false,
      is_award: false,
      credits_awarded: 200,
      serial_number: '0002/10000',
      product: {
        id: 'product-456',
        brand: 'FreeBrand',
        model: 'FreeModel',
        image_url: '/free-image.png',
        retail_value_usd: 500,
      },
    };

    it('maps free pull reveal correctly', () => {
      const card = mapFreePullRevealToCard(mockFreePull);
      expect(card).not.toBeNull();
      if (!card) return;

      expect(card.card_id).toBe(mockFreePull.id);
      expect(card.brand).toBe('FreeBrand');
      expect(card.model).toBe('FreeModel');
      expect(card.product_value).toBe(500);
    });

    it('sets 100% shards for award free pulls', () => {
      const awardPull = { ...mockFreePull, is_award: true };
      const card = mapFreePullRevealToCard(awardPull);
      expect(card).not.toBeNull();
      if (!card) return;
      expect(card.rewards?.progress.shards_earned).toBe(100);
    });

    it('sets 0% shards for non-award free pulls', () => {
      const card = mapFreePullRevealToCard(mockFreePull);
      expect(card).not.toBeNull();
      if (!card) return;
      expect(card.rewards?.progress.shards_earned).toBe(0);
    });

    it('returns null when product is missing', () => {
      const pullWithoutProduct = { ...mockFreePull, product: undefined };
      const card = mapFreePullRevealToCard(pullWithoutProduct as FreePullReveal);
      expect(card).toBeNull();
    });
  });
});
