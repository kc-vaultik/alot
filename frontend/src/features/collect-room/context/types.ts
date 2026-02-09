/**
 * @fileoverview Type definitions for Collect Room context.
 */

import type { CollectCard, UnboxingScreen, CreditsData, Award, HapticPattern, FreePullResult } from '../types';

/**
 * State interface for the Collect Room context.
 */
export interface CollectRoomState {
  /** Current screen in the unboxing flow */
  screen: UnboxingScreen;
  /** Card currently being revealed */
  currentCard: CollectCard | null;
  /** Most recently revealed card */
  latestCard: CollectCard | null;
  /** Number of cards waiting to be revealed */
  queueLength: number;
  /** Whether there are cards available to reveal */
  hasCardsToReveal: boolean;
  /** All revealed cards in collection */
  reveals: CollectCard[];
  /** User's credit balances */
  credits: CreditsData | undefined;
  /** User's awards */
  awards: Award[];
  /** Loading state for data fetching */
  isLoading: boolean;
  /** Whether a pack is currently being opened */
  isOpening: boolean;
  /** Whether purchase modal is open */
  purchaseOpen: boolean;
  /** Total value of all cards in vault */
  totalVaultValue: number;
}

/**
 * Actions interface for the Collect Room context.
 */
export interface CollectRoomActions {
  /** Set the current screen */
  setScreen: (screen: UnboxingScreen) => void;
  /** Toggle purchase modal */
  setPurchaseOpen: (open: boolean) => void;
  /** Start unsealing a card */
  handleUnseal: () => void;
  /** Reveal the current card */
  handleReveal: () => void;
  /** Add current card to collection */
  handleAddToCollection: () => Promise<void>;
  /** Unbox another card from queue */
  handleUnboxAnother: () => Promise<void>;
  /** Navigate to collection view */
  handleViewCollection: () => Promise<void>;
  /** Handle successful free pull */
  handleFreePullSuccess: (result: FreePullResult) => void;
  /** Trigger demo golden card (dev only) */
  handleDemoGolden: () => void;
  /** Trigger haptic feedback */
  triggerHaptic: (pattern?: HapticPattern) => void;
  /** Refetch reveals data */
  refetchReveals: () => void;
  /** Refetch credits data */
  refetchCredits: () => void;
}

/**
 * Combined context value type.
 */
export type CollectRoomContextValue = CollectRoomState & CollectRoomActions;

/**
 * Dependencies required by reveal actions.
 */
export interface RevealActionDeps {
  triggerHaptic: (pattern?: HapticPattern) => void;
  hasCardsToReveal: boolean;
  getNextCard: () => CollectCard | undefined;
  setCurrentCard: (card: CollectCard | null) => void;
  setScreen: (screen: UnboxingScreen) => void;
  setPurchaseOpen: (open: boolean) => void;
  currentCard: CollectCard | null;
  markAsProcessed: (cardId: string) => void;
  refetchReveals: () => Promise<unknown>;
  refetchCredits: () => void;
}

/**
 * Dependencies required by navigation actions.
 */
export interface NavigationActionDeps {
  currentCard: CollectCard | null;
  setLatestCard: (card: CollectCard | null) => void;
  setCurrentCard: (card: CollectCard | null) => void;
  setScreen: (screen: UnboxingScreen) => void;
  markAsProcessed: (cardId: string) => void;
  refetchReveals: () => Promise<unknown>;
}
