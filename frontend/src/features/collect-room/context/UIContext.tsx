/**
 * @fileoverview UI Context
 * Manages UI state like current screen, modals, and haptic feedback.
 * @module features/collect-room/context/UIContext
 */

import React, { createContext, useContext, useMemo } from 'react';
import { useScreenState, useCurrentCard, usePurchaseState, useHapticFeedback } from '../hooks/ui';
import type { CollectCard, UnboxingScreen, HapticPattern } from '../types';

// ============= Types =============

export interface UIContextValue {
  /** Current screen in the unboxing flow */
  screen: UnboxingScreen;
  /** Card currently being revealed */
  currentCard: CollectCard | null;
  /** Most recently revealed card */
  latestCard: CollectCard | null;
  /** Whether purchase modal is open */
  purchaseOpen: boolean;
  /** Set the current screen */
  setScreen: (screen: UnboxingScreen) => void;
  /** Set the current card being revealed */
  setCurrentCard: (card: CollectCard | null) => void;
  /** Set the most recently revealed card */
  setLatestCard: (card: CollectCard | null) => void;
  /** Toggle purchase modal */
  setPurchaseOpen: (open: boolean) => void;
  /** Trigger haptic feedback */
  triggerHaptic: (pattern?: HapticPattern) => void;
}

// ============= Context =============

const UIContext = createContext<UIContextValue | null>(null);

export function useUIContext(): UIContextValue {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUIContext must be used within UIContextProvider');
  }
  return context;
}

// ============= Provider =============

interface UIContextProviderProps {
  children: React.ReactNode;
}

export function UIContextProvider({ children }: UIContextProviderProps) {
  const { screen, setScreen } = useScreenState();
  const { currentCard, latestCard, setCurrentCard, setLatestCard } = useCurrentCard();
  const { purchaseOpen, setPurchaseOpen } = usePurchaseState();
  const { triggerHaptic } = useHapticFeedback();

  const value = useMemo<UIContextValue>(() => ({
    screen,
    currentCard,
    latestCard,
    purchaseOpen,
    setScreen,
    setCurrentCard,
    setLatestCard,
    setPurchaseOpen,
    triggerHaptic,
  }), [
    screen,
    currentCard,
    latestCard,
    purchaseOpen,
    setScreen,
    setCurrentCard,
    setLatestCard,
    setPurchaseOpen,
    triggerHaptic,
  ]);

  return (
    <UIContext.Provider value={value}>
      {children}
    </UIContext.Provider>
  );
}
