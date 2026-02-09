/**
 * @fileoverview Shared Vault Actions Hook
 * @description Extracts common action handlers used by VaultView and CollectionView
 */

import { useState, useCallback } from 'react';
import { logger } from '@/utils/logger';
import type { CollectCard, ProductProgress } from '../../types';
import { getRarityTier, getRarityLabel } from '@/utils/styling';

// ============= Types =============

interface UseVaultActionsOptions {
  onUnboxAnother: () => void;
  onSpendPoints?: (points: number, productKey: string, progressGained: number) => void;
}

interface UseVaultActionsResult {
  // State
  selectedCard: CollectCard | null;
  giftSwapMode: 'gift' | 'swap' | null;
  giftSwapCard: CollectCard | null;
  buyProgressProduct: ProductProgress | null;
  
  // Setters
  setSelectedCard: (card: CollectCard | null) => void;
  setBuyProgressProduct: (product: ProductProgress | null) => void;
  
  // Actions
  handleShare: (card: CollectCard) => Promise<void>;
  handleGift: (card: CollectCard) => void;
  handleSwap: (card: CollectCard) => void;
  handleUnboxMore: () => void;
  handleBuyProgress: (pointsSpent: number, progressGained: number) => void;
  handleCloseGiftSwap: () => void;
  handleConfirmGiftSwap: (mode: 'gift' | 'swap') => void;
}

// ============= Hook Implementation =============

export function useVaultActions({
  onUnboxAnother,
  onSpendPoints,
}: UseVaultActionsOptions): UseVaultActionsResult {
  // Modal state
  const [selectedCard, setSelectedCard] = useState<CollectCard | null>(null);
  const [giftSwapMode, setGiftSwapMode] = useState<'gift' | 'swap' | null>(null);
  const [giftSwapCard, setGiftSwapCard] = useState<CollectCard | null>(null);
  const [buyProgressProduct, setBuyProgressProduct] = useState<ProductProgress | null>(null);

  // Share card to social or clipboard
  const handleShare = useCallback(async (card: CollectCard) => {
    const tier = getRarityTier(card.rarity_score);
    const shareText = `I just pulled a ${getRarityLabel(tier)}! ${card.brand} ${card.model} #${card.serial_number} 🎴 #CollectRoom`;
    
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Collect Room Pull', text: shareText });
      } catch {
        // User cancelled share
      }
    } else {
      await navigator.clipboard.writeText(shareText);
    }
  }, []);

  // Open gift modal
  const handleGift = useCallback((card: CollectCard) => {
    setGiftSwapCard(card);
    setGiftSwapMode('gift');
  }, []);

  // Open swap modal
  const handleSwap = useCallback((card: CollectCard) => {
    setGiftSwapCard(card);
    setGiftSwapMode('swap');
  }, []);

  // Close card detail and go to unbox
  const handleUnboxMore = useCallback(() => {
    setSelectedCard(null);
    onUnboxAnother();
  }, [onUnboxAnother]);

  // Handle buy progress purchase
  const handleBuyProgress = useCallback((pointsSpent: number, progressGained: number) => {
    if (onSpendPoints && buyProgressProduct) {
      onSpendPoints(pointsSpent, buyProgressProduct.productKey, progressGained);
    }
    setBuyProgressProduct(null);
  }, [onSpendPoints, buyProgressProduct]);

  // Close gift/swap modal
  const handleCloseGiftSwap = useCallback(() => {
    setGiftSwapMode(null);
    setGiftSwapCard(null);
  }, []);

  // Confirm gift/swap action
  const handleConfirmGiftSwap = useCallback((mode: 'gift' | 'swap') => {
    if (giftSwapCard) {
      logger.debug(`Card ${giftSwapCard.card_id} marked for ${mode}`);
    }
    setGiftSwapMode(null);
    setGiftSwapCard(null);
    setSelectedCard(null);
  }, [giftSwapCard]);

  return {
    // State
    selectedCard,
    giftSwapMode,
    giftSwapCard,
    buyProgressProduct,
    
    // Setters
    setSelectedCard,
    setBuyProgressProduct,
    
    // Actions
    handleShare,
    handleGift,
    handleSwap,
    handleUnboxMore,
    handleBuyProgress,
    handleCloseGiftSwap,
    handleConfirmGiftSwap,
  };
}
