/**
 * @fileoverview Reveal action creators for Collect Room context.
 */

import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { markRevealSeen } from '../../hooks/data';
import { mapFreePullRevealToCard } from '../../utils/cardMappers';
import { createDemoGoldenCard } from '../../utils/demoCard';
import type { CollectCard, FreePullResult, HapticPattern, UnboxingScreen } from '../../types';
import type { RevealActionDeps } from '../types';

/**
 * Creates the handleUnseal action.
 * Starts the unsealing process for the next card in queue.
 */
export function createHandleUnseal(deps: RevealActionDeps) {
  return () => {
    deps.triggerHaptic('medium');
    if (deps.hasCardsToReveal) {
      const nextCard = deps.getNextCard();
      if (nextCard) {
        deps.setCurrentCard(nextCard);
        deps.setScreen('emerge');
      }
    } else {
      deps.setPurchaseOpen(true);
    }
  };
}

/**
 * Creates the handleReveal action.
 * Reveals the current card (shows golden screen if applicable).
 */
export function createHandleReveal(
  currentCard: CollectCard | null,
  triggerHaptic: (pattern?: HapticPattern) => void,
  setScreen: (screen: UnboxingScreen) => void
) {
  return () => {
    triggerHaptic('heavy');
    setScreen(currentCard?.is_golden ? 'golden' : 'reveal');
  };
}

/**
 * Creates the handleAddToCollection action.
 * Adds the current card to collection and navigates to collection view.
 */
export function createHandleAddToCollection(
  currentCard: CollectCard | null,
  setLatestCard: (card: CollectCard | null) => void,
  refetchReveals: () => Promise<{ data?: CollectCard[] }>,
  setScreen: (screen: UnboxingScreen) => void
) {
  return async () => {
    if (currentCard) {
      await markRevealSeen(currentCard.card_id);
      setLatestCard(currentCard);
      
      const result = await refetchReveals();
      if (result.data && !result.data.some(r => r.card_id === currentCard.card_id)) {
        logger.warn('[handleAddToCollection] Card not in refetch results:', currentCard.card_id);
        toast.info('Card added! Refresh if not visible in your collection.');
      }
    }
    setScreen('collection');
  };
}

/**
 * Creates the handleFreePullSuccess action.
 * Handles a successful free pull by queueing the card for reveal.
 */
export function createHandleFreePullSuccess(
  markAsProcessed: (cardId: string) => void,
  setCurrentCard: (card: CollectCard | null) => void,
  setScreen: (screen: UnboxingScreen) => void,
  refetchReveals: () => void,
  refetchCredits: () => void
) {
  return (result: FreePullResult) => {
    if (result.success && result.reveal) {
      const card = mapFreePullRevealToCard(result.reveal);
      markAsProcessed(card.card_id);
      setCurrentCard(card);
      setScreen('emerge');
      refetchReveals();
      refetchCredits();
    }
  };
}

/**
 * Creates the handleDemoGolden action.
 * Dev-only action to test golden card flow.
 */
export function createHandleDemoGolden(
  markAsProcessed: (cardId: string) => void,
  setCurrentCard: (card: CollectCard | null) => void,
  setScreen: (screen: UnboxingScreen) => void
) {
  return () => {
    if (!import.meta.env.DEV) return;
    const mockGolden = createDemoGoldenCard();
    markAsProcessed(mockGolden.card_id);
    setCurrentCard(mockGolden);
    setScreen('emerge');
  };
}
