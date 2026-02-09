/**
 * @fileoverview Stats grid showing time, entries, and max value
 */

import { memo } from 'react';
import { Clock, Users, Trophy } from 'lucide-react';
import { formatCents } from '../../utils';

interface RoomStatsGridProps {
  timeRemaining: string;
  participantCount: number;
  maxParticipants: number;
  tierCapCents: number;
}

export const RoomStatsGrid = memo(function RoomStatsGrid({
  timeRemaining,
  participantCount,
  maxParticipants,
  tierCapCents,
}: RoomStatsGridProps) {
  return (
    <div className="grid grid-cols-3 gap-2 mb-3">
      {/* Time - sticker style with tilt */}
      <div className="rounded-2xl p-3 bg-zinc-900 border-4 border-white shadow-sticker transform -rotate-1 min-h-[80px]">
        <div className="flex items-center gap-1.5 text-white/60 text-[10px] font-bold mb-1">
          <Clock className="w-3.5 h-3.5" strokeWidth={2.5} />
          <span>ENDS IN</span>
        </div>
        <div className="font-display text-white text-base leading-tight">
          {timeRemaining.includes(' ') ? (
            <>
              <span className="block">{timeRemaining.split(' ')[0]}</span>
              <span className="block text-sm text-white/80">{timeRemaining.split(' ')[1]}</span>
            </>
          ) : (
            <span className="block">{timeRemaining}</span>
          )}
        </div>
      </div>

      {/* Participants - sticker style with tilt */}
      <div className="rounded-2xl p-3 bg-zinc-900 border-4 border-white shadow-sticker transform rotate-[0.5deg] min-h-[80px]">
        <div className="flex items-center gap-1.5 text-white/60 text-[10px] font-bold mb-1">
          <Users className="w-3.5 h-3.5" strokeWidth={2.5} />
          <span>ENTRIES</span>
        </div>
        <div className="font-display text-white text-xl leading-tight">
          {participantCount}
          <span className="text-sm text-white/50">/{maxParticipants}</span>
        </div>
      </div>

      {/* Cap - sticker style with tilt */}
      <div className="rounded-2xl p-3 bg-zinc-900 border-4 border-white shadow-sticker transform -rotate-[0.5deg] min-h-[80px]">
        <div className="flex items-center gap-1.5 text-white/60 text-[10px] font-bold mb-1">
          <Trophy className="w-3.5 h-3.5" strokeWidth={2.5} />
          <span>MAX VALUE</span>
        </div>
        <div className="font-display text-white text-xl leading-tight">
          {formatCents(tierCapCents)}
        </div>
      </div>
    </div>
  );
});
