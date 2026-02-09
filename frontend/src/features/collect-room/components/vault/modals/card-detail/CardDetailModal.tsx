/**
 * @fileoverview Main CardDetailModal Component (Orchestrator)
 * Composes sub-components to display card details
 */

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { getRarityTier } from '@/utils/styling';
import { useRoom } from '@/features/rooms/hooks/data';
import type { CollectCard } from '@/features/collect-room/types';
import type { MarketplaceListing } from '@/features/marketplace/types';

import { CardPreview } from './CardPreview';
import { InPlayStatus } from './InPlayStatus';
import { ProductInfo } from './ProductInfo';
import { CreditsProgress } from './CreditsProgress';
import { EmbeddedPerks } from './EmbeddedPerks';
import { GoldenPerks } from './GoldenPerks';
import { HowToWin } from './HowToWin';
import { CardActions } from './CardActions';
import { 
  type CardDetailModalProps, 
  isMarketplaceListing, 
  getTierColors 
} from './types';

export const CardDetailModal = memo(({
  card,
  activeTab,
  productProgress,
  isOwnListing = false,
  onClose,
  onGift,
  onSwap,
  onShare,
  onUnboxMore,
  onBuyProgress,
  onClaimGift,
  onRequestSwap,
  onStakeInRoom,
  onBoostClaimPower,
}: CardDetailModalProps) => {
  // Fetch room details if card is staked
  const stakedRoomId = card?.staked_room_id || null;
  const { data: stakedRoom } = useRoom(stakedRoomId);

  if (!card) return null;

  const tier = getRarityTier(card.rarity_score);
  const isListing = isMarketplaceListing(card);
  const isStaked = card.card_state === 'staked' || !!card.staked_room_id;
  const tierColors = getTierColors(tier, card.is_golden);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-20 pb-32 bg-black/80 backdrop-blur-sm overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative max-w-sm w-full mb-32"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute -top-12 right-0 p-2 text-white/60 hover:text-white transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Card and Info stacked vertically */}
          <div className="flex flex-col gap-4">
            {/* Full Card Preview */}
            <CardPreview card={card} isListing={isListing} />

            {/* Card Info Panel */}
            <div className="flex-1 space-y-4">
              {/* Product Info (tier badge, brand, model, traits, value) */}
              <ProductInfo card={card} tier={tier} tierColors={tierColors} />

              {/* In Play Status - for staked cards */}
              {isStaked && !isListing && (
                <InPlayStatus 
                  card={card} 
                  stakedRoom={stakedRoom || null} 
                  onClose={onClose} 
                />
              )}

              {/* Credits & Redeem Progress - only for own cards */}
              {!isListing && <CreditsProgress card={card} />}

              {/* Embedded Perks */}
              <EmbeddedPerks />

              {/* Golden Card Perks */}
              {card.is_golden && !isListing && <GoldenPerks />}

              {/* How to Win Explainer */}
              {activeTab === 'my-cards' && <HowToWin />}

              {/* Card Actions */}
              <CardActions
                card={card}
                activeTab={activeTab}
                isListing={isListing}
                isOwnListing={isOwnListing}
                onClose={onClose}
                onGift={onGift}
                onSwap={onSwap}
                onShare={onShare}
                onRequestSwap={onRequestSwap}
              />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
});

CardDetailModal.displayName = 'CardDetailModal';
