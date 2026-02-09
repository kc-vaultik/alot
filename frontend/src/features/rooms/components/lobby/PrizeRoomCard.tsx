/**
 * @fileoverview Prize Room Card - "Digital Vandalism" Style
 * Sticker aesthetic: thick white borders, tilted elements, bubbling progress bar
 */

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, Users, Target, ChevronRight, Layers, Sparkles } from 'lucide-react';
import { ROOM_TIERS, getEntryTiersForRoom } from '../../constants';
import { formatCents, formatTimeRemaining } from '../../utils';
import type { Room, RoomTier } from '../../types';
import collectRoomPack from '@/assets/collect-room-pack.png';

interface PrizeRoomCardProps {
  room: Room;
  product?: {
    id: string;
    name: string;
    brand: string;
    image_url: string | null;
    retail_value_usd: number;
    category: string;
  } | null;
  onSelect: (room: Room) => void;
  userEntries?: number;
}

export const PrizeRoomCard = memo(function PrizeRoomCard({ 
  room, 
  product,
  onSelect, 
  userEntries = 0 
}: PrizeRoomCardProps) {
  const tierConfig = ROOM_TIERS[room.tier as RoomTier];
  
  // Show product retail value as the funding goal (not the 2.5x target)
  const productValueCents = product ? product.retail_value_usd * 100 : (room.tier_cap_cents || 0);
  const fundingTarget = productValueCents;
  const fundingProgress = fundingTarget > 0 
    ? Math.min((room.escrow_balance_cents / fundingTarget) * 100, 100) 
    : 0;
  
  const { time: timeRemaining, isLockingSoon } = useMemo(
    () => formatTimeRemaining(room.deadline_at || room.end_at, room.lock_at), 
    [room.deadline_at, room.end_at, room.lock_at]
  );
  
  const isFunded = room.status === 'FUNDED' || fundingProgress >= 100;
  const isDrawing = room.status === 'DRAWING';
  const isSettled = room.status === 'SETTLED';
  const isExpired = room.status === 'EXPIRED';
  const isMystery = room.is_mystery;
  const isUrgent = timeRemaining.includes('m') && !timeRemaining.includes('h');
  
  // Get entry tiers based on product value
  const entryTiers = getEntryTiersForRoom(productValueCents);
  const minEntry = entryTiers[0];

  return (
    <motion.button
      onClick={() => onSelect(room)}
      className={`
        w-full text-left transition-all overflow-hidden
        bg-card border-4 border-white rounded-2xl
        shadow-sticker hover:shadow-sticker-hover
        ${isSettled || isExpired ? 'opacity-70' : ''}
      `}
      style={{ transform: 'rotate(-1deg)' }}
      whileHover={{ y: -4, rotate: 0, scale: 1.02 }}
      whileTap={{ scale: 0.98, rotate: 0 }}
    >
      {/* Product Image Section */}
      <div className="relative h-40 overflow-hidden">
        {/* Layered gradient background - Hype Pack colors */}
        <div className="absolute inset-0 bg-background" />
        <div className="absolute -inset-6 bg-gradient-to-br from-primary/30 via-accent-blue/20 to-primary/30 blur-2xl" />
        <div className="absolute -inset-3 bg-gradient-to-br from-accent-blue/20 via-transparent to-primary/20 blur-xl" />
        
        {isMystery && !product ? (
          // Mystery room - show the pack image
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <img 
              src={collectRoomPack} 
              alt="Mystery Pack"
              className="h-full object-contain drop-shadow-2xl"
            />
            <Sparkles className="absolute top-4 right-4 w-6 h-6 text-primary animate-pulse" />
          </div>
        ) : product?.image_url ? (
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <img 
              src={product.image_url} 
              alt={product.name}
              className="max-h-full max-w-full object-contain drop-shadow-2xl"
            />
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center">
              <Layers className="w-10 h-10 text-muted-foreground" />
            </div>
          </div>
        )}
        
        {/* Countdown badge - urgent red bubble style */}
        <div className={`absolute top-3 left-3 px-3 py-1.5 rounded-full font-bold text-xs flex items-center gap-1.5 border-2 ${
          isUrgent 
            ? 'bg-warning/90 border-warning text-warning-foreground animate-pulse' 
            : 'bg-card/90 border-white text-foreground'
        }`}>
          <Clock className="w-3.5 h-3.5" />
          <span className="font-display tracking-wide">{timeRemaining}</span>
        </div>
        
        {/* Status badges - top right */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5">
          {userEntries > 0 && (
            <div className="px-2.5 py-1 rounded-full gradient-hype text-white text-xs font-bold flex items-center gap-1 border-2 border-white shadow-sticker">
              <Layers className="w-3 h-3" />
              {userEntries}
            </div>
          )}
          {isMystery && (
            <div className="px-2.5 py-1 rounded-full bg-accent-blue/90 text-white text-xs font-bold border-2 border-white">
              Mystery
            </div>
          )}
        </div>
        
        {/* Status overlay for completed rooms */}
        {(isDrawing || isSettled || isExpired) && (
          <div className={`absolute inset-0 flex items-center justify-center ${
            isDrawing ? 'bg-primary/30' : isSettled ? 'bg-success/20' : 'bg-destructive/20'
          } backdrop-blur-sm`}>
            <span className={`font-display text-lg ${
              isDrawing ? 'text-primary' : isSettled ? 'text-success' : 'text-destructive'
            }`}>
              {isDrawing ? 'DRAWING...' : isSettled ? 'WINNER!' : 'EXPIRED'}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Product name - Chunky font */}
        <h3 className="font-bold text-foreground text-lg mb-1 truncate">
          {isMystery && !product ? 'Mystery Lot' : product?.name || `${tierConfig.name} Prize`}
        </h3>
        {product && (
          <p className="text-xs text-muted-foreground mb-3 font-medium">{product.brand} • {product.category}</p>
        )}
        
        {/* Funding Progress - Bubbling liquid effect */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <div className="flex items-center gap-1.5 text-muted-foreground font-semibold">
              <Target className="w-3.5 h-3.5" />
              <span>{Math.round(fundingProgress)}% FUNDED</span>
            </div>
            <span className="text-foreground font-bold font-display">
              {formatCents(fundingTarget)}
            </span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden border-2 border-white/20">
            <motion.div
              className={`h-full rounded-full ${
                isFunded 
                  ? 'gradient-volt' 
                  : 'progress-liquid'
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${fundingProgress}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-muted-foreground">
            <span>{formatCents(room.escrow_balance_cents)}</span>
          </div>
        </div>

        {/* Stats row - Chunky icons */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
            <Users className="w-4 h-4" strokeWidth={2.5} />
            <span>{room.participant_count || 0} in</span>
          </div>
        </div>

        {/* Entry tiers preview - Sticker buttons */}
        {!isSettled && !isExpired && (
          <div className="flex gap-2 mb-4">
            {entryTiers.slice(0, 3).map((tier, idx) => (
              <div 
                key={tier.cents}
                className={`flex-1 py-2 rounded-xl text-center text-xs font-bold transition-colors border-2 ${
                  idx === 0 
                    ? 'gradient-hype text-white border-white shadow-sticker' 
                    : 'bg-muted text-muted-foreground border-border'
                }`}
                style={idx === 0 ? { transform: 'rotate(-1deg)' } : undefined}
              >
                {tier.label}
              </div>
            ))}
          </div>
        )}

        {/* Footer CTA - Big tilted button style */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="text-sm font-bold">
            {isSettled ? (
              <span className="text-success">View results</span>
            ) : isExpired ? (
              <span className="text-destructive">Claim refund</span>
            ) : isFunded ? (
              <span className="text-primary font-display">DRAWING!</span>
            ) : (
              <span className="gradient-hype-text font-display">
                GET IN ON THIS LOT
              </span>
            )}
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" strokeWidth={2.5} />
        </div>
      </div>
    </motion.button>
  );
});
