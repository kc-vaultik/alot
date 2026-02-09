import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CollectCard } from '@/features/collect-room/types';
import { useMarketplaceListings, useMyListings, useCancelListing } from '@/features/marketplace/hooks/useMarketplaceListings';
import { useProductProgress } from '@/features/collect-room/hooks/actions';
import { useVaultActions } from '@/features/collect-room/hooks/ui';
import { GiftSwapModal } from '../purchase/gift-swap';
import { BuyProgressModal } from '../purchase/BuyProgressModal';
import { PrizeRoomsLobby } from '@/features/rooms';
import { SafeWrapper } from '@/components/shared/ErrorBoundary';
import { X, Gift, ArrowLeftRight } from 'lucide-react';
import {
  VaultHeader,
  VaultTabs,
  TabType,
  MyCardsGrid,
  RedemptionProgress,
  CardDetailModal,
  MarketplaceGrid,
} from './index';
import { CardGridSkeleton, RedemptionSkeleton } from './VaultSkeleton';

interface CollectionViewProps {
  collection: CollectCard[];
  onUnboxAnother: () => void;
  onBackToUnbox: () => void;
  latestCard?: CollectCard;
  totalPoints?: number;
  onSpendPoints?: (points: number, productKey: string, progressGained: number) => void;
  isLoading?: boolean;
}

export const CollectionView = memo(({ 
  collection, 
  onUnboxAnother, 
  onBackToUnbox, 
  latestCard, 
  totalPoints = 0, 
  onSpendPoints,
  isLoading = false,
}: CollectionViewProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('my-cards');

  // Use real marketplace data
  const { data: marketplaceCards = [], isLoading: marketplaceLoading } = useMarketplaceListings();
  const { data: myListings = [], isLoading: myListingsLoading } = useMyListings();
  const cancelListing = useCancelListing();

  // Use extracted hooks
  const productProgress = useProductProgress(collection);
  const {
    selectedCard,
    giftSwapMode,
    giftSwapCard,
    buyProgressProduct,
    setSelectedCard,
    setBuyProgressProduct,
    handleShare,
    handleGift,
    handleSwap,
    handleUnboxMore,
    handleBuyProgress,
    handleCloseGiftSwap,
    handleConfirmGiftSwap,
  } = useVaultActions({ onUnboxAnother, onSpendPoints });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen pb-8 overflow-x-hidden"
    >
      {/* Sticky Header */}
      <VaultHeader
        totalPoints={totalPoints}
        cardCount={collection.length}
        onBack={onBackToUnbox}
        onUnbox={onUnboxAnother}
        hideNotification={!!selectedCard}
      />

      {/* Page Title - Digital Vandalism Style */}
      <div className="max-w-6xl mx-auto px-3 sm:px-6 pt-6 sm:pt-10 pb-2 sm:pb-4">
        <h1 className="font-display text-2xl sm:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-hype-pink via-hype-blue to-hype-pink transform -rotate-1">
          YOUR STASH
        </h1>
        <p className="text-muted-foreground text-xs sm:text-sm font-bold uppercase tracking-wide mt-1 sm:mt-2">
          {collection.length} card{collection.length !== 1 ? 's' : ''} collected
        </p>
      </div>

      {/* Tabs */}
      <VaultTabs
        activeTab={activeTab}
        cardCount={collection.length}
        onTabChange={setActiveTab}
      />

      {/* Content Area */}
      <div className="max-w-6xl mx-auto px-3 sm:px-6 pb-6 sm:pb-8">
        <AnimatePresence mode="wait">
          {/* Progress/Redemption Tab */}
          {activeTab === 'progress' && (
            <motion.div
              key="progress"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <SafeWrapper fallbackTitle="Failed to load progress" compact>
                {isLoading ? (
                  <RedemptionSkeleton count={4} />
                ) : (
                  <RedemptionProgress
                    productProgress={productProgress}
                    onUnboxAnother={onUnboxAnother}
                    onBuyProgress={setBuyProgressProduct}
                  />
                )}
              </SafeWrapper>
            </motion.div>
          )}

          {/* My Cards Tab */}
          {activeTab === 'my-cards' && (
            <motion.div
              key="my-cards-grid"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <SafeWrapper fallbackTitle="Failed to load cards">
                {isLoading ? (
                  <CardGridSkeleton count={8} />
                ) : (
                  <MyCardsGrid
                    productProgress={productProgress}
                    collectionCount={collection.length}
                    latestCard={latestCard}
                    activeListingIds={myListings.map(l => l.card_id)}
                    onCardSelect={setSelectedCard}
                    onUnboxAnother={onUnboxAnother}
                  />
                )}
              </SafeWrapper>
            </motion.div>
          )}

          {/* Marketplace Tab */}
          {activeTab === 'marketplace' && (
            <motion.div
              key="marketplace-grid"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* My Active Listings Section */}
              {myListings.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-white/70 mb-3">
                    Your Active Listings ({myListings.length})
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {myListings.map((listing) => (
                      <div 
                        key={listing.transfer_id} 
                        className="relative bg-white/5 rounded-xl p-3 border border-white/10"
                      >
                        {/* Cancel button */}
                        <button
                          onClick={() => cancelListing.mutate(listing.transfer_id)}
                          disabled={cancelListing.isPending}
                          className="absolute top-2 right-2 z-10 p-1 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                        
                        {/* Card preview */}
                        <div className="aspect-[3/4] rounded-lg overflow-hidden mb-2 bg-black/20">
                          <img
                            src={listing.product_image}
                            alt={listing.product_reveal}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        {/* Listing info */}
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-white truncate">{listing.brand}</p>
                          <p className="text-[10px] text-white/50 truncate">{listing.model}</p>
                          <div className="flex items-center gap-1 mt-1">
                            {listing.listing_type === 'GIFT' ? (
                              <Gift className="w-3 h-3 text-green-400" />
                            ) : (
                              <ArrowLeftRight className="w-3 h-3 text-blue-400" />
                            )}
                            <span className="text-[10px] text-white/40">
                              {listing.listing_type === 'GIFT' ? 'Gift' : 'Swap'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Public Marketplace */}
              <SafeWrapper fallbackTitle="Failed to load marketplace">
                {marketplaceLoading || myListingsLoading ? (
                  <CardGridSkeleton count={12} />
                ) : (
                  <>
                    {myListings.length > 0 && marketplaceCards.length > 0 && (
                      <h3 className="text-sm font-medium text-white/70 mb-3">
                        Available to Trade
                      </h3>
                    )}
                    <MarketplaceGrid
                      cards={marketplaceCards}
                      onCardSelect={setSelectedCard}
                    />
                  </>
                )}
              </SafeWrapper>
            </motion.div>
          )}

          {/* Battle Tab */}
          {activeTab === 'battle' && (
            <motion.div
              key="battle"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <SafeWrapper 
                fallbackTitle="Rooms unavailable" 
                fallbackMessage="The rooms system encountered an error. Please try again later."
              >
                <PrizeRoomsLobby />
              </SafeWrapper>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Card Detail Modal */}
      <SafeWrapper fallbackTitle="Modal error" compact>
        <CardDetailModal
          card={selectedCard}
          activeTab={activeTab}
          productProgress={productProgress}
          onClose={() => setSelectedCard(null)}
          onGift={handleGift}
          onSwap={handleSwap}
          onShare={handleShare}
          onUnboxMore={handleUnboxMore}
          onBuyProgress={setBuyProgressProduct}
        />
      </SafeWrapper>

      {/* Gift/Swap Modal */}
      <AnimatePresence>
        {giftSwapMode && giftSwapCard && (
          <SafeWrapper fallbackTitle="Gift/Swap error" compact>
            <GiftSwapModal
              card={giftSwapCard}
              mode={giftSwapMode}
              onClose={handleCloseGiftSwap}
              onConfirm={handleConfirmGiftSwap}
            />
          </SafeWrapper>
        )}
      </AnimatePresence>

      {/* Buy Progress Modal */}
      {buyProgressProduct && (
        <SafeWrapper fallbackTitle="Purchase error" compact>
          <BuyProgressModal
            isOpen={!!buyProgressProduct}
            onClose={() => setBuyProgressProduct(null)}
            product={{
              productKey: buyProgressProduct.productKey,
              brand: buyProgressProduct.brand,
              model: buyProgressProduct.model,
              productImage: buyProgressProduct.productImage,
              productValue: buyProgressProduct.productValue,
              totalShards: buyProgressProduct.totalShards,
              cardCount: buyProgressProduct.cardCount,
              isRedeemable: buyProgressProduct.isRedeemable,
            }}
            availablePoints={totalPoints}
            onPurchase={handleBuyProgress}
            rarityScore={buyProgressProduct.displayCard.rarity_score}
          />
        </SafeWrapper>
      )}
    </motion.div>
  );
});

CollectionView.displayName = 'CollectionView';
