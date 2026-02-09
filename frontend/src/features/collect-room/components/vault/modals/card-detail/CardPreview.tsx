/**
 * @fileoverview Card Preview Component
 * Displays the visual card representation with product image and card info
 */

import { memo } from 'react';
import alotLogo from '@/assets/alot-logo.png';
import { getCardBorderClass, getGradientColors } from '@/utils/styling';
import { formatDigitalNumber, getExpireDate } from '@/features/collect-room/utils/formatters';
import type { CardOrListing } from './types';

interface CardPreviewProps {
  card: CardOrListing;
  isListing: boolean;
}

export const CardPreview = memo(({ card, isListing }: CardPreviewProps) => {
  return (
    <div className={`relative aspect-[3/4.5] rounded-2xl overflow-hidden border-4 border-white shadow-sticker ${getCardBorderClass(card)} bg-[#0a0a0f] w-full max-w-[280px] mx-auto transform -rotate-1`}>
      {/* Gradient accent */}
      <div className={`absolute bottom-0 right-0 w-3/4 h-1/2 bg-gradient-to-tl ${getGradientColors(card)} blur-2xl opacity-60`} />
      
      {/* Card Header */}
      <div className="absolute top-4 left-4 z-10">
        <img 
          src={alotLogo} 
          alt="Alot!" 
          className="h-10 object-contain"
          draggable={false} 
        />
      </div>

      {/* Product image */}
      <div className="absolute inset-x-0 top-[15%] bottom-[35%] flex items-center justify-center pointer-events-none z-10">
        <img 
          src={card.product_image}
          alt={card.product_reveal}
          className="max-w-[140px] max-h-[140px] object-contain drop-shadow-2xl"
          draggable={false}
        />
      </div>

      {/* Card Footer Info */}
      <div className="absolute bottom-5 left-5 right-5 z-10">
        <p className="text-amber-200/60 text-[8px] tracking-[0.15em] uppercase mb-0.5 font-medium">
          UNIQUE DIGITAL NUMBER
        </p>
        <p className="text-amber-200/90 text-xs font-light tracking-[0.1em] mb-3 whitespace-nowrap font-display">
          {formatDigitalNumber(card.serial_number)}
        </p>
        <p className="text-amber-200/60 text-[8px] tracking-[0.15em] uppercase mb-0.5 font-medium">
          VALID FOR LOTS UNTIL
        </p>
        <p className="text-amber-200/90 text-sm font-display">
          {getExpireDate(card.card_id)}
        </p>
      </div>

      {/* Golden badge - Sticker style */}
      {card.is_golden && (
        <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-amber-400 text-black text-[10px] font-display tracking-wider z-10 border-2 border-white shadow-sticker">
          GOLDEN
        </div>
      )}

      {/* Listing type badge - Sticker style */}
      {isListing && !card.is_golden && 'listing_type' in card && (
        <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-display tracking-wider z-10 border-2 border-white shadow-sticker ${
          card.listing_type === 'GIFT' 
            ? 'bg-hype-pink text-white' 
            : 'bg-hype-blue text-white'
        }`}>
          {card.listing_type}
        </div>
      )}

      {/* Premium shine effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5 pointer-events-none rounded-2xl" />
    </div>
  );
});

CardPreview.displayName = 'CardPreview';
