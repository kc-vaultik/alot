// VaultView - Main vault showing user's collection with stats and card grid

import { memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { CollectCard } from '@/features/collect-room/types';
import { useProductProgress } from '@/features/collect-room/hooks/actions';
import { useVaultActions } from '@/features/collect-room/hooks/ui';
import { useMyCredits } from '@/features/collect-room/hooks/data/useMyCredits';
import { useAuth } from '@/contexts/AuthContext';
import { GiftSwapModal } from '../purchase/gift-swap';
import { BuyProgressModal } from '../purchase/BuyProgressModal';
import { SafeWrapper } from '@/components/shared/ErrorBoundary';
import { CollectRoomHeader } from '../layout/CollectRoomHeader';
import {
  MyCardsGrid,
  CardDetailModal,
  ProfileBox,
  CollectionValueBox,
} from './index';
import { CardGridSkeleton } from './VaultSkeleton';

interface VaultViewProps {
  collection: CollectCard[];
  onUnboxAnother: () => void;
  latestCard?: CollectCard;
  totalPoints?: number;
  onSpendPoints?: (points: number, productKey: string, progressGained: number) => void;
  isLoading?: boolean;
}

export const VaultView = memo(({
  collection,
  onUnboxAnother,
  latestCard,
  totalPoints = 0,
  onSpendPoints,
  isLoading = false,
}: VaultViewProps) => {
  const { user, logout } = useAuth();
  const productProgress = useProductProgress(collection);
  const { data: creditsData } = useMyCredits();

  // Shared vault actions
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

  // Get user display name
  const displayName = user?.email?.split('@')[0] || 'Collector';

  // Calculate total collection value
  const collectionValue = useMemo(() => {
    return collection.reduce((sum, card) => sum + (card.product_value || 0), 0);
  }, [collection]);

  // Get actual credits from user's account
  const credits = creditsData?.universal ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full flex flex-col"
    >
      <CollectRoomHeader />

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pb-32 pt-6">

      {/* Profile & Settings Box */}
      <ProfileBox
        displayName={displayName}
        email={user?.email}
        onLogout={logout}
      />

      {/* Collection Value Box */}
      <CollectionValueBox
        collectionValue={collectionValue}
        credits={credits}
        cardCount={collection.length}
      />

      {/* Cards Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <SafeWrapper fallbackTitle="Failed to load cards">
          {isLoading ? (
            <CardGridSkeleton count={8} />
          ) : (
            <MyCardsGrid
              productProgress={productProgress}
              collectionCount={collection.length}
              latestCard={latestCard}
              onCardSelect={setSelectedCard}
              onUnboxAnother={onUnboxAnother}
            />
          )}
        </SafeWrapper>
      </div>

      {/* Floating Add Button - Sticker Style */}
      <button
        onClick={handleUnboxMore}
        className="fixed bottom-28 right-6 w-16 h-16 rounded-2xl bg-gradient-to-br from-hype-pink to-hype-blue flex items-center justify-center border-4 border-white shadow-sticker hover:scale-110 transition-transform z-40 transform rotate-3"
      >
        <Plus className="w-8 h-8 text-white" strokeWidth={3} />
      </button>

      {/* Card Detail Modal */}
      <SafeWrapper fallbackTitle="Modal error" compact>
        <CardDetailModal
          card={selectedCard}
          activeTab="my-cards"
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
      </div>
    </motion.div>
  );
});

VaultView.displayName = 'VaultView';
