/**
 * @fileoverview Tests for card generation utilities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  generateRandomCard, 
  generateDemoCollection, 
  generateMarketplaceCards,
  getDesignTraits,
} from './cardGeneration';

describe('getDesignTraits', () => {
  describe('mythic tier (score >= 95)', () => {
    it('should return holographic obsidian design for score 95', () => {
      const traits = getDesignTraits(95);
      expect(traits.background).toBe('obsidian');
      expect(traits.texture).toBe('holographic');
      expect(traits.foilType).toBe('full');
    });

    it('should return mythic design for score 100', () => {
      const traits = getDesignTraits(100);
      expect(traits.emblem).toBe('prismatic');
      expect(traits.borderStyle).toBe('radiant');
    });
  });

  describe('grail tier (score >= 80)', () => {
    it('should return gilt midnight design for score 80', () => {
      const traits = getDesignTraits(80);
      expect(traits.background).toBe('midnight-blue');
      expect(traits.texture).toBe('hammered');
      expect(traits.emblem).toBe('gilt');
    });

    it('should return grail design for score 94', () => {
      const traits = getDesignTraits(94);
      expect(traits.foilType).toBe('accent');
      expect(traits.typography).toBe('luxury');
    });
  });

  describe('rare tier (score >= 50)', () => {
    it('should return brushed charcoal design for score 50', () => {
      const traits = getDesignTraits(50);
      expect(traits.background).toBe('deep-charcoal');
      expect(traits.texture).toBe('brushed');
    });

    it('should return rare design for score 79', () => {
      const traits = getDesignTraits(79);
      expect(traits.foilType).toBe('subtle');
      expect(traits.borderStyle).toBe('beveled');
    });
  });

  describe('icon tier (score < 50)', () => {
    it('should return matte design for score 49', () => {
      const traits = getDesignTraits(49);
      expect(traits.background).toBe('matte-black');
      expect(traits.texture).toBe('smooth');
    });

    it('should return standard design for score 0', () => {
      const traits = getDesignTraits(0);
      expect(traits.foilType).toBe('none');
      expect(traits.emblem).toBe('standard');
    });
  });
});

describe('generateRandomCard', () => {
  it('should generate a card with required properties', () => {
    const card = generateRandomCard();
    
    expect(card.card_id).toBeDefined();
    expect(card.brand).toBeDefined();
    expect(card.model).toBeDefined();
    expect(card.rarity_score).toBeGreaterThanOrEqual(0);
    expect(card.design_traits).toBeDefined();
    expect(card.serial_number).toMatch(/^\d{4}\/10000$/);
  });

  it('should generate a golden card when forceGolden is true', () => {
    const card = generateRandomCard(true);
    expect(card.is_golden).toBe(true);
  });

  it('should include rewards object', () => {
    const card = generateRandomCard();
    expect(card.rewards).toBeDefined();
    expect(card.rewards.points).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(card.rewards.rewards)).toBe(true);
  });

  it('should have correct band based on rarity score', () => {
    // Run multiple times to test different rarity distributions
    for (let i = 0; i < 10; i++) {
      const card = generateRandomCard();
      
      if (card.rarity_score >= 95) {
        expect(card.band).toBe('MYTHIC');
      } else if (card.rarity_score >= 80) {
        expect(card.band).toBe('GRAIL');
      } else if (card.rarity_score >= 50) {
        expect(card.band).toBe('RARE');
      } else {
        expect(card.band).toBe('ICON');
      }
    }
  });
});

describe('generateDemoCollection', () => {
  it('should generate default 5 cards', () => {
    const collection = generateDemoCollection();
    expect(collection).toHaveLength(5);
  });

  it('should generate specified number of cards', () => {
    const collection = generateDemoCollection(10);
    expect(collection).toHaveLength(10);
  });

  it('should generate unique cards', () => {
    const collection = generateDemoCollection(5);
    const ids = collection.map(c => c.card_id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(5);
  });
});

describe('generateMarketplaceCards', () => {
  it('should generate default 12 cards', () => {
    const listings = generateMarketplaceCards();
    expect(listings).toHaveLength(12);
  });

  it('should generate specified number of listings', () => {
    const listings = generateMarketplaceCards(5);
    expect(listings).toHaveLength(5);
  });

  it('should have marketplace-specific properties', () => {
    const listings = generateMarketplaceCards(1);
    const listing = listings[0];
    
    expect(listing.listing_type).toMatch(/^(GIFT|SWAP)$/);
    expect(listing.transfer_id).toBeDefined();
    expect(listing.from_username).toBeDefined();
    expect(listing.listed_at).toBeDefined();
    expect(listing.expires_at).toBeDefined();
  });

  it('should have mix of gift and swap listings', () => {
    // Generate enough to statistically have both types
    const listings = generateMarketplaceCards(50);
    const gifts = listings.filter(l => l.listing_type === 'GIFT');
    const swaps = listings.filter(l => l.listing_type === 'SWAP');
    
    expect(gifts.length).toBeGreaterThan(0);
    expect(swaps.length).toBeGreaterThan(0);
  });
});
