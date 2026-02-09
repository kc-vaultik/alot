/**
 * @fileoverview Golden Card Perks Component
 * Displays special perks for golden cards
 */

import { memo } from 'react';
import { Sparkles, Trophy, Gift, Coins } from 'lucide-react';

export const GoldenPerks = memo(() => {
  return (
    <div className="bg-gradient-to-r from-amber-500/20 to-yellow-500/10 rounded-xl p-4 border border-amber-400/40">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-5 h-5 text-amber-400" />
        <span className="text-amber-400 font-bold">Golden Card Perks</span>
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span className="text-white text-sm">Instant 100% Product Redemption</span>
        </div>
        <div className="flex items-center gap-2">
          <Gift className="w-4 h-4 text-amber-400" />
          <span className="text-white text-sm">+2 daily free packs</span>
        </div>
        <div className="flex items-center gap-2">
          <Coins className="w-4 h-4 text-amber-400" />
          <span className="text-white text-sm">Room entry fee waived</span>
        </div>
      </div>
      <button className="mt-4 w-full py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-sm font-bold hover:from-amber-400 hover:to-yellow-400 transition-all">
        Redeem Your Product Now
      </button>
    </div>
  );
});

GoldenPerks.displayName = 'GoldenPerks';
