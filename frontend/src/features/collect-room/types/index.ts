/**
 * @fileoverview Types for the Collect Room feature.
 * 
 * @description Defines all TypeScript interfaces and types used throughout
 * the collect room feature, including cards, rewards, progress tracking,
 * and database entities.
 * 
 * @module features/collect-room/types
 * 
 * @example
 * // Import types
 * import type { CollectCard, CreditsData, FreePullStatus } from '@/features/collect-room/types';
 * 
 * // Use in component
 * function CardDisplay({ card }: { card: CollectCard }) {
 *   return <div>{card.brand} - {card.model}</div>;
 * }
 */

import type { RarityBand, RarityTier, CardState, PricingTier } from '@/types/shared';

// Re-export types that are used by this feature's public API
export type { RarityBand, RarityTier, CardState, PricingTier };
// CreditsData and ProductCredit are defined locally in this file - no need to re-export from @/types

// ============= Screen & UI Types =============

/** Possible screens in the unboxing flow */
export type UnboxingScreen = 'sealed' | 'emerge' | 'reveal' | 'golden' | 'collection';

/** Haptic feedback intensity levels */
export type HapticPattern = 'light' | 'medium' | 'heavy';

// ============= Design System Types =============

/**
 * Visual design traits for card rendering.
 * These determine the card's appearance including background, textures, and effects.
 */
export interface DesignTraits {
  readonly background: 'matte-black' | 'deep-charcoal' | 'midnight-blue' | 'obsidian';
  readonly texture: 'smooth' | 'brushed' | 'hammered' | 'holographic';
  readonly emblem: 'standard' | 'embossed' | 'gilt' | 'prismatic';
  readonly borderStyle: 'clean' | 'beveled' | 'ornate' | 'radiant';
  readonly foilType: 'none' | 'subtle' | 'accent' | 'full';
  readonly typography: 'modern' | 'classic' | 'luxury' | 'display';
}

// ============= Progress & Rewards Types =============

/**
 * Progress shards earned toward a specific product.
 * Shards accumulate to unlock product redemption.
 */
export interface ProgressShards {
  /** Number of shards earned */
  readonly shards_earned: number;
  /** Product identifier for shard accumulation */
  readonly product_key: string;
}

/**
 * Prize information attached to a card.
 * Prizes are special rewards beyond normal credits.
 */
export interface CardPrize {
  readonly name: string;
  readonly description: string;
  /** Whether the prize can be redeemed */
  readonly redeemable: boolean;
}

/**
 * Complete rewards bundle for a card.
 * Contains points, text rewards, progress, and optional prize.
 */
export interface CardRewards {
  /** Universal points awarded */
  readonly points: number;
  /** Text reward descriptions (e.g., "VIP Event Access") */
  readonly rewards: readonly string[];
  /** Progress toward product redemption */
  readonly progress: ProgressShards;
  /** Optional special prize */
  readonly prize?: CardPrize;
}

// ============= Primary Entities =============

/**
 * The primary collectible card entity.
 * 
 * @description Represents a mystery card in the user's collection.
 * Cards have visual traits, monetary value, rarity scores, and can be
 * staked in lottery rooms.
 * 
 * @example
 * const card: CollectCard = {
 *   card_id: 'abc-123',
 *   brand: 'Hermès',
 *   model: 'Birkin 30',
 *   product_value: 12000,
 *   rarity_score: 85,
 *   is_golden: false,
 *   band: 'GRAIL',
 *   // ... other properties
 * };
 */
export interface CollectCard {
  readonly card_id: string;
  readonly product_reveal: string;
  readonly brand: string;
  readonly model: string;
  readonly product_image: string;
  readonly product_value: number;
  readonly rarity_score: number;
  readonly is_golden: boolean;
  readonly design_traits: DesignTraits;
  readonly serial_number: string;
  readonly owner_id?: string;
  readonly pulled_at?: string;
  readonly rewards?: CardRewards;
  readonly current_bid?: number;
  readonly highest_bidder?: string;
  // Room Stats
  readonly priority_points: number;
  /**
   * Credits toward product redemption, stored in cents.
   * 
   * User-facing term: "Credits"
   * Display format: "$X.XX" (use formatCredits helper)
   * 
   * Mapping: 1 cent = 1 Credit = $0.01
   * When credits reach product_value * 100, the product can be redeemed.
   * 
   * Credits can be:
   * - Used for redemption when Redeem Progress reaches 100%
   * - Converted to entries in future drops
   */
  readonly redeem_credits_cents: number;
  readonly card_state: CardState;
  readonly staked_room_id?: string | null;
  readonly band: RarityBand;
  /** Product description from product_classes */
  readonly product_description?: string | null;
  /** Product traits like "signed", "limited edition", etc. */
  readonly traits?: readonly string[];
}

// Product Progress (Redemption Tab)
export interface ProductProgress {
  readonly productKey: string;
  readonly brand: string;
  readonly model: string;
  readonly productImage: string;
  readonly productValue: number;
  readonly totalShards: number;
  readonly cardCount: number;
  readonly isRedeemable: boolean;
  readonly cards: readonly CollectCard[];
  readonly latestCard: CollectCard;
  readonly goldenCard: CollectCard | null;
  readonly displayCard: CollectCard;
  readonly totalPoints: number;
  readonly hasGolden: boolean;
  readonly hasPrize: boolean;
}

// Database Types
export interface ProductClass {
  readonly id: string;
  readonly name: string;
  readonly brand: string;
  readonly model: string;
  readonly category: string;
  readonly band: RarityBand;
  readonly retail_value_usd: number;
  readonly image_url: string | null;
  readonly expected_fulfillment_cost_usd: number;
  /** Product description for display */
  readonly description?: string | null;
  /** Product traits like "signed", "limited edition", etc. */
  readonly traits?: readonly string[];
}

export interface RevealRow {
  readonly id: string;
  readonly purchase_id: string | null;
  readonly user_id: string;
  readonly product_class_id: string;
  readonly band: RarityBand;
  readonly is_golden: boolean;
  readonly credits_awarded: number;
  readonly product_credits_awarded: number;
  readonly universal_credits_awarded: number;
  readonly is_award: boolean;
  readonly award_id: string | null;
  readonly serial_number: string;
  readonly card_data: unknown;
  readonly created_at: string;
  readonly revealed_at: string | null;
  readonly product_classes: ProductClass;
  // Room Stats
  readonly priority_points: number;
  /**
   * Credits toward product redemption, stored in cents.
   * See CollectCard.redeem_credits_cents for full documentation.
   */
  readonly redeem_credits_cents: number;
  readonly card_state: CardState;
  readonly staked_room_id: string | null;
}

export interface ProductCredit {
  readonly product_class_id: string;
  readonly credits: number;
  readonly product_classes: ProductClass;
}

export interface Award {
  readonly id: string;
  readonly product_class_id: string;
  readonly status: string;
  readonly reserved_cost_usd: number;
  readonly fulfilled_at: string | null;
  readonly created_at: string;
  readonly product_classes: ProductClass;
}

export interface CreditsData {
  readonly universal: number;
  readonly products: readonly ProductCredit[];
}

export interface FreePullStatus {
  readonly canClaim: boolean;
  readonly isLoggedIn: boolean;
  readonly lastClaim?: string | null;
  readonly nextAvailable?: Date | null;
}

// Free Pull Response
export interface FreePullReveal {
  readonly id: string;
  readonly band: RarityBand;
  readonly is_golden: boolean;
  readonly is_award: boolean;
  readonly credits_awarded: number;
  readonly serial_number: string;
  readonly product: {
    readonly id: string;
    readonly brand: string;
    readonly model: string;
    readonly image_url: string | null;
    readonly retail_value_usd: number;
  };
}

export interface FreePullResult {
  readonly success: boolean;
  readonly reveal?: FreePullReveal;
  readonly error?: string;
}
