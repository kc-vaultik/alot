/**
 * @fileoverview Types for the Rooms feature.
 * 
 * @description Defines all TypeScript interfaces for prize rooms,
 * entries, leaderboards, and related API responses.
 * 
 * @module features/rooms/types
 * 
 * @example
 * import type { Room, RoomEntry, LeaderboardEntry } from '@/features/rooms/types';
 * 
 * function RoomCard({ room }: { room: Room }) {
 *   const progress = room.escrow_balance_cents / room.escrow_target_cents;
 *   return <ProgressBar value={progress} />;
 * }
 */

import type {
  RarityBand,
  RarityTier,
  CardState,
  PercentileBand,
  CompetitivenessBand,
  BaseProduct,
  StakeSnapshot,
} from '@/types/shared';

// Re-export types used by this feature's public API
export type { RarityBand, RarityTier, CardState, PercentileBand, CompetitivenessBand, StakeSnapshot };

// ============= Core Enums =============

/** Room tier - maps to rarity bands */
export type RoomTier = RarityBand;

/** 
 * Room lifecycle status.
 * Rooms progress through: OPEN → FUNDED → DRAWING → SETTLED
 */
export type RoomStatus = 'OPEN' | 'FUNDED' | 'DRAWING' | 'SETTLED' | 'EXPIRED' | 'REFUNDING' | 'LOCKED' | 'CLOSED';

/** Entry status within a room */
export type RoomEntryStatus = 'STAKED' | 'LOST' | 'WON';

/** When leaderboard rankings become visible to participants */
export type LeaderboardVisibility = 'live' | 'after_lock' | 'after_close';

// ============= Entity Interfaces =============

/**
 * Product information attached to a room.
 * Extends BaseProduct with optional rarity band.
 */
export interface RoomProduct extends BaseProduct {
  /** Rarity band for display purposes */
  band?: RarityBand;
}

/**
 * A prize room where users buy entries for product prizes.
 * 
 * @example
 * const room: Room = {
 *   id: 'room-123',
 *   tier: 'GRAIL',
 *   status: 'OPEN',
 *   escrow_balance_cents: 5000,
 *   escrow_target_cents: 10000,
 *   end_at: '2024-01-15T00:00:00Z',
 * };
 */
export interface Room {
  id: string;
  tier: RoomTier;
  tier_cap_cents: number;
  category: string | null;
  status: RoomStatus;
  start_at: string;
  end_at: string;
  lock_at?: string;
  min_participants: number;
  max_participants: number;
  escrow_target_cents: number;
  escrow_balance_cents: number;
  participant_count?: number;
  is_funded?: boolean;
  winner_entry_id?: string | null;
  winner_user_id?: string | null;
  leaderboard_visibility?: LeaderboardVisibility;
  reward_budget_cents?: number;
  created_at?: string;
  // Prize room fields
  product_class_id?: string | null;
  funding_target_cents?: number | null;
  is_mystery?: boolean;
  mystery_product_id?: string | null;
  deadline_at?: string | null;
  product?: RoomProduct | null;
}

export interface RoomEntry {
  id: string;
  room_id: string;
  user_id: string;
  reveal_id: string;
  stake_snapshot: StakeSnapshot;
  priority_score: number | null;
  rank: number | null;
  status: RoomEntryStatus;
  staked_at: string;
  percentile_band?: PercentileBand;
  credits_awarded?: number;
  packs_awarded?: number;
  early_stake_bonus?: number;
}

// StakeSnapshot is now imported from @/types/shared

/**
 * Leaderboard entry for room participants.
 * 
 * @property tickets - DEPRECATED: Use `entries` instead. Represents the number of 
 *   chances in the prize draw. Each $1 spent = 1 entry.
 * @property entries - Number of entries (chances) in the draw. Alias for `tickets`.
 * @property amount_spent_cents - Total amount spent by this participant in cents.
 */
export interface LeaderboardEntry {
  rank: number | null;
  entry_id: string;
  user_id: string;
  reveal_id?: string | null;
  priority_score?: number | null;
  status?: RoomEntryStatus;
  stake_snapshot?: StakeSnapshot;
  username?: string;
  display_name?: string;
  avatar_url?: string;
  percentile_band?: PercentileBand;
  credits_awarded?: number;
  packs_awarded?: number;
  early_stake_bonus?: number;
  // Prize room-specific fields
  /** Number of entries (chances) in the draw. Each $1 = 1 entry. */
  entries?: number;
  amount_spent_cents?: number;
}

export interface EligibleCard {
  reveal_id: string;
  product_class_id: string;
  band: string;
  serial_number: string;
  redeem_credits_cents: number;
  priority_points: number;
  card_state: CardState;
  product: {
    id: string;
    name: string;
    brand: string;
    model: string;
    category: string;
    retail_value_usd: number;
    image_url: string | null;
  };
  preview_score: number;
}

export interface JoinRoomResponse {
  success: boolean;
  entry_id: string;
  room: {
    id: string;
    tier: string;
    status: string;
    participants: number;
    max_participants: number;
    escrow_balance_cents: number;
    escrow_target_cents: number;
  };
  stake_snapshot: StakeSnapshot;
  priority_score?: number;
  early_stake_bonus?: number;
}

export interface LeaveRoomResponse {
  success: boolean;
  message: string;
  reveal_id: string;
}

export interface ClaimRedemptionResponse {
  success: boolean;
  requires_payment: boolean;
  pay_cents?: number;
  product_value_cents?: number;
  redeem_credits_cents?: number;
  redeemed?: boolean;
  award_id?: string;
  room_id?: string;
  reveal_id?: string;
  product?: {
    id: string;
    name: string;
    brand: string;
    model: string;
    image_url: string | null;
  };
}

export interface RoomLeaderboardResponse {
  room: Room;
  leaderboard: LeaderboardEntry[];
  my_entry?: LeaderboardEntry | null;
  is_sealed?: boolean;
  /** Total number of entries across all participants */
  total_entries?: number;
}

export interface ActiveRoomsResponse {
  rooms: Room[];
}

export interface EligibleCardsResponse {
  room_id: string;
  tier: string;
  tier_cap_cents: number;
  category: string | null;
  cards: EligibleCard[];
}

export interface MyRoomEntryResponse {
  has_entry: boolean;
  room_id?: string;
  room_status?: RoomStatus;
  entry?: RoomEntry;
  competitiveness_band?: CompetitivenessBand;
  improvement_tips?: string[];
  participant_count?: number;
  avg_score?: number;
}

export interface RoomReward {
  id: string;
  room_id: string;
  user_id: string;
  entry_id: string;
  percentile_band: PercentileBand;
  final_rank: number;
  credits_awarded: number;
  packs_awarded: number;
  created_at: string;
}

export interface RewardPackGrant {
  id: string;
  user_id: string;
  source_type: string;
  source_id?: string;
  status: 'PENDING' | 'OPENED';
  opened_at?: string;
  created_at: string;
}
