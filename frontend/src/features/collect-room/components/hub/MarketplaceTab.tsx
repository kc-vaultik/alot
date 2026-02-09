/**
 * @fileoverview MarketplaceTab Component
 * Displays marketplace listings including user's own gifts/trades and available swaps.
 */

import { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Gift, ArrowLeftRight, X } from 'lucide-react';
import type { CollectCard } from '@/features/collect-room/types';
import { getRarityTier, getRarityLabel } from '@/utils/styling';
import { MarketplaceGrid, MarketplaceCard } from '@/features/marketplace';
import { useMarketplaceListings, useMyListings, useCancelListing } from '@/features/marketplace/hooks/useMarketplaceListings';
import { SafeWrapper } from '@/components/shared/ErrorBoundary';
import { CardDetailModal } from '@/features/collect-room/components/vault';
import { CardGridSkeleton } from '@/features/collect-room/components/vault/VaultSkeleton';

interface MarketplaceTabProps {
  selectedCard: CollectCard | null;
  onCardSelect: (card: CollectCard) => void;
  onCloseModal: () => void;
}

export const MarketplaceTab = memo(({ 
  selectedCard, 
  onCardSelect, 
  onCloseModal 
}: MarketplaceTabProps) => {
  const { data: marketplaceCards = [], isLoading: marketplaceLoading } = useMarketplaceListings();
  const { data: myListings = [], isLoading: myListingsLoading } = useMyListings();
  const cancelListing = useCancelListing();

  const handleShare = useCallback(async (card: CollectCard) => {
    const tier = getRarityTier(card.rarity_score);
    const shareText = `Check out this ${getRarityLabel(tier)}! ${card.brand} ${card.model} 🎴 #CollectRoom`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Collect Room Card', text: shareText });
      } catch { /* User cancelled */ }
    } else {
      await navigator.clipboard.writeText(shareText);
    }
  }, []);

  const isOwnListing = selectedCard && 'transfer_id' in selectedCard 
    ? myListings.some(l => l.transfer_id === (selectedCard as any).transfer_id) 
    : false;

  return (
    <motion.div
      key="marketplace-content"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      {/* Your Gifts & Trades Section */}
      {myListings.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4 transform -rotate-1">
            <Gift className="w-5 h-5 text-hype-pink" strokeWidth={2.5} />
            <h3 className="font-display text-lg text-white tracking-wide">YOUR GIFTS & TRADES</h3>
            <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/60 text-xs font-bold">{myListings.length}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
            {myListings.map((listing, index) => (
              <div key={listing.transfer_id} className="relative">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    cancelListing.mutate(listing.transfer_id);
                  }} 
                  disabled={cancelListing.isPending}
                  className="absolute -top-2 -right-2 z-20 p-2 rounded-full bg-red-500 hover:bg-red-600 border-2 border-white shadow-sticker transition-colors disabled:opacity-50"
                >
                  <X className="w-3 h-3 text-white" strokeWidth={3} />
                </button>
                <MarketplaceCard 
                  card={listing} 
                  index={index}
                  onClick={() => onCardSelect(listing)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Swap Marketplace Section */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-4 transform rotate-[0.5deg]">
          <ArrowLeftRight className="w-5 h-5 text-hype-blue" strokeWidth={2.5} />
          <h3 className="font-display text-lg text-white tracking-wide">SWAP MARKETPLACE</h3>
          <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/60 text-xs font-bold">{marketplaceCards.length}</span>
        </div>
      </div>

      <SafeWrapper fallbackTitle="Failed to load marketplace">
        {marketplaceLoading || myListingsLoading ? (
          <CardGridSkeleton count={12} />
        ) : (
          <MarketplaceGrid cards={marketplaceCards} onCardSelect={onCardSelect} />
        )}
      </SafeWrapper>

      {/* Card Detail Modal */}
      <SafeWrapper fallbackTitle="Modal error" compact>
        <CardDetailModal
          card={selectedCard}
          activeTab="marketplace"
          productProgress={[]}
          isOwnListing={isOwnListing}
          onClose={onCloseModal}
          onGift={() => {}}
          onSwap={() => {}}
          onShare={handleShare}
          onUnboxMore={() => {}}
          onBuyProgress={() => {}}
        />
      </SafeWrapper>
    </motion.div>
  );
});

MarketplaceTab.displayName = 'MarketplaceTab';
