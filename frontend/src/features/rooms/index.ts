/**
 * @module features/rooms
 * @description Prize Rooms Feature - Crowdfunded collectible giveaways
 * 
 * This module provides:
 * - Room lobby with tier filtering
 * - Entry purchase flow with Stripe integration
 * - Winner drawing and outcome handling
 * - Mystery room reveals
 * - Refund/credit conversion options
 */

// ============================================================================
// TYPES - Public type definitions
// ============================================================================
export type {
  Room,
  RoomEntry,
  RoomStatus,
  RoomTier,
  RoomEntryStatus,
  PercentileBand,
  CompetitivenessBand,
  LeaderboardEntry,
  RoomLeaderboardResponse,
  RoomProduct,
  EligibleCardsResponse,
  EligibleCard,
  JoinRoomResponse,
  LeaveRoomResponse,
  ClaimRedemptionResponse,
  ActiveRoomsResponse,
  MyRoomEntryResponse,
  RoomReward,
  RewardPackGrant,
  StakeSnapshot,
  LeaderboardVisibility,
} from './types';

// Re-export shared types for convenience
export type { RarityBand, RarityTier } from '@/types/shared';

// ============================================================================
// CONSTANTS - Configuration values
// ============================================================================
export {
  ROOM_QUERY_KEYS,
  STALE_TIME,
  ROOM_TIERS,
  ENTRY_TIERS,
  CREDIT_ENTRY_TIERS,
  VC_TO_ENTRY_RATE,
  HIGH_VALUE_THRESHOLD_CENTS,
  REFUND_CREDIT_MULTIPLIER,
  PERCENTILE_BAND_LABELS,
  FUNDING_MULTIPLIER,
  LOSER_POOL_PERCENTAGE,
  REWARD_CONFIG,
  SCORING_WEIGHTS,
  COMPETITIVENESS_THRESHOLDS,
  ROOM_STATUS_LABELS,
  getEntryTiersForRoom,
  calculateEntriesFromCredits,
} from './constants';

// ============================================================================
// UTILITIES - Helper functions
// ============================================================================
export {
  formatCents,
  formatTimeRemaining,
  formatTimeRemainingSimple,
  formatLockTime,
} from '@/utils/formatters';

export {
  getTierGradientColors,
  getTierBorderClass,
  getTierTextColor,
  BAND_COLORS,
  RARITY_BAND_COLORS,
} from '@/utils/styling';

// ============================================================================
// DATA HOOKS - Fetching room data
// ============================================================================
export { 
  useRooms,
  useRoom,
  useRoomLeaderboard,
  useMyEligibleCards,
  useMyRoomEntry,
  useProductsByTier,
} from './hooks/data';

// ============================================================================
// MUTATION HOOKS - Room actions
// ============================================================================
export { 
  useJoinRoom,
  useLeaveRoom,
  useClaimRedemption,
  useBuyEntriesWithCredits,
} from './hooks/mutations';

// ============================================================================
// CHECKOUT HOOKS - Payment flow
// ============================================================================
export { 
  useRoomEntryCheckout,
  useRoomEntryReturn,
} from './hooks/checkout';

// ============================================================================
// COMPONENTS - UI components
// ============================================================================

// Lobby
export { PrizeRoomsLobby, PrizeRoomCard } from './components/lobby';

// Detail page
export { RoomDetailPage, PrizeRoomDetailPage } from './components';
export { 
  CountdownTimer,
  FundingProgressBar,
  RoomStatsGrid,
  StakedCardDisplay,
} from './components/detail';

// Entry flow
export { 
  EntryPurchaseModal,
  EntryCard,
  RoomEntryRevealFlow,
  RoomEntryRevealScreen,
} from './components/entry';

// Outcome flow
export { 
  OutcomeFlow,
  DrawAnimation,
  WinnerReveal,
  NonWinnerModal,
  MysteryReveal,
} from './components/outcome';

// Shared
export { 
  TierProductCarousel,
  SealedLeaderboardMessage,
  RewardsPanel,
  RoomLeaderboard,
  RoomCommunityTabs,
  CompetitivenessBadge,
} from './components/shared';

// Modals
export { StakeModal, WinnerFlow } from './components/modals';
