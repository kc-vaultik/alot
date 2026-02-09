/**
 * @fileoverview Reveal Queue Hook
 * Manages the queue of cards waiting to be revealed
 */

import { useState, useRef, useCallback, useMemo } from 'react';
import { isValidUUID } from '../../utils/cardMappers';
import type { CollectCard } from '../../types';

// ============= Types =============

interface UseRevealQueueResult {
  /** Number of cards currently in the queue */
  queueLength: number;
  /** Whether there are cards available to reveal */
  hasCardsToReveal: boolean;
  /** Add cards to the end of the queue */
  addToQueue: (cards: CollectCard[]) => void;
  /** Replace the entire queue with new cards */
  setQueue: (cards: CollectCard[]) => void;
  /** Get and remove the next card from the queue */
  getNextCard: () => CollectCard | undefined;
  /** Mark a card as processed (won't be re-queued) */
  markAsProcessed: (cardId: string) => void;
  /** Check if a card has been processed */
  isProcessed: (cardId: string) => boolean;
  /** Check if a card is currently in the queue */
  isInQueue: (cardId: string) => boolean;
  /** Clear the entire queue */
  clearQueue: () => void;
}

// ============= Hook Implementation =============

export function useRevealQueue(): UseRevealQueueResult {
  const queueRef = useRef<CollectCard[]>([]);
  const [queueLength, setQueueLength] = useState(0);
  const processedIdsRef = useRef<Set<string>>(new Set());

  /**
   * Filters cards to only include valid, unprocessed ones
   */
  const filterValidCards = useCallback((cards: CollectCard[]): CollectCard[] => {
    return cards.filter((card) => {
      const isValid = isValidUUID(card.card_id);
      const isAlreadyProcessed = processedIdsRef.current.has(card.card_id);
      return isValid && !isAlreadyProcessed;
    });
  }, []);

  const addToQueue = useCallback((cards: CollectCard[]) => {
    const validNewCards = filterValidCards(cards);
    
    if (validNewCards.length > 0) {
      queueRef.current = [...queueRef.current, ...validNewCards];
      setQueueLength(queueRef.current.length);
    }
  }, [filterValidCards]);

  const setQueue = useCallback((cards: CollectCard[]) => {
    const validCards = filterValidCards(cards);
    queueRef.current = validCards;
    setQueueLength(validCards.length);
  }, [filterValidCards]);

  const getNextCard = useCallback((): CollectCard | undefined => {
    const nextCard = queueRef.current.shift();
    setQueueLength(queueRef.current.length);
    return nextCard;
  }, []);

  const markAsProcessed = useCallback((cardId: string) => {
    processedIdsRef.current.add(cardId);
  }, []);

  const isProcessed = useCallback((cardId: string): boolean => {
    return processedIdsRef.current.has(cardId);
  }, []);

  const isInQueue = useCallback((cardId: string): boolean => {
    return queueRef.current.some((card) => card.card_id === cardId);
  }, []);

  const clearQueue = useCallback(() => {
    queueRef.current = [];
    setQueueLength(0);
  }, []);

  const hasCardsToReveal = useMemo(() => queueLength > 0, [queueLength]);

  return {
    queueLength,
    hasCardsToReveal,
    addToQueue,
    setQueue,
    getNextCard,
    markAsProcessed,
    isProcessed,
    isInQueue,
    clearQueue,
  };
}
