/**
 * @fileoverview Hook for managing the current card being revealed.
 * Tracks the active card and latest revealed card for display purposes.
 */

import { useState, useCallback } from 'react';
import type { CollectCard } from '../../types';

interface UseCurrentCardResult {
  /** Card currently being revealed */
  currentCard: CollectCard | null;
  /** Most recently revealed card (for collection view) */
  latestCard: CollectCard | null;
  /** Set the current card being revealed */
  setCurrentCard: (card: CollectCard | null) => void;
  /** Set the latest revealed card */
  setLatestCard: (card: CollectCard | null) => void;
  /** Clear both current and latest card */
  clearCards: () => void;
  /** Move current card to latest and clear current */
  finalizeCurrentCard: () => void;
}

/**
 * Manages the current card state during the reveal flow.
 * Tracks both the actively revealing card and the most recently revealed card.
 */
export function useCurrentCard(): UseCurrentCardResult {
  const [currentCard, setCurrentCard] = useState<CollectCard | null>(null);
  const [latestCard, setLatestCard] = useState<CollectCard | null>(null);

  const clearCards = useCallback(() => {
    setCurrentCard(null);
    setLatestCard(null);
  }, []);

  const finalizeCurrentCard = useCallback(() => {
    if (currentCard) {
      setLatestCard(currentCard);
    }
    setCurrentCard(null);
  }, [currentCard]);

  return {
    currentCard,
    latestCard,
    setCurrentCard,
    setLatestCard,
    clearCards,
    finalizeCurrentCard,
  };
}
