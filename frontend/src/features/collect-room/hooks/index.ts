/**
 * @fileoverview Public hook exports for the Collect Room feature.
 * 
 * Hooks are organized into submodules by responsibility:
 * - data: Fetching cards, credits, awards, real-time updates
 * - ui: Screen state, current card, haptic feedback
 * - checkout: Purchase flows, Stripe integration
 * - actions: User actions, mutations, card transfers
 * 
 * @module features/collect-room/hooks
 * 
 * @example
 * import { useMyReveals, useMyCredits, useCheckout } from '@/features/collect-room/hooks';
 */

// ============= Data Hooks =============
// Fetch user's cards, credits, awards, and real-time updates
export {
  useMyReveals,
  useMyCredits,
  useMyAwards,
  useUnrevealedCards,
  useRealtimeReveals,
  useFreePullStatus,
  useClaimFreePull,
  fetchRevealsBySession,
  markRevealSeen,
} from './data';

// ============= UI State Hooks =============
// Manage screen state, current card, haptics
export {
  useScreenState,
  useCurrentCard,
  usePurchaseState,
  useHapticFeedback,
  useVaultActions,
} from './ui';

// ============= Checkout Hooks =============
// Handle purchase flows and Stripe integration
export {
  useCheckout,
  useCategoryCheckout,
  useCategoryPricing,
  useCategoryProducts,
  useStripeReturn,
} from './checkout';
export type { CategoryProduct } from './checkout';

// ============= Action Hooks =============
// Handle user actions, mutations, card transfers
export {
  useRevealQueue,
  useProductProgress,
  useSpendCredits,
  useCardTransfers,
  useClaimTransfer,
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from './actions';
export type { Notification } from './actions';
