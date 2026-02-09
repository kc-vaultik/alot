/**
 * @fileoverview Product Info Component
 * Displays brand, model, traits, and value information
 */

import { memo } from 'react';
import { Sparkles, Tag, BadgeDollarSign, FileText } from 'lucide-react';
import { getRarityLabel } from '@/utils/styling';
import type { RarityTier } from '@/types/shared';
import { getTierColors, type TierColors } from './types';
import type { CardOrListing } from './types';

interface ProductInfoProps {
  card: CardOrListing;
  tier: RarityTier;
  tierColors: TierColors;
}

export const ProductInfo = memo(({ card, tier, tierColors }: ProductInfoProps) => {
  const productValue = card.product_value || 0;

  return (
    <div className="space-y-4">
      {/* Product Tier Badge - Sticker Style */}
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${tierColors.bg} border-4 border-white shadow-sticker transform -rotate-1`}>
        {tier !== 'icon' && <Sparkles className={`w-4 h-4 ${tierColors.text}`} strokeWidth={2.5} />}
        <span className={`text-sm font-display uppercase tracking-wide ${tierColors.text}`}>
          {card.is_golden ? 'GOLDEN CARD' : getRarityLabel(tier)}
        </span>
      </div>

      {/* Brand & Product Name */}
      <div className="space-y-1">
        <p className="text-muted-foreground text-sm font-medium uppercase tracking-wide">{card.brand}</p>
        <p className="text-foreground text-xl font-display">{card.model}</p>
      </div>

      {/* Traits - Sticker Pills */}
      {card.traits && card.traits.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {card.traits.map((trait, i) => (
            <span 
              key={i} 
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-500/20 text-violet-300 text-xs font-bold rounded-full border-2 border-white/30 shadow-sm"
            >
              <Tag className="w-3 h-3" strokeWidth={2.5} />
              {trait}
            </span>
          ))}
        </div>
      )}

      {/* Estimated Market Value - Sticker Box */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-card/80 border-4 border-white shadow-sticker transform rotate-[0.5deg]">
        <BadgeDollarSign className="w-5 h-5 text-hype-green" strokeWidth={2.5} />
        <span className="text-muted-foreground text-sm">Market Value:</span>
        <span className="text-hype-green font-display text-lg">${productValue.toLocaleString()}</span>
      </div>

      {/* Product Description */}
      {card.product_description && (
        <div className="rounded-2xl p-4 border-4 border-white/30 shadow-sticker bg-card/60 transform -rotate-[0.3deg]">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-muted-foreground" strokeWidth={2.5} />
            <span className="text-foreground/70 text-sm font-display">DESCRIPTION</span>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {card.product_description}
          </p>
        </div>
      )}
    </div>
  );
});

ProductInfo.displayName = 'ProductInfo';
