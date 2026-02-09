/**
 * @fileoverview Display of user's staked card - matching My Collection card design
 * User-facing terms: Power, Progress, Rarity
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Star, Zap } from 'lucide-react';
import alotLogo from '@/assets/alot-logo.png';
import { formatCents } from '@/utils/formatters';
import { getCardBorderClass, getGradientColors, getRarityLabel, getBandTier } from '@/utils/styling';
import type { LeaderboardEntry, RoomTier } from '../../types';

interface StakedCardDisplayProps {
  entry: LeaderboardEntry;
  tier: RoomTier;
}

export const StakedCardDisplay = memo(function StakedCardDisplay({
  entry,
  tier,
}: StakedCardDisplayProps) {
  // Defensive null check - don't render if no stake data
  if (!entry?.stake_snapshot) return null;

  const { stake_snapshot, priority_score } = entry;
  const productName = stake_snapshot?.product_name || 'Unknown';
  const productValueCents = stake_snapshot?.product_value_cents || 0;
  const rcCents = stake_snapshot?.rc_cents || 0;
  const band = stake_snapshot?.band || 'ICON';
  const progressPercent = productValueCents > 0 ? (rcCents / productValueCents) * 100 : 0;

  const rarityTier = getBandTier(band);

  return (
    <div className="mb-6">
      {/* Section title */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <Star className="w-4 h-4 text-amber-400" />
        <span className="text-sm font-medium text-white/80">Your Staked Card</span>
      </div>

      {/* Centered Card - matching My Collection design */}
      <div className="flex justify-center mb-4">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="relative w-48 sm:w-56"
        >
          {/* Card */}
          <div className={`relative aspect-[3/4.5] rounded-2xl overflow-hidden border-4 border-white shadow-sticker ${getCardBorderClass(rarityTier)} bg-[#0a0a0f]`}>
            {/* Gradient accent */}
            <div className={`absolute bottom-0 right-0 w-3/4 h-1/2 bg-gradient-to-tl ${getGradientColors(rarityTier)} blur-2xl opacity-60`} />
            
            {/* Logo */}
            <div className="absolute top-3 left-3 z-10">
              <img 
                src={alotLogo} 
                alt="Alot!" 
                className="h-6 object-contain"
                draggable={false} 
              />
            </div>

            {/* Product image placeholder - centered */}
            <div className="absolute inset-0 flex items-center justify-center p-6 pt-12">
              <Sparkles className="w-16 h-16 text-white/30" />
            </div>

            {/* Bottom info */}
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
              <p className="text-amber-200/60 text-[10px] uppercase tracking-wider truncate">
                {band}
              </p>
              <div className="flex items-center justify-between">
                <p className="text-amber-200/90 text-xs font-light truncate flex-1">
                  {productName}
                </p>
                <p className="text-violet-400 text-xs font-medium ml-2">
                  {formatCents(productValueCents)}
                </p>
              </div>
              
              {/* Rarity indicator */}
              <div className="flex items-center gap-1 mt-1">
                {rarityTier !== 'icon' && (
                  <Sparkles className={`w-3 h-3 ${
                    rarityTier === 'mythic' ? 'text-amber-400' :
                    rarityTier === 'grail' ? 'text-violet-400' :
                    'text-blue-400'
                  }`} />
                )}
                <span className={`text-[10px] ${
                  rarityTier === 'mythic' ? 'text-amber-400' :
                  rarityTier === 'grail' ? 'text-violet-400' :
                  rarityTier === 'rare' ? 'text-blue-400' :
                  'text-white/50'
                }`}>
                  {getRarityLabel(rarityTier)}
                </span>
              </div>
            </div>

            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none rounded-xl" />
          </div>
        </motion.div>
      </div>

      {/* Stats below card - centered */}
      <div className="max-w-xs mx-auto space-y-3">
        {/* Power */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-violet-400" />
            <span className="text-sm text-white/70">Power</span>
          </div>
          <span className="text-lg font-bold text-violet-400">
            {priority_score?.toFixed(1) || '—'}
          </span>
        </div>

        {/* Progress */}
        <div className="p-3 rounded-lg bg-white/5 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-white/70">Progress</span>
            </div>
            <span className="text-sm font-medium text-cyan-400">
              {progressPercent.toFixed(0)}%
            </span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full transition-all"
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
});
