/**
 * @fileoverview Entry card component showing room entry details
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Coins, Target, Users, Clock, TrendingUp } from 'lucide-react';
import { ROOM_TIERS, ECONOMY_MESSAGING } from '../../constants';
import { formatCents, formatTimeRemainingSimple } from '../../utils';
import type { Room, RoomTier } from '../../types';
import alotLogo from '@/assets/alot-logo.png';

interface EntryCardProps {
  room: Room;
  product?: {
    id: string;
    name: string;
    brand: string;
    image_url: string | null;
    retail_value_usd: number;
  } | null;
  /** Number of entries (chances) the user has */
  entries: number;
  totalEntries: number;
  isAnimating?: boolean;
}

export const EntryCard = memo(function EntryCard({
  room,
  product,
  entries,
  totalEntries,
  isAnimating = false,
}: EntryCardProps) {
  const tierConfig = ROOM_TIERS[room.tier as RoomTier];
  const fundingTarget = room.funding_target_cents || room.escrow_target_cents;
  const fundingProgress = fundingTarget > 0 
    ? Math.min((room.escrow_balance_cents / fundingTarget) * 100, 100) 
    : 0;
  
  const odds = totalEntries > 0 ? Math.round((entries / totalEntries) * 10000) / 100 : 100;
  const timeRemaining = formatTimeRemainingSimple(room.deadline_at || room.end_at);

  return (
    <motion.div
      className="relative w-72 sm:w-80 aspect-[3/4.5]"
      initial={isAnimating ? { scale: 0.8, opacity: 0, rotateY: -90 } : {}}
      animate={isAnimating ? { scale: 1, opacity: 1, rotateY: 0 } : {}}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-2xl overflow-hidden border-4 border-white shadow-sticker">
        {/* Gradient accent based on tier */}
        <div className={`absolute bottom-0 right-0 w-3/4 h-1/2 bg-gradient-to-tl ${tierConfig.color} blur-3xl opacity-20`} />
        
        {/* Ticket pattern overlay */}
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full" style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 10px,
              rgba(255,255,255,0.03) 10px,
              rgba(255,255,255,0.03) 20px
            )`
          }} />
        </div>

        {/* Logo */}
        <div className="absolute top-5 left-5 z-10">
          <img 
            src={alotLogo} 
            alt="Alot!" 
            className="h-10 object-contain"
            draggable={false} 
          />
        </div>

        {/* Tier badge */}
        <div className={`absolute top-5 right-5 px-2.5 py-1 rounded-full bg-gradient-to-r ${tierConfig.color} text-black text-xs font-bold`}>
          {tierConfig.name}
        </div>

        {/* Product section */}
        <div className="absolute top-20 inset-x-5">
          {product?.image_url ? (
            <div className="w-full h-28 flex items-center justify-center">
              <img 
                src={product.image_url} 
                alt={product.name}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          ) : (
            <div className="w-full h-28 flex items-center justify-center">
              <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                <Coins className="w-10 h-10 text-white/20" />
              </div>
            </div>
          )}
          
          <h3 className="text-white font-semibold text-center mt-3 text-lg truncate">
            {room.is_mystery ? 'Mystery Prize' : product?.name || `${tierConfig.name} Prize`}
          </h3>
          {product && (
            <p className="text-white/40 text-xs text-center">{product.brand}</p>
          )}
        </div>

        {/* Entry info - main focus */}
        <div className="absolute bottom-32 inset-x-5">
          <div className="bg-gradient-to-r from-cyan-500/10 via-violet-500/10 to-purple-600/10 rounded-xl p-4 border border-cyan-500/20">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Coins className="w-5 h-5 text-cyan-400" />
              <span className="text-cyan-400 text-sm font-medium">Your {ECONOMY_MESSAGING.ENTRIES.plural}</span>
            </div>
            <p className="text-4xl font-bold text-white text-center">{entries}</p>
            <div className="flex items-center justify-center gap-1 mt-2">
              <TrendingUp className="w-3.5 h-3.5 text-green-400" />
              <span className="text-green-400 text-sm font-medium">{odds}% chance</span>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="absolute bottom-5 inset-x-5">
          <div className="flex gap-2 text-xs">
            <div className="flex-1 bg-white/5 rounded-lg p-2 text-center">
              <div className="flex items-center justify-center gap-1 text-white/40 mb-0.5">
                <Target className="w-3 h-3" />
                <span>Funding</span>
              </div>
              <p className="text-white font-medium">{Math.round(fundingProgress)}%</p>
            </div>
            <div className="flex-1 bg-white/5 rounded-lg p-2 text-center">
              <div className="flex items-center justify-center gap-1 text-white/40 mb-0.5">
                <Users className="w-3 h-3" />
                <span>Total {ECONOMY_MESSAGING.ENTRIES.plural}</span>
              </div>
              <p className="text-white font-medium">{totalEntries}</p>
            </div>
            <div className="flex-1 bg-white/5 rounded-lg p-2 text-center">
              <div className="flex items-center justify-center gap-1 text-white/40 mb-0.5">
                <Clock className="w-3 h-3" />
                <span>Time</span>
              </div>
              <p className="text-white font-medium text-[10px]">{timeRemaining}</p>
            </div>
          </div>
        </div>

        {/* Shine effect */}
        <motion.div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.3) 50%, transparent 60%)',
            backgroundSize: '200% 100%',
          }}
          animate={{
            backgroundPosition: ['-100% 0%', '200% 0%'],
          }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
        />
      </div>
    </motion.div>
  );
});