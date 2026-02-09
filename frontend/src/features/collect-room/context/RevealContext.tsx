/**
 * @fileoverview Reveal Context
 * Manages reveal queue state and card reveal operations.
 * @module features/collect-room/context/RevealContext
 */

import React, { createContext, useContext, useCallback, useEffect, useMemo, useRef } from 'react';
import { logger } from '@/utils/logger';
import { useRevealQueue } from '../hooks/actions';
import { useUnrevealedCards } from '../hooks/data';
import type { CollectCard } from '../types';

// ============= Types =============

export interface RevealContextValue {
  /** Number of cards in the reveal queue */
  queueLength: number;
  /** Whether there are cards available to reveal */
  hasCardsToReveal: boolean;
  /** Whether unrevealed cards are loading */
  isUnrevealedLoading: boolean;
  /** Add cards to the reveal queue */
  addToQueue: (cards: CollectCard[]) => void;
  /** Set the entire reveal queue */
  setQueue: (cards: CollectCard[]) => void;
  /** Get the next card from the queue */
  getNextCard: () => CollectCard | undefined;
  /** Mark a card as processed (won't be re-queued) */
  markAsProcessed: (cardId: string) => void;
  /** Check if a card has been processed */
  isProcessed: (cardId: string) => boolean;
  /** Check if a card is currently in queue */
  isInQueue: (cardId: string) => boolean;
}

// ============= Context =============

const RevealContext = createContext<RevealContextValue | null>(null);

export function useRevealContext(): RevealContextValue {
  const context = useContext(RevealContext);
  if (!context) {
    throw new Error('useRevealContext must be used within RevealContextProvider');
  }
  return context;
}

// ============= Provider =============

interface RevealContextProviderProps {
  children: React.ReactNode;
  /** Skip initial queue loading (e.g., during Stripe return flow) */
  skipInitialQueue?: boolean;
}

export function RevealContextProvider({ children, skipInitialQueue = false }: RevealContextProviderProps) {
  const {
    queueLength,
    hasCardsToReveal,
    addToQueue,
    setQueue,
    getNextCard,
    markAsProcessed,
    isProcessed,
    isInQueue,
  } = useRevealQueue();

  const { data: unrevealedCards = [], isLoading: isUnrevealedLoading } = useUnrevealedCards();

  // Queue unrevealed cards on initial load
  const hasQueuedInitialCardsRef = useRef(false);

  useEffect(() => {
    if (isUnrevealedLoading || skipInitialQueue || hasQueuedInitialCardsRef.current) return;

    if (unrevealedCards.length > 0 && queueLength === 0) {
      const newCards = unrevealedCards.filter((card) => !isProcessed(card.card_id));
      if (newCards.length > 0) {
        hasQueuedInitialCardsRef.current = true;
        logger.debug('[RevealContext] Queueing unrevealed cards:', newCards.map((c) => c.card_id));
        setQueue(newCards);
      }
    }
  }, [unrevealedCards, isUnrevealedLoading, skipInitialQueue, queueLength, isProcessed, setQueue]);

  const value = useMemo<RevealContextValue>(() => ({
    queueLength,
    hasCardsToReveal,
    isUnrevealedLoading,
    addToQueue,
    setQueue,
    getNextCard,
    markAsProcessed,
    isProcessed,
    isInQueue,
  }), [
    queueLength,
    hasCardsToReveal,
    isUnrevealedLoading,
    addToQueue,
    setQueue,
    getNextCard,
    markAsProcessed,
    isProcessed,
    isInQueue,
  ]);

  return (
    <RevealContext.Provider value={value}>
      {children}
    </RevealContext.Provider>
  );
}
