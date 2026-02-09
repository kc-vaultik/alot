/**
 * @fileoverview In Play Status Component
 * Shows room participation status for staked cards
 */

import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Ticket, Clock, ExternalLink } from 'lucide-react';
import { formatDistanceToNow, isPast } from 'date-fns';
import type { CardOrListing } from './types';

interface Room {
  tier: string;
  end_at: string;
}

interface InPlayStatusProps {
  card: CardOrListing;
  stakedRoom: Room | null;
  onClose: () => void;
}

export const InPlayStatus = memo(({ card, stakedRoom, onClose }: InPlayStatusProps) => {
  const navigate = useNavigate();
  
  // Calculate time remaining for staked room
  const roomEndDate = stakedRoom?.end_at ? new Date(stakedRoom.end_at) : null;
  const roomEnded = roomEndDate ? isPast(roomEndDate) : false;
  const timeRemaining = roomEndDate && !roomEnded 
    ? formatDistanceToNow(roomEndDate, { addSuffix: true }) 
    : null;

  const getTierBadgeClasses = (tier: string) => {
    switch (tier) {
      case 'MYTHIC': return 'bg-amber-500/20 text-amber-400';
      case 'GRAIL': return 'bg-violet-500/20 text-violet-400';
      case 'RARE': return 'bg-blue-500/20 text-blue-400';
      default: return 'bg-white/10 text-white/70';
    }
  };

  return (
    <div className="rounded-2xl p-4 border-4 border-white shadow-sticker bg-cyan-500/15 transform -rotate-[0.5deg]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Lock className="w-5 h-5 text-cyan-400" strokeWidth={2.5} />
          <span className="text-cyan-400 font-display text-base">IN PLAY</span>
        </div>
        {stakedRoom && (
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border-2 border-white ${getTierBadgeClasses(stakedRoom.tier)}`}>
            {stakedRoom.tier} LOT
          </span>
        )}
      </div>
      
      <p className="text-white/70 text-sm mb-3">
        This card is competing in a Lot. Actions are locked until the lot ends.
      </p>
      
      {/* Lot Details */}
      {stakedRoom && (
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-white/60 text-xs">
            <Ticket className="w-4 h-4" />
            <span>You're entered to win this product</span>
          </div>
          
          {timeRemaining && (
            <div className="flex items-center gap-2 text-white/60 text-xs">
              <Clock className="w-4 h-4" />
              <span>Ends {timeRemaining}</span>
            </div>
          )}
          
          {roomEnded && (
            <div className="flex items-center gap-2 text-amber-400 text-xs">
              <Clock className="w-4 h-4" />
              <span>Lot has ended - awaiting settlement</span>
            </div>
          )}
        </div>
      )}
      
      {!stakedRoom && (
        <div className="flex items-center gap-2 text-white/60 text-xs mb-4">
          <Ticket className="w-4 h-4" />
          <span>You're entered to win this product</span>
        </div>
      )}
      
      {/* View Lot Button */}
      {card.staked_room_id && (
        <button
          onClick={() => {
            onClose();
            navigate(`/collect-room?selected_room=${card.staked_room_id}`);
          }}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl gradient-hype text-white border-2 border-white shadow-sticker hover:shadow-lg transition-all text-sm font-display transform rotate-[0.5deg]"
        >
          <ExternalLink className="w-4 h-4" strokeWidth={2.5} />
          VIEW LOT DETAILS
        </button>
      )}
    </div>
  );
});

InPlayStatus.displayName = 'InPlayStatus';
