/**
 * @fileoverview Demo card utilities for development testing.
 */

import type { CollectCard } from '../types';

/**
 * Creates a demo golden card for testing the golden reveal flow.
 * Only available in development mode.
 */
export function createDemoGoldenCard(): CollectCard {
  return {
    card_id: `demo-golden-${Date.now()}`,
    product_reveal: 'Demo Golden Card',
    brand: 'Hermès',
    model: 'Birkin 30',
    product_image: '',
    product_value: 25000,
    rarity_score: 99,
    is_golden: true,
    design_traits: {
      background: 'obsidian',
      texture: 'holographic',
      emblem: 'prismatic',
      borderStyle: 'radiant',
      foilType: 'full',
      typography: 'display',
    },
    serial_number: '0001/10000',
    rewards: {
      points: 500,
      rewards: ['VIP Event Access', 'Exclusive Drop Priority', 'Lifetime Warranty'],
      progress: { shards_earned: 100, product_key: 'demo-birkin' },
      prize: { name: 'Instant Redemption', description: 'Congratulations!', redeemable: true },
    },
    priority_points: 0,
    redeem_credits_cents: 0,
    card_state: 'owned',
    staked_room_id: null,
    band: 'MYTHIC',
  };
}
