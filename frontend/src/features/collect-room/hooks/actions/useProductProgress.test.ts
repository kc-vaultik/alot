import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useProductProgress } from './useProductProgress';
import type { CollectCard, DesignTraits } from '../../types';

const createMockCard = (overrides: Partial<CollectCard> = {}): CollectCard => ({
  card_id: `card-${Math.random().toString(36).slice(2)}`,
  product_reveal: 'Test Product',
  brand: 'TestBrand',
  model: 'TestModel',
  product_image: '/test.jpg',
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
  } as DesignTraits,
  serial_number: '0001/10000',
  rewards: {
    points: 100,
    rewards: [],
    progress: {
      shards_earned: 10,
      product_key: 'testbrand-testmodel',
    },
  },
  // Room Stats
  priority_points: 0,
  redeem_credits_cents: 0,
  card_state: 'owned',
  staked_room_id: null,
  band: 'RARE',
  ...overrides,
});

describe('useProductProgress', () => {
  it('returns empty array for empty collection', () => {
    const { result } = renderHook(() => useProductProgress([]));
    expect(result.current).toEqual([]);
  });

  it('aggregates single card correctly', () => {
    const card = createMockCard();
    const { result } = renderHook(() => useProductProgress([card]));

    expect(result.current).toHaveLength(1);
    expect(result.current[0]).toMatchObject({
      productKey: 'testbrand-testmodel',
      brand: 'TestBrand',
      model: 'TestModel',
      totalShards: 10,
      cardCount: 1,
      isRedeemable: false,
    });
  });

  it('aggregates multiple cards of same product', () => {
    const cards = [
      createMockCard({ rewards: { points: 50, rewards: [], progress: { shards_earned: 30, product_key: 'rolex-submariner' } } }),
      createMockCard({ rewards: { points: 75, rewards: [], progress: { shards_earned: 40, product_key: 'rolex-submariner' } } }),
    ];
    const { result } = renderHook(() => useProductProgress(cards));

    expect(result.current).toHaveLength(1);
    expect(result.current[0].totalShards).toBe(70);
    expect(result.current[0].cardCount).toBe(2);
    expect(result.current[0].totalPoints).toBe(125);
  });

  it('marks product as redeemable at 100 shards', () => {
    const cards = [
      createMockCard({ rewards: { points: 0, rewards: [], progress: { shards_earned: 60, product_key: 'test-product' } } }),
      createMockCard({ rewards: { points: 0, rewards: [], progress: { shards_earned: 45, product_key: 'test-product' } } }),
    ];
    const { result } = renderHook(() => useProductProgress(cards));

    expect(result.current[0].totalShards).toBe(105);
    expect(result.current[0].isRedeemable).toBe(true);
  });

  it('groups different products separately', () => {
    const cards = [
      createMockCard({ brand: 'Rolex', model: 'Submariner', rewards: { points: 0, rewards: [], progress: { shards_earned: 20, product_key: 'rolex-submariner' } } }),
      createMockCard({ brand: 'Patek', model: 'Nautilus', rewards: { points: 0, rewards: [], progress: { shards_earned: 30, product_key: 'patek-nautilus' } } }),
    ];
    const { result } = renderHook(() => useProductProgress(cards));

    expect(result.current).toHaveLength(2);
    expect(result.current.map(p => p.productKey)).toContain('rolex-submariner');
    expect(result.current.map(p => p.productKey)).toContain('patek-nautilus');
  });

  it('sorts by highest shards first', () => {
    const cards = [
      createMockCard({ rewards: { points: 0, rewards: [], progress: { shards_earned: 10, product_key: 'low-product' } } }),
      createMockCard({ rewards: { points: 0, rewards: [], progress: { shards_earned: 50, product_key: 'high-product' } } }),
      createMockCard({ rewards: { points: 0, rewards: [], progress: { shards_earned: 30, product_key: 'mid-product' } } }),
    ];
    const { result } = renderHook(() => useProductProgress(cards));

    expect(result.current[0].productKey).toBe('high-product');
    expect(result.current[1].productKey).toBe('mid-product');
    expect(result.current[2].productKey).toBe('low-product');
  });

  it('prioritizes golden cards for display', () => {
    const regularCard = createMockCard({ 
      card_id: 'regular',
      is_golden: false, 
      rewards: { points: 0, rewards: [], progress: { shards_earned: 10, product_key: 'test' } } 
    });
    const goldenCard = createMockCard({ 
      card_id: 'golden',
      is_golden: true, 
      rewards: { points: 0, rewards: [], progress: { shards_earned: 10, product_key: 'test' } } 
    });
    
    const { result } = renderHook(() => useProductProgress([regularCard, goldenCard]));

    expect(result.current[0].hasGolden).toBe(true);
    expect(result.current[0].goldenCard?.card_id).toBe('golden');
    expect(result.current[0].displayCard.card_id).toBe('golden');
  });

  it('tracks prizes from cards', () => {
    const cardWithPrize = createMockCard({
      rewards: {
        points: 100,
        rewards: [],
        progress: { shards_earned: 10, product_key: 'prize-product' },
        prize: { name: 'Instant Win', description: 'You won!', redeemable: true },
      },
    });
    const { result } = renderHook(() => useProductProgress([cardWithPrize]));

    expect(result.current[0].hasPrize).toBe(true);
  });

  it('handles cards without rewards gracefully', () => {
    const cardNoRewards = createMockCard({ rewards: undefined });
    const { result } = renderHook(() => useProductProgress([cardNoRewards]));

    expect(result.current).toHaveLength(1);
    expect(result.current[0].totalShards).toBe(0);
    expect(result.current[0].totalPoints).toBe(0);
  });

  it('generates product key from brand/model when missing', () => {
    const card = createMockCard({
      brand: 'Hermès',
      model: 'Birkin 25',
      rewards: {
        points: 0,
        rewards: [],
        progress: { shards_earned: 10, product_key: '' },
      },
    });
    // When product_key is empty, it should fallback to brand-model
    const { result } = renderHook(() => useProductProgress([card]));
    
    expect(result.current[0].productKey).toBe('hermès-birkin-25');
  });

  it('stores all cards in the cards array', () => {
    const cards = [
      createMockCard({ card_id: '1', rewards: { points: 0, rewards: [], progress: { shards_earned: 10, product_key: 'same' } } }),
      createMockCard({ card_id: '2', rewards: { points: 0, rewards: [], progress: { shards_earned: 20, product_key: 'same' } } }),
      createMockCard({ card_id: '3', rewards: { points: 0, rewards: [], progress: { shards_earned: 30, product_key: 'same' } } }),
    ];
    const { result } = renderHook(() => useProductProgress(cards));

    expect(result.current[0].cards).toHaveLength(3);
  });
});
