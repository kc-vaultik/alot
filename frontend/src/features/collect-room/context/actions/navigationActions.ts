/**
 * @fileoverview Navigation action creators for Collect Room context.
 */

import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { markRevealSeen } from '../../hooks/data';
import type { CollectCard, UnboxingScreen } from '../../types';

/**
 * Creates the handleUnboxAnother action.
 * Saves current card and returns to sealed screen for next card.
 */
export function createHandleUnboxAnother(
  currentCard: CollectCard | null,
  setLatestCard: (card: CollectCard | null) => void,
  markAsProcessed: (cardId: string) => void,
  refetchReveals: () => Promise<{ data?: CollectCard[] }>,
  setCurrentCard: (card: CollectCard | null) => void,
  setScreen: (screen: UnboxingScreen) => void
) {
  return async () => {
    if (currentCard) {
      await markRevealSeen(currentCard.card_id);
      setLatestCard(currentCard);
      markAsProcessed(currentCard.card_id);
      
      const result = await refetchReveals();
      if (result.data && !result.data.some(r => r.card_id === currentCard.card_id)) {
        logger.warn('[handleUnboxAnother] Card not in refetch results:', currentCard.card_id);
        toast.info('Card added! Refresh if not visible in your collection.');
      }
    }
    setCurrentCard(null);
    setScreen('sealed');
  };
}

/**
 * Creates the handleViewCollection action.
 * Saves current card and navigates to collection view.
 */
export function createHandleViewCollection(
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
        logger.warn('[handleViewCollection] Card not in refetch results:', currentCard.card_id);
        toast.info('Card added! Refresh if not visible in your collection.');
      }
    }
    setScreen('collection');
  };
}
