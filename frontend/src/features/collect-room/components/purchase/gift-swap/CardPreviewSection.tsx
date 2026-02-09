/**
 * @fileoverview Card Preview Section
 * Shared card preview for gift/swap modals
 */

import { memo } from 'react';
import type { CollectCard } from '@/features/collect-room/types';
import { getRarityTier, getRarityLabel } from '@/utils/styling';

interface CardPreviewSectionProps {
  card: CollectCard;
}

export const CardPreviewSection = memo(({ card }: CardPreviewSectionProps) => {
  const tier = getRarityTier(card.rarity_score);

  return (
    <div className="p-6 border-b border-white/10">
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center overflow-hidden">
          <img 
            src={card.product_image} 
            alt={card.model}
            className="max-w-full max-h-full object-contain"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white/50 text-xs">{card.brand}</p>
          <p className="text-white font-medium truncate">{card.model}</p>
          <p className="text-violet-400 text-sm font-medium">${card.product_value?.toLocaleString()}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              tier === 'mythic' ? 'bg-amber-500/20 text-amber-400' :
              tier === 'grail' ? 'bg-violet-500/20 text-violet-400' :
              tier === 'rare' ? 'bg-blue-500/20 text-blue-400' :
              'bg-white/10 text-white/60'
            }`}>
              {getRarityLabel(tier)}
            </span>
            {card.is_golden && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-400">
                GOLDEN
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

CardPreviewSection.displayName = 'CardPreviewSection';
