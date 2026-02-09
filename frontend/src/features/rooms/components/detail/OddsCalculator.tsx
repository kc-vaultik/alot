/**
 * @fileoverview Odds calculator showing user's win probability
 */

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Layers, TrendingUp, Plus, Calculator } from 'lucide-react';
import { getEntryTiersForRoom, ECONOMY_MESSAGING } from '../../constants';

interface OddsCalculatorProps {
  userEntries: number;
  totalEntries: number;
  productValueCents?: number;
  onBuyMore?: () => void;
}

export const OddsCalculator = memo(function OddsCalculator({
  userEntries,
  totalEntries,
  productValueCents = 0,
  onBuyMore,
}: OddsCalculatorProps) {
  const odds = useMemo(() => {
    if (totalEntries === 0) return userEntries > 0 ? 100 : 0;
    return (userEntries / totalEntries) * 100;
  }, [userEntries, totalEntries]);

  const entryTiers = getEntryTiersForRoom(productValueCents);
  const minEntryCost = entryTiers[0];

  // Calculate what odds would be after buying more
  const projectedOdds = useMemo(() => {
    if (!minEntryCost) return odds;
    const newUserEntries = userEntries + minEntryCost.entries;
    const newTotal = totalEntries + minEntryCost.entries;
    return (newUserEntries / newTotal) * 100;
  }, [userEntries, totalEntries, minEntryCost, odds]);

  const oddsIncrease = projectedOdds - odds;

  return (
    <div className="rounded-2xl border-4 border-white shadow-sticker mb-4 transform -rotate-[0.5deg] overflow-hidden">
      <div className="p-4 bg-zinc-900">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="w-5 h-5 text-hype-pink" />
          <span className="text-white font-display text-sm">YOUR ODDS</span>
        </div>

        {/* Main odds display */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-baseline gap-1">
              <motion.span 
                className="text-5xl font-display text-white"
                key={odds}
                initial={{ scale: 1.2, color: '#ec4899' }}
                animate={{ scale: 1, color: '#ffffff' }}
                transition={{ duration: 0.3 }}
              >
                {odds.toFixed(1)}
              </motion.span>
              <span className="text-2xl font-display text-white/50">%</span>
            </div>
            <p className="text-xs text-white/60 font-medium">chance to win</p>
          </div>

          {/* Entry count */}
          <div className="text-right">
            <div className="flex items-center gap-1.5 justify-end">
              <Layers className="w-5 h-5 text-hype-blue" />
              <span className="text-3xl font-display text-white">{userEntries}</span>
            </div>
            <p className="text-xs text-white/60 font-medium">your {ECONOMY_MESSAGING.ENTRIES.plural.toLowerCase()}</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-zinc-800 rounded-xl p-3 border-2 border-white/30 transform -rotate-1">
            <p className="text-xs text-white/50 mb-1 uppercase tracking-wide font-medium">Total {ECONOMY_MESSAGING.ENTRIES.plural}</p>
            <p className="text-xl font-display text-white">{totalEntries.toLocaleString()}</p>
          </div>
          <div className="bg-zinc-800 rounded-xl p-3 border-2 border-white/30 transform rotate-1">
            <p className="text-xs text-white/50 mb-1 uppercase tracking-wide font-medium">Your Share</p>
            <p className="text-xl font-display text-white">
              {totalEntries > 0 ? `${((userEntries / totalEntries) * 100).toFixed(2)}%` : '0%'}
            </p>
          </div>
        </div>

        {/* Buy more callout */}
        {onBuyMore && (
          <button
            onClick={onBuyMore}
            className="w-full flex items-center justify-between p-3 rounded-xl gradient-hype border-2 border-white shadow-sticker transform rotate-[0.5deg] transition-transform hover:scale-[1.02] group"
          >
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-white/20">
                <Plus className="w-4 h-4 text-white" />
              </div>
              <div className="text-left">
                <p className="text-sm text-white font-display">BUY MORE ENTRIES</p>
                <p className="text-xs text-white/70 font-medium">
                  +{minEntryCost?.entries} entries for {minEntryCost?.label}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-white bg-white/20 px-2 py-1 rounded-lg">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-display">+{oddsIncrease.toFixed(1)}%</span>
            </div>
          </button>
        )}

        {/* No entries message */}
        {userEntries === 0 && onBuyMore && (
          <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <p className="text-sm text-amber-300 text-center">
              You haven't entered yet. Buy entries to join!
            </p>
          </div>
        )}
      </div>
    </div>
  );
});