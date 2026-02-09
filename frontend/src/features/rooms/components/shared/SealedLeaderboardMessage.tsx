/**
 * @fileoverview Message displayed when leaderboard is sealed
 * "Digital Vandalism" sticker aesthetic
 */

import { memo } from 'react';
import { Lock, Shield, Calculator } from 'lucide-react';
import { formatLockTime } from '../../utils';

interface SealedLeaderboardMessageProps {
  lockAt?: string;
}

export const SealedLeaderboardMessage = memo(function SealedLeaderboardMessage({
  lockAt,
}: SealedLeaderboardMessageProps) {

  return (
    <div className="p-4 rounded-2xl bg-amber-500/10 border-4 border-white shadow-sticker transform -rotate-1">
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-xl bg-amber-500/20 border-2 border-amber-400/30">
          <Lock className="w-5 h-5 text-amber-400" strokeWidth={2.5} />
        </div>
        <div className="flex-1">
          <h4 className="font-display text-base text-amber-300 mb-1 tracking-wide">
            LEADERBOARD SEALED
          </h4>
          <p className="text-xs text-white/60 leading-relaxed">
            This LOT is sealed to prevent last-minute gaming. Your score is visible 
            only to you until this LOT ends.
          </p>
          
          <div className="mt-3 space-y-2 text-xs text-white/50">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-cyan-400" strokeWidth={2.5} />
              <span className="font-medium">Outcome calculated by published formula</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-400" strokeWidth={2.5} />
              <span className="font-medium">You can always see your score & how to improve</span>
            </div>
          </div>

          {lockAt && (
            <div className="mt-3 pt-2 border-t border-white/20 text-xs text-white/50 font-medium">
              LOT locked at: {formatLockTime(lockAt)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
