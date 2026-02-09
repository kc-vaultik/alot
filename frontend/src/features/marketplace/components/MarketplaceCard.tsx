import { memo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Gift, ArrowLeftRight } from 'lucide-react';
import type { CollectCard } from '@/features/collect-room/types';
import { getRarityTier, getRarityLabel } from '@/utils/styling';
import { MarketplaceListing } from '../types';
import alotLogo from '@/assets/alot-logo.png';
import { getCardBorderClass, getGradientColors } from '../utils';

interface MarketplaceCardProps {
  card: CollectCard | MarketplaceListing;
  index?: number;
  onClick?: () => void;
}

// Type guard to check if card is a marketplace listing
const isMarketplaceListing = (card: CollectCard | MarketplaceListing): card is MarketplaceListing => {
  return 'listing_type' in card && 'transfer_id' in card;
};

export const MarketplaceCard = memo(({ card, index = 0, onClick }: MarketplaceCardProps) => {
  const tier = getRarityTier(card.rarity_score);
  const isListing = isMarketplaceListing(card);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.03 }}
      className="relative group cursor-pointer"
      onClick={onClick}
    >
      {/* Mini Card */}
      <div className={`relative aspect-[3/4.5] rounded-2xl overflow-hidden border-4 border-white shadow-sticker ${getCardBorderClass(card)} bg-[#0a0a0f] group-hover:scale-105 transition-transform duration-300`}>
        {/* Gradient accent */}
        <div className={`absolute bottom-0 right-0 w-3/4 h-1/2 bg-gradient-to-tl ${getGradientColors(card)} blur-2xl opacity-60`} />
        
        {/* Card Header */}
        <div className="absolute top-2 left-2 z-10">
          <img 
            src={alotLogo} 
            alt="Alot!" 
            className="h-5 object-contain"
            draggable={false} 
          />
        </div>

        {/* Golden shimmer */}
        {card.is_golden && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/20 to-transparent"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
          />
        )}

        {/* Product image */}
        <div className="absolute inset-0 flex items-center justify-center p-4 pt-8">
          <img
            src={card.product_image}
            alt={card.product_reveal}
            className="w-full h-auto max-h-16 object-contain opacity-90"
          />
        </div>

        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
          <p className="text-amber-200/60 text-[8px] uppercase tracking-wider truncate">
            {card.brand}
          </p>
          <p className="text-amber-200/90 text-[10px] font-light truncate">
            {card.model}
          </p>
          
          {/* Rarity indicator */}
          <div className="flex items-center gap-1 mt-1">
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

          {/* Listing type badge */}
          {isListing && (
            <div className="flex items-center gap-1 mt-1 pt-1 border-t border-white/10">
              {card.listing_type === 'GIFT' ? (
                <>
                  <Gift className="w-2.5 h-2.5 text-pink-400" />
                  <span className="text-[9px] text-pink-400 font-medium">Free Gift</span>
                </>
              ) : (
                <>
                  <ArrowLeftRight className="w-2.5 h-2.5 text-blue-400" />
                  <span className="text-[9px] text-blue-400 font-medium">Open for Swap</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Golden badge */}
        {card.is_golden && (
          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-amber-400/90 text-black text-[7px] font-bold tracking-wider z-10">
            GOLDEN
          </div>
        )}

        {/* Listing type top badge */}
        {isListing && !card.is_golden && (
          <div className={`absolute top-2 right-2 px-1.5 py-0.5 rounded-full text-[7px] font-bold tracking-wider z-10 ${
            card.listing_type === 'GIFT' 
              ? 'bg-pink-500/90 text-white' 
              : 'bg-blue-500/90 text-white'
          }`}>
            {card.listing_type}
          </div>
        )}

        {/* Shine effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none rounded-xl" />
      </div>
    </motion.div>
  );
});

MarketplaceCard.displayName = 'MarketplaceCard';
