/**
 * @module features/collect-room
 * @description Collect Room Feature - Main collectible card game experience
 * 
 * PUBLIC API - Only exports used by other features and pages.
 * Internal components should import directly from their source files.
 * 
 * This module provides:
 * - Card unboxing and reveal experience
 * - Vault for viewing collected cards
 * - Free pull claiming
 * - Stripe checkout integration
 * - Real-time card updates
 */

// ============================================================================
// PAGE - Main entry component
// ============================================================================
export { default as CollectRoomPage } from './CollectRoomPage';

// ============================================================================
// CONTEXT - State management (used by internal components)
// ============================================================================
export { CollectRoomProvider, useCollectRoom } from './context/CollectRoomContext';
export type { CollectRoomContextValue } from './context/types';

// ============================================================================
// DATA HOOKS - Used by other features (rooms, marketplace, collectors)
// ============================================================================
export {
  useMyReveals,
  useMyCredits,
  useMyAwards,
  useInvalidateQueries,
} from './hooks/data';
export type { InvalidateQueries } from './hooks/data';

// ============================================================================
// CHECKOUT HOOKS - Used by purchase flows
// ============================================================================
export {
  useCheckout,
  useCategoryCheckout,
  useCategoryPricing,
  useCategoryProducts,
} from './hooks/checkout';
export type { CategoryProduct } from './hooks/checkout';

// ============================================================================
// ACTION HOOKS - Used by other features
// ============================================================================
export {
  useProductProgress,
  useSpendCredits,
  useCardTransfers,
  useClaimTransfer,
  useNotifications,
} from './hooks/actions';
export type { Notification } from './hooks/actions';

// ============================================================================
// TYPES - Public type definitions used by other features
// ============================================================================
export type {
  // Card types (used by marketplace, rooms)
  CollectCard,
  ProductProgress,
  DesignTraits,
  CardRewards,
  // Database types
  RevealRow,
  ProductClass,
  ProductCredit,
  Award,
  CreditsData,
  // UI types
  UnboxingScreen,
  // Free pull types
  FreePullStatus,
  FreePullResult,
} from './types';

// ============================================================================
// UTILITIES - Used by other features (marketplace, rooms)
// ============================================================================
export { mapRevealToCollectCard, mapFreePullRevealToCard } from './utils/cardMappers';

// ============================================================================
// CONSTANTS - Used by other features
// ============================================================================
export { QUERY_KEYS } from './constants';
export { CATEGORY_PACKS, type CategoryPackConfig } from './constants/categories';

// ============================================================================
// COMPONENTS - Only components used by other features/pages
// ============================================================================

// Claim page (used by router)
export { ClaimPage } from './components/claim';

// Shared reveal effects (used by shared components)
export { 
  Confetti,
  FlipBurst,
} from './components/unboxing/effects';
