/**
 * @fileoverview Sticky header for lot detail page
 * Design: "Digital Vandalism" - chunky LOT # display
 */

import { memo } from 'react';
import { ArrowLeft, Lock } from 'lucide-react';
import { ROOM_TIERS } from '../../constants';
import type { Room, RoomTier } from '../../types';

interface RoomDetailHeaderProps {
  room: Room;
  onBack: () => void;
}

export const RoomDetailHeader = memo(function RoomDetailHeader({
  room,
  onBack,
}: RoomDetailHeaderProps) {
  const tierConfig = ROOM_TIERS[room.tier as RoomTier];
  const isLocked = room.status === 'LOCKED';
  // Generate a lot number from the room ID (first 4 chars as hex -> decimal, mod 9999)
  const lotNumber = parseInt(room.id.replace(/-/g, '').substring(0, 4), 16) % 9999 + 1;

  return (
    <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border/30">
      <div className="flex items-center justify-between p-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Lots</span>
        </button>

        <div className="flex items-center gap-2">
          {isLocked && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold">
              <Lock className="w-3 h-3" />
              <span>LOCKED</span>
            </div>
          )}
          <div
            className={`px-4 py-1.5 rounded-full font-display text-sm bg-gradient-to-r ${tierConfig.color} text-black border-2 border-white shadow-sticker`}
          >
            LOT #{lotNumber}
          </div>
        </div>
      </div>
    </div>
  );
});
