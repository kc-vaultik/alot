/**
 * @fileoverview Shared type definitions used across multiple features.
 * This module contains common types that are shared between collect-room,
 * rooms, collectors, marketplace, and other features to avoid duplication
 * and ensure consistency.
 */

// =============================================================================
// Rarity Types
// =============================================================================

/**
 * Uppercase rarity band identifiers used in database and API responses.
 * Represents the tier classification of cards and products.
 * @example 'MYTHIC' | 'GRAIL' | 'RARE' | 'ICON'
 */
export type RarityBand = 'MYTHIC' | 'GRAIL' | 'RARE' | 'ICON';

/**
 * Lowercase rarity tier identifiers used in UI components and styling.
 * Maps 1:1 with RarityBand but in lowercase for CSS classes and display.
 * @example 'mythic' | 'grail' | 'rare' | 'icon'
 */
export type RarityTier = 'mythic' | 'grail' | 'rare' | 'icon';

/**
 * Drop tier classification matching RarityBand.
 * Used specifically in the drops feature for tier-based filtering.
 */
export type DropTier = RarityBand;

/** @deprecated Use DropTier instead */
export type RoomTier = DropTier;

// =============================================================================
// Card State Types
// =============================================================================

/**
 * Represents the current state of a card in a user's collection.
 * - 'owned': Card is in the user's collection, available for actions
 * - 'staked': Card is currently staked in a drop competition
 * - 'won': Card was won from a drop competition
 * - 'redeemed': Card has been redeemed for the physical product
 */
export type CardState = 'owned' | 'staked' | 'won' | 'redeemed';

// =============================================================================
// User Profile Types
// =============================================================================

/**
 * Basic user profile information shared across features.
 * Used in collectors, leaderboards, and social features.
 */
export interface UserProfile {
  /** Unique user identifier */
  readonly user_id: string;
  /** Unique username handle */
  readonly username: string;
  /** Optional display name shown in UI */
  readonly display_name: string | null;
  /** URL to user's avatar image */
  readonly avatar_url: string | null;
}

/**
 * Extended user profile with social and collection stats.
 * Used in collector profiles and leaderboards.
 */
export interface ExtendedUserProfile extends UserProfile {
  /** User's bio/description */
  readonly bio: string | null;
  /** Whether the profile is publicly visible */
  readonly is_public: boolean;
  /** When the profile was created */
  readonly created_at: string;
}

// =============================================================================
// Product Types
// =============================================================================

/**
 * Basic product information shared across features.
 * Represents a product class in the system.
 */
export interface BaseProduct {
  /** Unique product identifier */
  readonly id: string;
  /** Product name */
  readonly name: string;
  /** Brand name (e.g., 'Rolex', 'Nike') */
  readonly brand: string;
  /** Model name/number */
  readonly model: string;
  /** Product category */
  readonly category: string;
  /** Retail value in USD */
  readonly retail_value_usd: number;
  /** URL to product image */
  readonly image_url: string | null;
}

// =============================================================================
// Percentile & Competition Types
// =============================================================================

/**
 * Percentile band for drop rankings.
 * S = Top tier, A = High, B = Mid, C = Lower
 */
export type PercentileBand = 'S' | 'A' | 'B' | 'C';

/**
 * Competitiveness indicator for drops.
 */
export type CompetitivenessBand = 'Low' | 'Medium' | 'High';

// =============================================================================
// Pricing Types
// =============================================================================

/**
 * Pricing tier for pack purchases.
 * T5 = $5, T10 = $10, T20 = $20
 */
export type PricingTier = 'T5' | 'T10' | 'T20';

// =============================================================================
// Card Core Types (shared between collect-room and rooms)
// =============================================================================

/**
 * Minimal card information needed for drop staking and displays.
 * Used as a common interface between collect-room cards and drop entries.
 */
export interface StakableCard {
  /** Unique card/reveal identifier */
  readonly card_id: string;
  /** Product brand */
  readonly brand: string;
  /** Product model */
  readonly model: string;
  /** Product image URL */
  readonly product_image: string;
  /** Retail value in USD */
  readonly product_value: number;
  /** Card rarity band */
  readonly band: RarityBand;
  /** Current card state */
  readonly card_state: CardState;
  /** Credits toward redemption (in cents) */
  readonly redeem_credits_cents: number;
  /** Priority points for drop ranking */
  readonly priority_points: number;
  /** Drop ID if currently staked */
  readonly staked_drop_id?: string | null;
  /** @deprecated Use staked_drop_id instead */
  readonly staked_room_id?: string | null;
}

/**
 * Drop stake snapshot - captured state of a card when staked.
 * Used for calculating rankings and rewards.
 */
export interface StakeSnapshot {
  /** Redeem credits in cents at time of stake */
  readonly rc_cents: number;
  /** Priority points at time of stake */
  readonly pp: number;
  /** Rarity score at time of stake */
  readonly rs: number;
  /** Product value in cents */
  readonly product_value_cents: number;
  /** Product name for display */
  readonly product_name: string;
  /** Rarity band */
  readonly band: string;
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Converts a RarityBand to its lowercase RarityTier equivalent.
 * @param band - The uppercase rarity band
 * @returns The lowercase rarity tier
 * @example bandToTier('MYTHIC') // returns 'mythic'
 */
export function bandToTier(band: RarityBand): RarityTier {
  return band.toLowerCase() as RarityTier;
}

/**
 * Converts a RarityTier to its uppercase RarityBand equivalent.
 * @param tier - The lowercase rarity tier
 * @returns The uppercase rarity band
 * @example tierToBand('mythic') // returns 'MYTHIC'
 */
export function tierToBand(tier: RarityTier): RarityBand {
  return tier.toUpperCase() as RarityBand;
}
