/**
 * @fileoverview Action buttons for lot detail - "Digital Vandalism" sticker style
 */

import { memo } from 'react';
import { LogOut, Loader2, Trophy, Layers } from 'lucide-react';

interface RoomActionsProps {
  canStake: boolean;
  canLeave: boolean;
  isWinner: boolean;
  onStake: () => void;
  onLeave: () => void;
  onClaim: () => void;
  isLeaving: boolean;
}

export const RoomActions = memo(function RoomActions({
  canStake,
  canLeave,
  isWinner,
  onStake,
  onLeave,
  onClaim,
  isLeaving,
}: RoomActionsProps) {
  return (
    <div className="px-4 pb-3 flex gap-3">
      {canStake && (
        <button
          className="flex-1 py-4 rounded-2xl gradient-hype text-white font-display text-base flex items-center justify-center gap-2 hover:shadow-lg transition-all border-4 border-white shadow-sticker transform -rotate-1"
          onClick={onStake}
        >
          <Layers className="w-5 h-5" strokeWidth={2.5} />
          ENTER LOT
        </button>
      )}
      {canLeave && (
        <button
          className="flex-1 py-4 rounded-2xl bg-zinc-800 text-white font-display text-base flex items-center justify-center gap-2 hover:bg-zinc-700 transition-all border-4 border-white/50 shadow-sticker transform rotate-1 disabled:opacity-50"
          onClick={onLeave}
          disabled={isLeaving}
        >
          {isLeaving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <LogOut className="w-5 h-5" strokeWidth={2.5} />
          )}
          LEAVE
        </button>
      )}
      {isWinner && (
        <button
          className="flex-1 py-4 rounded-2xl gradient-volt text-black font-display text-base flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-hype-green/30 transition-all border-4 border-white shadow-sticker transform -rotate-1"
          onClick={onClaim}
        >
          <Trophy className="w-5 h-5" strokeWidth={2.5} />
          CLAIM PRIZE
        </button>
      )}
    </div>
  );
});
