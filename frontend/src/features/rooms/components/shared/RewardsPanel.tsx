/**
 * @fileoverview Panel showing lot rewards after settlement
 * User-facing terms: Credits, Rarity, Collector Level
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Gift, Coins, Package, Trophy, Star, CheckCircle, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PERCENTILE_BAND_LABELS } from '../../constants';
import { BAND_COLORS } from '../../utils';
import type { PercentileBand, RoomTier } from '../../types';

interface RewardsPanelProps {
  tier: RoomTier;
  percentileBand: PercentileBand;
  finalRank: number;
  creditsAwarded: number;
  packsAwarded: number;
  isWinner?: boolean;
  onOpenPacks?: () => void;
}

export const RewardsPanel = memo(function RewardsPanel({
  tier,
  percentileBand,
  finalRank,
  creditsAwarded,
  packsAwarded,
  isWinner,
  onOpenPacks,
}: RewardsPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-2xl bg-zinc-900 border-4 border-white shadow-sticker transform -rotate-[0.5deg]"
    >
      {/* Header with settlement confirmation */}
      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/20">
        <div className="p-1.5 rounded-full bg-green-500/20 border-2 border-green-400">
          <CheckCircle className="w-4 h-4 text-green-400" strokeWidth={3} />
        </div>
        <div>
          <h3 className="font-display text-green-400 text-sm tracking-wide">LOT SETTLED — WINNER CONFIRMED</h3>
          <p className="text-xs text-white/50">Winner randomly drawn from entries</p>
        </div>
      </div>

      {/* Rank and tier info */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-violet-500/20 border-2 border-violet-400/50">
            <Gift className="w-5 h-5 text-violet-400" strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Your Rewards</h3>
            <p className="text-xs text-white/50 font-display">{tier} LOT</p>
          </div>
        </div>
        
        {/* Rank badge - sticker style */}
        <div className={`px-4 py-2 rounded-xl bg-gradient-to-r ${BAND_COLORS[percentileBand]} text-black font-display text-lg border-2 border-white shadow-sticker transform rotate-2`}>
          #{finalRank}
        </div>
      </div>

      {/* Winner banner */}
      {isWinner && (
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="mb-4 p-3 rounded-xl bg-gradient-to-r from-amber-500/30 to-yellow-500/30 border-4 border-amber-400 shadow-sticker transform rotate-[0.5deg]"
        >
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400" strokeWidth={2.5} />
            <span className="font-display text-amber-300 text-base tracking-wide">
              WINNER! CLAIM YOUR PRIZE ABOVE
            </span>
          </div>
        </motion.div>
      )}

      {/* Percentile band */}
      <div className="mb-4 p-3 rounded-xl bg-white/10 border-2 border-white/30">
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/50 font-semibold">Performance Band</span>
          <div className="flex items-center gap-1.5">
            <Star className="w-4 h-4 text-amber-400" strokeWidth={2.5} />
            <span className="text-sm font-bold text-white">
              {percentileBand}-Tier ({PERCENTILE_BAND_LABELS[percentileBand]})
            </span>
          </div>
        </div>
      </div>

      {/* Rewards breakdown */}
      <div className="space-y-3">
        {/* Credits */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-cyan-500/10 border-2 border-cyan-400/50 transform -rotate-[0.3deg]">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-cyan-400" strokeWidth={2.5} />
            <span className="text-sm text-white/80 font-semibold">Credits Earned</span>
          </div>
          <span className="font-display text-xl text-cyan-400">
            +{creditsAwarded.toLocaleString()}
          </span>
        </div>

        {/* Packs */}
        {packsAwarded > 0 && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-violet-500/20 border-2 border-violet-400/50 transform rotate-[0.3deg]">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-violet-400" strokeWidth={2.5} />
              <span className="text-sm text-white/80 font-semibold">Reward Packs</span>
            </div>
            <span className="font-display text-xl text-violet-400">
              +{packsAwarded}
            </span>
          </div>
        )}
      </div>

      {/* Open packs button */}
      {packsAwarded > 0 && onOpenPacks && (
        <Button
          className="w-full mt-4 gradient-hype border-2 border-white shadow-sticker font-display text-base tracking-wide transform rotate-[0.5deg] hover:scale-[1.02] transition-transform"
          onClick={onOpenPacks}
        >
          <Package className="w-5 h-5 mr-2" strokeWidth={2.5} />
          OPEN {packsAwarded} REWARD PACK{packsAwarded > 1 ? 'S' : ''}
        </Button>
      )}

      {/* Formula info */}
      <div className="mt-3 p-2 rounded-lg bg-white/5 flex items-center gap-2">
        <Calculator className="w-3.5 h-3.5 text-white/40" />
        <p className="text-xs text-white/40">
          Credits added to your Stash automatically
        </p>
      </div>
    </motion.div>
  );
});
