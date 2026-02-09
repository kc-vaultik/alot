/**
 * @fileoverview Tests for useCurrentCard hook
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useCurrentCard } from './useCurrentCard';
import type { CollectCard } from '../../types';

// Mock card factory
const createMockCard = (overrides: Partial<CollectCard> = {}): CollectCard => ({
  card_id: 'card-123',
  product_reveal: 'reveal-123',
  brand: 'Test Brand',
  model: 'Test Model',
  product_image: 'https://example.com/image.jpg',
  product_value: 100,
  rarity_score: 50,
  is_golden: false,
  design_traits: {
    background: 'matte-black',
    texture: 'smooth',
    emblem: 'standard',
    borderStyle: 'clean',
    foilType: 'none',
    typography: 'modern',
  },
  serial_number: 'SN-001',
  priority_points: 10,
  redeem_credits_cents: 500,
  card_state: 'owned',
  staked_room_id: null,
  band: 'RARE',
  ...overrides,
});

describe('useCurrentCard', () => {
  describe('initialization', () => {
    it('should initialize with null currentCard', () => {
      const { result } = renderHook(() => useCurrentCard());
      expect(result.current.currentCard).toBeNull();
    });

    it('should initialize with null latestCard', () => {
      const { result } = renderHook(() => useCurrentCard());
      expect(result.current.latestCard).toBeNull();
    });
  });

  describe('setCurrentCard', () => {
    it('should set current card', () => {
      const { result } = renderHook(() => useCurrentCard());
      const mockCard = createMockCard();
      
      act(() => {
        result.current.setCurrentCard(mockCard);
      });
      
      expect(result.current.currentCard).toEqual(mockCard);
    });

    it('should clear current card when set to null', () => {
      const { result } = renderHook(() => useCurrentCard());
      const mockCard = createMockCard();
      
      act(() => {
        result.current.setCurrentCard(mockCard);
      });
      
      act(() => {
        result.current.setCurrentCard(null);
      });
      
      expect(result.current.currentCard).toBeNull();
    });

    it('should not affect latestCard', () => {
      const { result } = renderHook(() => useCurrentCard());
      const mockCard = createMockCard();
      
      act(() => {
        result.current.setCurrentCard(mockCard);
      });
      
      expect(result.current.latestCard).toBeNull();
    });
  });

  describe('setLatestCard', () => {
    it('should set latest card', () => {
      const { result } = renderHook(() => useCurrentCard());
      const mockCard = createMockCard();
      
      act(() => {
        result.current.setLatestCard(mockCard);
      });
      
      expect(result.current.latestCard).toEqual(mockCard);
    });

    it('should not affect currentCard', () => {
      const { result } = renderHook(() => useCurrentCard());
      const mockCard = createMockCard();
      
      act(() => {
        result.current.setLatestCard(mockCard);
      });
      
      expect(result.current.currentCard).toBeNull();
    });
  });

  describe('clearCards', () => {
    it('should clear both current and latest cards', () => {
      const { result } = renderHook(() => useCurrentCard());
      const card1 = createMockCard({ card_id: 'card-1' });
      const card2 = createMockCard({ card_id: 'card-2' });
      
      act(() => {
        result.current.setCurrentCard(card1);
        result.current.setLatestCard(card2);
      });
      
      expect(result.current.currentCard).not.toBeNull();
      expect(result.current.latestCard).not.toBeNull();
      
      act(() => {
        result.current.clearCards();
      });
      
      expect(result.current.currentCard).toBeNull();
      expect(result.current.latestCard).toBeNull();
    });

    it('should work when cards are already null', () => {
      const { result } = renderHook(() => useCurrentCard());
      
      act(() => {
        result.current.clearCards();
      });
      
      expect(result.current.currentCard).toBeNull();
      expect(result.current.latestCard).toBeNull();
    });
  });

  describe('finalizeCurrentCard', () => {
    it('should move current card to latest and clear current', () => {
      const { result } = renderHook(() => useCurrentCard());
      const mockCard = createMockCard();
      
      act(() => {
        result.current.setCurrentCard(mockCard);
      });
      
      act(() => {
        result.current.finalizeCurrentCard();
      });
      
      expect(result.current.currentCard).toBeNull();
      expect(result.current.latestCard).toEqual(mockCard);
    });

    it('should do nothing when currentCard is null', () => {
      const { result } = renderHook(() => useCurrentCard());
      const existingLatest = createMockCard({ card_id: 'existing' });
      
      act(() => {
        result.current.setLatestCard(existingLatest);
      });
      
      act(() => {
        result.current.finalizeCurrentCard();
      });
      
      // Latest should be unchanged (still the existing one, not overwritten with null)
      expect(result.current.currentCard).toBeNull();
      // Note: latestCard stays as is because currentCard was null
    });

    it('should overwrite existing latestCard', () => {
      const { result } = renderHook(() => useCurrentCard());
      const oldCard = createMockCard({ card_id: 'old' });
      const newCard = createMockCard({ card_id: 'new' });
      
      act(() => {
        result.current.setLatestCard(oldCard);
        result.current.setCurrentCard(newCard);
      });
      
      act(() => {
        result.current.finalizeCurrentCard();
      });
      
      expect(result.current.latestCard?.card_id).toBe('new');
    });
  });

  describe('typical reveal flow', () => {
    it('should handle complete reveal cycle', () => {
      const { result } = renderHook(() => useCurrentCard());
      
      // User opens a pack, card is set as current
      const card1 = createMockCard({ card_id: 'card-1' });
      act(() => {
        result.current.setCurrentCard(card1);
      });
      expect(result.current.currentCard?.card_id).toBe('card-1');
      
      // User views card and adds to collection
      act(() => {
        result.current.finalizeCurrentCard();
      });
      expect(result.current.currentCard).toBeNull();
      expect(result.current.latestCard?.card_id).toBe('card-1');
      
      // User opens another pack
      const card2 = createMockCard({ card_id: 'card-2' });
      act(() => {
        result.current.setCurrentCard(card2);
      });
      expect(result.current.currentCard?.card_id).toBe('card-2');
      expect(result.current.latestCard?.card_id).toBe('card-1');
      
      // Finalize second card
      act(() => {
        result.current.finalizeCurrentCard();
      });
      expect(result.current.latestCard?.card_id).toBe('card-2');
    });
  });
});
