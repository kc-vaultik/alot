/**
 * @fileoverview Types for the Collectors feature.
 * Imports shared types from @/types/shared to avoid duplication.
 */

import { ExtendedUserProfile, UserProfile } from '@/types/shared';

// Re-export shared types for backward compatibility
export type { UserProfile, ExtendedUserProfile };

/**
 * Full collector profile with stats and social information.
 * Extends ExtendedUserProfile with collector-specific data.
 */
export interface CollectorProfile extends ExtendedUserProfile {
  /** Number of followers */
  follower_count: number;
  /** Number following */
  following_count: number;
  /** Whether current user follows this collector */
  is_following: boolean;
  /** Whether this is the current user's own profile */
  is_own_profile: boolean;
  /** Collector score (calculated from activity) */
  score: number;
  /** Collection and activity statistics */
  stats: CollectorStats;
  /** Breakdown of how score is calculated */
  score_breakdown: ScoreBreakdown;
}

export interface CollectorStats {
  card_count: number;
  collection_value: number;
  swaps_completed: number;
  gifts_given: number;
  battles_won: number;
  battles_lost: number;
  redemptions: number;
}

export interface ScoreBreakdown {
  collection_value_score: number;
  card_count_score: number;
  swaps_score: number;
  gifts_score: number;
  battle_score: number;
  redemption_score: number;
}

/**
 * Simplified collector info for list displays.
 * Extends UserProfile with score and connection status.
 */
export interface CollectorListItem extends UserProfile {
  /** Collector score */
  score: number;
  /** Number of cards in collection */
  card_count: number;
  /** Connection status with current user */
  connection_status?: 'FOLLOWING' | 'MUTUAL';
}

/**
 * Collector's card collection summary.
 */
export interface CollectorCollection extends UserProfile {
  /** Cards in the collection */
  cards: CollectorOwnedCard[];
  /** Total card count */
  card_count: number;
}

/**
 * A card owned by a collector (used in collection views).
 */
export interface CollectorOwnedCard {
  id: string;
  product_class_id: string;
  band: string;
  is_golden: boolean;
  serial_number: string;
  revealed_at: string;
  product: {
    id: string;
    name: string;
    brand: string;
    model: string;
    category: string;
    retail_value_usd: number;
    image_url: string | null;
  };
}

export type CollectorFilter = 'all' | 'following' | 'followers' | 'mutual';
