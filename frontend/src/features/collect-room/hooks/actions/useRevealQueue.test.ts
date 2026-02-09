import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRevealQueue } from './useRevealQueue';
import type { CollectCard } from '../../types';

// Helper to create mock cards
function createMockCard(id: string, overrides: Partial<CollectCard> = {}): CollectCard {
  return {
    card_id: id,
    product_reveal: 'Test Product',
    brand: 'TestBrand',
    model: 'TestModel',
    product_image: '/test.png',
    product_value: 1000,
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
    serial_number: '0001/10000',
    // Room Stats
    priority_points: 0,
    redeem_credits_cents: 0,
    card_state: 'owned',
    staked_room_id: null,
    band: 'RARE',
    ...overrides,
  };
}

// Valid UUID for testing
const VALID_UUID_1 = '550e8400-e29b-41d4-a716-446655440000';
const VALID_UUID_2 = '550e8400-e29b-41d4-a716-446655440001';
const VALID_UUID_3 = '550e8400-e29b-41d4-a716-446655440002';
const INVALID_ID = 'demo-golden-123';

describe('useRevealQueue', () => {
  describe('initial state', () => {
    it('starts with empty queue', () => {
      const { result } = renderHook(() => useRevealQueue());

      expect(result.current.queueLength).toBe(0);
      expect(result.current.hasCardsToReveal).toBe(false);
    });
  });

  describe('addToQueue', () => {
    it('adds valid cards to the queue', () => {
      const { result } = renderHook(() => useRevealQueue());
      const card = createMockCard(VALID_UUID_1);

      act(() => {
        result.current.addToQueue([card]);
      });

      expect(result.current.queueLength).toBe(1);
      expect(result.current.hasCardsToReveal).toBe(true);
    });

    it('filters out cards with invalid IDs', () => {
      const { result } = renderHook(() => useRevealQueue());
      const validCard = createMockCard(VALID_UUID_1);
      const invalidCard = createMockCard(INVALID_ID);

      act(() => {
        result.current.addToQueue([validCard, invalidCard]);
      });

      expect(result.current.queueLength).toBe(1);
    });

    it('does not add already processed cards', () => {
      const { result } = renderHook(() => useRevealQueue());
      const card = createMockCard(VALID_UUID_1);

      act(() => {
        result.current.markAsProcessed(VALID_UUID_1);
        result.current.addToQueue([card]);
      });

      expect(result.current.queueLength).toBe(0);
    });

    it('appends to existing queue', () => {
      const { result } = renderHook(() => useRevealQueue());
      const card1 = createMockCard(VALID_UUID_1);
      const card2 = createMockCard(VALID_UUID_2);

      act(() => {
        result.current.addToQueue([card1]);
      });

      act(() => {
        result.current.addToQueue([card2]);
      });

      expect(result.current.queueLength).toBe(2);
    });
  });

  describe('setQueue', () => {
    it('replaces the entire queue', () => {
      const { result } = renderHook(() => useRevealQueue());
      const card1 = createMockCard(VALID_UUID_1);
      const card2 = createMockCard(VALID_UUID_2);
      const card3 = createMockCard(VALID_UUID_3);

      act(() => {
        result.current.addToQueue([card1, card2]);
      });

      expect(result.current.queueLength).toBe(2);

      act(() => {
        result.current.setQueue([card3]);
      });

      expect(result.current.queueLength).toBe(1);
    });

    it('filters invalid cards when setting queue', () => {
      const { result } = renderHook(() => useRevealQueue());
      const validCard = createMockCard(VALID_UUID_1);
      const invalidCard = createMockCard(INVALID_ID);

      act(() => {
        result.current.setQueue([validCard, invalidCard]);
      });

      expect(result.current.queueLength).toBe(1);
    });
  });

  describe('getNextCard', () => {
    it('returns and removes the first card', () => {
      const { result } = renderHook(() => useRevealQueue());
      const card1 = createMockCard(VALID_UUID_1);
      const card2 = createMockCard(VALID_UUID_2);

      act(() => {
        result.current.addToQueue([card1, card2]);
      });

      let nextCard: CollectCard | undefined;
      act(() => {
        nextCard = result.current.getNextCard();
      });

      expect(nextCard?.card_id).toBe(VALID_UUID_1);
      expect(result.current.queueLength).toBe(1);
    });

    it('returns undefined for empty queue', () => {
      const { result } = renderHook(() => useRevealQueue());

      let nextCard: CollectCard | undefined;
      act(() => {
        nextCard = result.current.getNextCard();
      });

      expect(nextCard).toBeUndefined();
    });

    it('processes cards in FIFO order', () => {
      const { result } = renderHook(() => useRevealQueue());
      const card1 = createMockCard(VALID_UUID_1);
      const card2 = createMockCard(VALID_UUID_2);
      const card3 = createMockCard(VALID_UUID_3);

      act(() => {
        result.current.addToQueue([card1, card2, card3]);
      });

      const cards: string[] = [];
      act(() => {
        cards.push(result.current.getNextCard()?.card_id ?? '');
        cards.push(result.current.getNextCard()?.card_id ?? '');
        cards.push(result.current.getNextCard()?.card_id ?? '');
      });

      expect(cards).toEqual([VALID_UUID_1, VALID_UUID_2, VALID_UUID_3]);
    });
  });

  describe('markAsProcessed', () => {
    it('marks card ID as processed', () => {
      const { result } = renderHook(() => useRevealQueue());

      act(() => {
        result.current.markAsProcessed(VALID_UUID_1);
      });

      expect(result.current.isProcessed(VALID_UUID_1)).toBe(true);
    });

    it('does not affect other card IDs', () => {
      const { result } = renderHook(() => useRevealQueue());

      act(() => {
        result.current.markAsProcessed(VALID_UUID_1);
      });

      expect(result.current.isProcessed(VALID_UUID_2)).toBe(false);
    });
  });

  describe('isInQueue', () => {
    it('returns true for cards in queue', () => {
      const { result } = renderHook(() => useRevealQueue());
      const card = createMockCard(VALID_UUID_1);

      act(() => {
        result.current.addToQueue([card]);
      });

      expect(result.current.isInQueue(VALID_UUID_1)).toBe(true);
    });

    it('returns false for cards not in queue', () => {
      const { result } = renderHook(() => useRevealQueue());

      expect(result.current.isInQueue(VALID_UUID_1)).toBe(false);
    });

    it('returns false after card is removed', () => {
      const { result } = renderHook(() => useRevealQueue());
      const card = createMockCard(VALID_UUID_1);

      act(() => {
        result.current.addToQueue([card]);
      });

      act(() => {
        result.current.getNextCard();
      });

      expect(result.current.isInQueue(VALID_UUID_1)).toBe(false);
    });
  });

  describe('clearQueue', () => {
    it('removes all cards from queue', () => {
      const { result } = renderHook(() => useRevealQueue());
      const card1 = createMockCard(VALID_UUID_1);
      const card2 = createMockCard(VALID_UUID_2);

      act(() => {
        result.current.addToQueue([card1, card2]);
      });

      expect(result.current.queueLength).toBe(2);

      act(() => {
        result.current.clearQueue();
      });

      expect(result.current.queueLength).toBe(0);
      expect(result.current.hasCardsToReveal).toBe(false);
    });

    it('does not clear processed IDs', () => {
      const { result } = renderHook(() => useRevealQueue());

      act(() => {
        result.current.markAsProcessed(VALID_UUID_1);
        result.current.clearQueue();
      });

      expect(result.current.isProcessed(VALID_UUID_1)).toBe(true);
    });
  });

  describe('hasCardsToReveal', () => {
    it('updates reactively with queue changes', () => {
      const { result } = renderHook(() => useRevealQueue());
      const card = createMockCard(VALID_UUID_1);

      expect(result.current.hasCardsToReveal).toBe(false);

      act(() => {
        result.current.addToQueue([card]);
      });

      expect(result.current.hasCardsToReveal).toBe(true);

      act(() => {
        result.current.getNextCard();
      });

      expect(result.current.hasCardsToReveal).toBe(false);
    });
  });
});
