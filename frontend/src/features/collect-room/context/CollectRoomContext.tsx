/**
 * @fileoverview Collect Room Context
 * Composes focused sub-contexts and provides unified action handlers.
 * @module features/collect-room/context/CollectRoomContext
 */

import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { RevealContextProvider, useRevealContext } from './RevealContext';
import { CreditsContextProvider, useCreditsContext } from './CreditsContext';
import { UIContextProvider, useUIContext } from './UIContext';
import { useStripeReturn } from '../hooks/checkout';
import { useRealtimeReveals } from '../hooks/data';
import {
  createHandleUnseal,
  createHandleReveal,
  createHandleAddToCollection,
  createHandleFreePullSuccess,
  createHandleDemoGolden,
  createHandleUnboxAnother,
  createHandleViewCollection,
} from './actions';
import type { CollectRoomContextValue } from './types';
import type { CollectCard } from '../types';

// ============= Context =============

const CollectRoomContext = createContext<CollectRoomContextValue | null>(null);

export function useCollectRoom(): CollectRoomContextValue {
  const context = useContext(CollectRoomContext);
  if (!context) {
    throw new Error('useCollectRoom must be used within CollectRoomProvider');
  }
  return context;
}

// ============= Inner Provider (composes sub-contexts) =============

function CollectRoomInnerProvider({ children }: { children: React.ReactNode }) {
  // Get values from sub-contexts
  const reveal = useRevealContext();
  const credits = useCreditsContext();
  const ui = useUIContext();

  // Stripe return handling
  const { isOpening } = useStripeReturn({
    onRevealsReady: useCallback((cards: CollectCard[]) => {
      reveal.setQueue(cards);
      cards.forEach((card) => reveal.markAsProcessed(card.card_id));
      ui.setScreen('sealed');
    }, [reveal, ui]),
    onRefetch: useCallback(() => {
      credits.refetchReveals();
      credits.refetchCredits();
    }, [credits]),
  });

  // Realtime reveals handler
  const handleRealtimeReveal = useCallback((card: CollectCard) => {
    if (isOpening || reveal.isProcessed(card.card_id) || reveal.isInQueue(card.card_id)) return;
    reveal.addToQueue([card]);
    credits.refetchReveals();
    credits.refetchCredits();
  }, [isOpening, reveal, credits]);

  useRealtimeReveals(handleRealtimeReveal);

  // ============= Actions =============

  const handleUnseal = useCallback(
    createHandleUnseal({
      triggerHaptic: ui.triggerHaptic,
      hasCardsToReveal: reveal.hasCardsToReveal,
      getNextCard: reveal.getNextCard,
      setCurrentCard: ui.setCurrentCard,
      setScreen: ui.setScreen,
      setPurchaseOpen: ui.setPurchaseOpen,
      currentCard: ui.currentCard,
      markAsProcessed: reveal.markAsProcessed,
      refetchReveals: credits.refetchReveals,
      refetchCredits: credits.refetchCredits,
    }),
    [ui, reveal, credits]
  );

  const handleReveal = useCallback(
    () => createHandleReveal(ui.currentCard, ui.triggerHaptic, ui.setScreen)(),
    [ui]
  );

  const handleAddToCollection = useCallback(
    () => createHandleAddToCollection(
      ui.currentCard,
      ui.setLatestCard,
      credits.refetchReveals,
      ui.setScreen
    )(),
    [ui, credits]
  );

  const handleUnboxAnother = useCallback(
    () => createHandleUnboxAnother(
      ui.currentCard,
      ui.setLatestCard,
      reveal.markAsProcessed,
      credits.refetchReveals,
      ui.setCurrentCard,
      ui.setScreen
    )(),
    [ui, reveal, credits]
  );

  const handleViewCollection = useCallback(
    () => createHandleViewCollection(
      ui.currentCard,
      ui.setLatestCard,
      credits.refetchReveals,
      ui.setScreen
    )(),
    [ui, credits]
  );

  const handleFreePullSuccess = useCallback(
    (result) => createHandleFreePullSuccess(
      reveal.markAsProcessed,
      ui.setCurrentCard,
      ui.setScreen,
      credits.refetchReveals,
      credits.refetchCredits
    )(result),
    [reveal, ui, credits]
  );

  const handleDemoGolden = useCallback(
    () => createHandleDemoGolden(reveal.markAsProcessed, ui.setCurrentCard, ui.setScreen)(),
    [reveal, ui]
  );

  // ============= Combined Value =============

  const isLoading = credits.isDataLoading || reveal.isUnrevealedLoading;

  const value = useMemo<CollectRoomContextValue>(() => ({
    // UI state
    screen: ui.screen,
    currentCard: ui.currentCard,
    latestCard: ui.latestCard,
    purchaseOpen: ui.purchaseOpen,
    // Reveal state
    queueLength: reveal.queueLength,
    hasCardsToReveal: reveal.hasCardsToReveal,
    // Data state
    reveals: credits.reveals,
    credits: credits.credits,
    awards: credits.awards,
    totalVaultValue: credits.totalVaultValue,
    // Loading states
    isLoading,
    isOpening,
    // UI actions
    setScreen: ui.setScreen,
    setPurchaseOpen: ui.setPurchaseOpen,
    triggerHaptic: ui.triggerHaptic,
    // Reveal actions
    handleUnseal,
    handleReveal,
    handleAddToCollection,
    handleUnboxAnother,
    handleViewCollection,
    handleFreePullSuccess,
    handleDemoGolden,
    // Data actions
    refetchReveals: credits.refetchReveals,
    refetchCredits: credits.refetchCredits,
  }), [
    ui,
    reveal.queueLength,
    reveal.hasCardsToReveal,
    credits,
    isLoading,
    isOpening,
    handleUnseal,
    handleReveal,
    handleAddToCollection,
    handleUnboxAnother,
    handleViewCollection,
    handleFreePullSuccess,
    handleDemoGolden,
  ]);

  return (
    <CollectRoomContext.Provider value={value}>
      {children}
    </CollectRoomContext.Provider>
  );
}

// ============= Main Provider (wraps sub-context providers) =============

interface CollectRoomProviderProps {
  children: React.ReactNode;
}

export function CollectRoomProvider({ children }: CollectRoomProviderProps) {
  return (
    <CreditsContextProvider>
      <UIContextProvider>
        <RevealContextProvider>
          <CollectRoomInnerProvider>
            {children}
          </CollectRoomInnerProvider>
        </RevealContextProvider>
      </UIContextProvider>
    </CreditsContextProvider>
  );
}

// Re-export types
export type { CollectRoomContextValue, CollectRoomState, CollectRoomActions } from './types';
