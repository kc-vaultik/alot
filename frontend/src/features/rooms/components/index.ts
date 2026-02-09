/**
 * @fileoverview Barrel exports for rooms components.
 * Explicit named exports for predictable API surface.
 */

// ============= Detail Components =============
export {
  RoomDetailHeader,
  RoomStatsGrid,
  EscrowProgressCard,
  StakedCardDisplay,
  MyEntryCard,
  RoomActions,
  FundingProgressBar,
  ParticipantList,
  OddsCalculator,
  CountdownTimer,
  PrizeRoomDetailPage,
} from './detail';

export { RoomDetailPage } from './RoomDetailPage';

// ============= Lobby Components =============
export {
  RoomsLobby,
  PrizeRoomsLobby,
  PrizeRoomCard,
  RoomFilters,
  RoomCard,
} from './lobby';
export type { FundingFilter, CategoryFilter } from './lobby';

// ============= Entry Flow Components =============
export {
  EntryPurchaseModal,
  EntryCard,
  RoomEntryRevealFlow,
  RoomEntryRevealScreen,
} from './entry';

// ============= Outcome Flow Components =============
export {
  DrawAnimation,
  WinnerReveal,
  NonWinnerModal,
  MysteryReveal,
  OutcomeFlow,
} from './outcome';

// ============= Modal Components =============
export { StakeModal, WinnerFlow } from './modals';

// ============= Shared Components =============
export {
  CompetitivenessBadge,
  SealedLeaderboardMessage,
  TierProductCarousel,
  RoomLeaderboard,
  RewardsPanel,
  RoomCommunityTabs,
  DrawVerification,
} from './shared';
