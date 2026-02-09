import { memo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Coins, Trophy, Lock } from 'lucide-react';
import type { CollectCard } from '@/features/collect-room/types';
import { getRarityTier, getRarityLabel } from '@/utils/styling';
import alotLogo from '@/assets/alot-logo.png';
import { ProductProgress } from '../types';
import { getCardBorderClass, getGradientColors } from '@/utils/styling';

interface MyCardsGridProps {
  productProgress: ProductProgress[];
  /** Raw cards count (used to avoid false "empty" state if progress aggregation fails) */
  collectionCount: number;
  latestCard?: CollectCard;
  /** Reveal IDs that are currently listed on marketplace */
  activeListingIds?: string[];
  onCardSelect: (card: CollectCard) => void;
  onUnboxAnother: () => void;
}

export const MyCardsGrid = memo(({ 
  productProgress,
  collectionCount,
  latestCard, 
  activeListingIds = [],
  onCardSelect,
  onUnboxAnother 
}: MyCardsGridProps) => {
  if (collectionCount === 0) {
    return (
      <div className="text-center py-20">
        <p className="font-display text-xl text-white/50 mb-6 transform -rotate-1">YOUR STASH IS EMPTY</p>
        <button
          onClick={onUnboxAnother}
          className="px-8 py-4 rounded-2xl gradient-hype text-white font-display text-base tracking-wide border-4 border-white shadow-sticker transform -rotate-1 hover:rotate-0 transition-transform"
        >
          OPEN YOUR FIRST PACK
        </button>
      </div>
    );
  }

  // Safety: if cards exist but aggregation produced no groups, surface a clear message
  if (productProgress.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="font-display text-base text-white/70 mb-2">Cards loaded, but the Stash view couldn't group them.</p>
        <p className="text-white/40 text-sm">Loaded cards: {collectionCount}</p>
      </div>
    );
  }

  // Filter out any products with undefined displayCard to prevent crashes
  const validProducts = productProgress.filter(p => p.displayCard);

  return (
    <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 xs:gap-3 sm:gap-4 lg:gap-6">
      {validProducts.map((product, index) => {
        const card = product.displayCard;
        const tier = product.hasGolden ? 'mythic' : getRarityTier(card.rarity_score);
        const isLatest = latestCard && product.cards.some(c => c.card_id === latestCard.card_id);
        const isListed = product.cards.some(c => activeListingIds.includes(c.card_id));
        const isStaked = card.card_state === 'staked' || !!card.staked_room_id;
        
        return (
          <motion.div
            key={product.productKey}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: index * 0.03 }}
            className="relative group cursor-pointer"
            onClick={() => onCardSelect(product.displayCard)}
          >
            {/* Latest indicator */}
            {isLatest && (
              <motion.div
                className="absolute -top-2 -right-2 z-10 px-2 py-1 rounded-full bg-violet-500 text-white text-[10px] font-medium"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              >
                NEW
              </motion.div>
            )}

            {/* Card count badge */}
            {product.cardCount > 1 && (
              <div className="absolute -top-2 -left-2 z-10 w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold flex items-center justify-center border border-white/30">
                x{product.cardCount}
              </div>
            )}

            {/* Mini Card - Sticker Style */}
            <div className={`relative aspect-[3/4.5] rounded-2xl overflow-hidden border-4 border-white shadow-sticker ${getCardBorderClass(card)} bg-[#0a0a0f] group-hover:scale-105 transition-transform duration-300`}>
              {/* Gradient accent */}
              <div className={`absolute bottom-0 right-0 w-3/4 h-1/2 bg-gradient-to-tl ${getGradientColors(card)} blur-2xl opacity-60`} />
              
              <div className="absolute top-2 left-2 z-10">
                <img 
                  src={alotLogo} 
                  alt="Alot!" 
                  className="h-5 object-contain"
                  draggable={false} 
                />
              </div>

              {/* Golden shimmer */}
              {product.hasGolden && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/20 to-transparent"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                />
              )}

              {/* Product image */}
              <div className="absolute inset-0 flex items-center justify-center p-4 pt-8">
                <img
                  src={product.productImage}
                  alt={product.model}
                  className="w-full h-auto max-h-16 object-contain opacity-90"
                />
              </div>

              {/* Bottom info */}
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-amber-200/60 text-[8px] uppercase tracking-wider truncate">
                  {product.brand}
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-amber-200/90 text-[10px] font-light truncate flex-1">
                    {product.model}
                  </p>
                  <p className="text-hype-green text-[10px] font-display ml-1">
                    ${product.productValue.toLocaleString()}
                  </p>
                </div>
                
                {/* Rarity and rewards indicators */}
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center gap-1">
                    {tier !== 'icon' && (
                      <Sparkles className={`w-2.5 h-2.5 ${
                        tier === 'mythic' ? 'text-amber-400' :
                        tier === 'grail' ? 'text-violet-400' :
                        'text-blue-400'
                      }`} />
                    )}
                    <span className={`text-[9px] ${
                      tier === 'mythic' ? 'text-amber-400' :
                      tier === 'grail' ? 'text-violet-400' :
                      tier === 'rare' ? 'text-blue-400' :
                      'text-white/50'
                    }`}>
                      {getRarityLabel(tier)}
                    </span>
                  </div>
                  
                  {/* Total Points badge */}
                  {product.totalPoints > 0 && (
                    <div className="flex items-center gap-0.5 text-amber-400/80">
                      <Coins className="w-2.5 h-2.5" />
                      <span className="text-[8px]">{product.totalPoints}</span>
                    </div>
                  )}
                </div>

                {/* Cumulative Progress bar */}
                <div className="mt-1.5">
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        product.isRedeemable 
                          ? 'bg-green-400' 
                          : 'bg-violet-400'
                      }`}
                      style={{ width: `${Math.min(product.totalShards, 100)}%` }}
                    />
                  </div>
                  <span className={`text-[7px] ${
                    product.isRedeemable ? 'text-green-400' : 'text-white/40'
                  }`}>
                    {product.totalShards.toFixed(1)}% {product.isRedeemable ? '• Ready!' : ''}
                  </span>
                </div>

                {/* Prize indicator */}
                {product.hasPrize && (
                  <div className="flex items-center gap-1 mt-1">
                    <Trophy className="w-2.5 h-2.5 text-green-400" />
                    <span className="text-[8px] text-green-400">Prize Available</span>
                  </div>
                )}
              </div>

              {/* IN PLAY badge */}
              {isStaked && (
                <div className="absolute top-2 right-2 flex items-center gap-0.5 px-2 py-1 rounded-full bg-cyan-500 text-white text-[8px] font-display z-10 border-2 border-white shadow-sticker">
                  <Lock className="w-2.5 h-2.5" strokeWidth={3} />
                  IN PLAY
                </div>
              )}

              {/* GOLDEN badge */}
              {product.hasGolden && !isListed && !isStaked && (
                <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-amber-400 text-black text-[8px] font-display tracking-wider z-10 border-2 border-white shadow-sticker">
                  GOLDEN
                </div>
              )}

              {/* LISTED badge */}
              {isListed && !isStaked && (
                <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-hype-blue text-white text-[8px] font-display z-10 border-2 border-white shadow-sticker">
                  LISTED
                </div>
              )}

              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none rounded-xl" />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
});

MyCardsGrid.displayName = 'MyCardsGrid';
