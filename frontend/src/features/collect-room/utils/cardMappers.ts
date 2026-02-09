/**
 * @fileoverview Card Mapping Utilities
 * Transforms database records (RevealRow, FreePullReveal) into CollectCard objects
 * for use throughout the collect-room feature.
 * 
 * @module features/collect-room/utils/cardMappers
 */

import { logger } from '@/utils/logger';
import { PATTERNS } from '@/constants';
import { RARITY_SCORES, RARITY_BANDS } from '../constants';
import type {
  CollectCard,
  RevealRow,
  DesignTraits,
  RarityTier,
  RarityBand,
  CardState,
  FreePullReveal,
} from '../types';
import { getRarityTier } from '@/utils/styling';

// ============= Design Traits by Band =============

/**
 * Design traits configuration mapped by rarity band.
 * Defines the visual properties (background, texture, emblem, etc.) for each tier of card.
 * @constant
 */
const DESIGN_TRAITS_MAP: Record<RarityBand, DesignTraits> = {
  MYTHIC: {
    background: 'obsidian',
    texture: 'holographic',
    emblem: 'prismatic',
    borderStyle: 'radiant',
    foilType: 'full',
    typography: 'display',
  },
  GRAIL: {
    background: 'midnight-blue',
    texture: 'hammered',
    emblem: 'gilt',
    borderStyle: 'ornate',
    foilType: 'accent',
    typography: 'luxury',
  },
  RARE: {
    background: 'deep-charcoal',
    texture: 'brushed',
    emblem: 'embossed',
    borderStyle: 'beveled',
    foilType: 'subtle',
    typography: 'classic',
  },
  ICON: {
    background: 'matte-black',
    texture: 'smooth',
    emblem: 'standard',
    borderStyle: 'clean',
    foilType: 'none',
    typography: 'modern',
  },
};

// ============= Rewards by Tier =============

/**
 * Game-native perks mapped by rarity tier.
 * Higher tiers unlock progressively more perks. Golden cards have maximum rewards.
 * @constant
 */
const REWARDS_MAP: Record<RarityTier | 'golden', string[]> = {
  icon: ['Cooldown -10%'],
  rare: ['Cooldown -15%', 'Trade fee reduced'],
  grail: ['Cooldown -20%', 'Trade fee reduced', 'Claim Power +10%'],
  mythic: ['Cooldown -25%', 'Trade fee reduced', 'Claim Power +15%', '+1 daily free pack', 'Room entry fee reduced'],
  golden: ['+2 daily free packs', 'Room entry fee waived', 'Claim Power +25%', 'Trade fee waived', 'Cooldown -50%'],
};

// ============= Utility Functions =============

/**
 * Converts a rarity band string to its numeric score.
 * @param band - The rarity band (e.g., 'MYTHIC', 'GRAIL', 'RARE', 'ICON')
 * @returns The numeric rarity score, defaults to ICON score if band is invalid
 * @example
 * bandToRarityScore('MYTHIC') // Returns 100
 * bandToRarityScore('ICON')   // Returns 25
 */
export function bandToRarityScore(band: string): number {
  return RARITY_SCORES[band as RarityBand] ?? RARITY_SCORES[RARITY_BANDS.ICON];
}

/**
 * Gets the visual design configuration for a given rarity band.
 * @param band - The rarity band string
 * @returns Design traits object with background, texture, emblem, border, foil, and typography settings
 * @example
 * getDesignTraitsForBand('GRAIL')
 * // Returns { background: 'midnight-blue', texture: 'hammered', ... }
 */
export function getDesignTraitsForBand(band: string): DesignTraits {
  return DESIGN_TRAITS_MAP[band as RarityBand] ?? DESIGN_TRAITS_MAP[RARITY_BANDS.ICON];
}

/**
 * Gets the list of game rewards/perks for a given rarity tier.
 * @param tier - The rarity tier ('icon', 'rare', 'grail', 'mythic')
 * @param isGolden - Whether the card is golden (unlocks maximum rewards)
 * @returns Array of reward strings (returns a copy to prevent mutation)
 * @example
 * getRewardsForTier('rare', false)  // Returns ['Cooldown -15%', 'Trade fee reduced']
 * getRewardsForTier('icon', true)   // Returns golden rewards array
 */
export function getRewardsForTier(tier: RarityTier, isGolden: boolean): string[] {
  if (isGolden) return [...REWARDS_MAP.golden];
  return [...REWARDS_MAP[tier]];
}

/**
 * Calculates shard progress percentage toward product redemption.
 * @param productCredits - Credits accumulated toward this product
 * @param fulfillmentCost - The product's fulfillment cost in USD
 * @returns Progress percentage (0-100), capped at 100
 * @example
 * calculateShards(50, 1)   // Returns 50 (50% progress)
 * calculateShards(150, 1)  // Returns 100 (capped at 100%)
 * calculateShards(10, 0)   // Returns 0 (invalid fulfillment cost)
 */
export function calculateShards(productCredits: number, fulfillmentCost: number): number {
  if (fulfillmentCost <= 0) return 0;
  const creditsNeeded = fulfillmentCost * 100;
  return Math.min(100, (productCredits / creditsNeeded) * 100);
}

/**
 * Validates whether a string is a valid UUID format.
 * @param id - The string to validate
 * @returns True if the string matches UUID pattern
 * @example
 * isValidUUID('123e4567-e89b-12d3-a456-426614174000') // Returns true
 * isValidUUID('not-a-uuid') // Returns false
 */
export function isValidUUID(id: string): boolean {
  return PATTERNS.UUID.test(id);
}

// ============= Card Mappers =============

/**
 * Transforms a database reveal row (with joined product_classes) into a CollectCard.
 * This is the primary mapper for reveals fetched from the database.
 * 
 * @param reveal - The reveal row from database query with product_classes relation
 * @returns A fully populated CollectCard object, or null if product data is missing
 * @example
 * const reveals = await supabase.from('reveals').select('*, product_classes(*)');
 * const cards = reveals.data?.map(mapRevealToCollectCard).filter(Boolean);
 */
export function mapRevealToCollectCard(reveal: RevealRow): CollectCard | null {
  const { product_classes: product } = reveal;

  // Skip reveals with missing product data
  if (!product) {
    logger.warn(
      'mapRevealToCollectCard: Missing product_classes for reveal:',
      reveal.id,
      '- This may be due to inactive product class or RLS policy blocking access'
    );
    return null;
  }

  const rarityScore = bandToRarityScore(reveal.band);
  const tier = getRarityTier(rarityScore);
  const rewards = getRewardsForTier(tier, reveal.is_golden);

  return {
    card_id: reveal.id,
    product_reveal: `${product.brand} ${product.model}`,
    brand: product.brand,
    model: product.model,
    product_image: product.image_url ?? '',
    product_value: product.retail_value_usd,
    rarity_score: rarityScore,
    is_golden: reveal.is_golden,
    design_traits: getDesignTraitsForBand(reveal.band),
    serial_number: reveal.serial_number,
    owner_id: reveal.user_id,
    pulled_at: reveal.created_at,
    rewards: {
      points: reveal.credits_awarded,
      rewards,
      progress: {
        shards_earned: reveal.is_golden
          ? 100
          : calculateShards(reveal.product_credits_awarded, product.expected_fulfillment_cost_usd),
        product_key: product.id,
      },
      prize: reveal.is_award
        ? {
            name: reveal.is_golden ? 'Instant Redemption' : 'Product Win',
            description: 'You won the actual product!',
            redeemable: true,
          }
        : undefined,
    },
    // Room Stats
    priority_points: reveal.priority_points ?? 0,
    redeem_credits_cents: reveal.redeem_credits_cents ?? 0,
    card_state: (reveal.card_state as CardState) ?? 'owned',
    staked_room_id: reveal.staked_room_id ?? null,
    band: reveal.band,
    // Product metadata
    product_description: product.description ?? null,
    traits: product.traits ?? [],
  };
}

/**
 * Transforms a free pull reveal response into a CollectCard.
 * Used specifically for the daily free pull feature where the response format differs.
 * 
 * @param reveal - The free pull reveal response from the process_daily_free_pull RPC
 * @returns A CollectCard object with default room stats, or null if product data is missing
 * @example
 * const { data } = await supabase.rpc('process_daily_free_pull', { p_user_id: userId });
 * const card = mapFreePullRevealToCard(data.reveal);
 */
export function mapFreePullRevealToCard(reveal: FreePullReveal): CollectCard | null {
  const { product } = reveal;

  // Skip reveals with missing product data
  if (!product) {
    logger.warn('mapFreePullRevealToCard: Missing product for reveal:', reveal.id);
    return null;
  }

  const rarityScore = bandToRarityScore(reveal.band);
  const tier = getRarityTier(rarityScore);
  const rewards = getRewardsForTier(tier, reveal.is_golden);

  return {
    card_id: reveal.id,
    product_reveal: `${product.brand} ${product.model}`,
    brand: product.brand,
    model: product.model,
    product_image: product.image_url ?? '',
    product_value: product.retail_value_usd,
    rarity_score: rarityScore,
    is_golden: reveal.is_golden,
    design_traits: getDesignTraitsForBand(reveal.band),
    serial_number: reveal.serial_number,
    rewards: {
      points: reveal.credits_awarded,
      rewards,
      progress: {
        shards_earned: reveal.is_award ? 100 : 0,
        product_key: product.id,
      },
      prize: reveal.is_award
        ? {
            name: 'Free Pull Win!',
            description: 'You won the actual product!',
            redeemable: true,
          }
        : undefined,
    },
    // Room Stats - Free pulls start with default values
    priority_points: 0,
    redeem_credits_cents: 0,
    card_state: 'owned' as CardState,
    staked_room_id: null,
    band: reveal.band,
    // Product metadata - not available from free pull response
    product_description: null,
    traits: [],
  };
}

// Display formatters re-exported from formatters.ts for backward compatibility
export { formatDigitalNumber, getExpireDate } from './formatters';
