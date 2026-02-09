/**
 * @fileoverview Room preview card with lock status and user entry indicator
 */

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, Users, Wallet, Trophy, ChevronRight, Zap, Lock, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ROOM_TIERS, REWARD_CONFIG } from '../../constants';
import { formatCents, formatTimeRemaining } from '../../utils';
import type { Room, RoomTier } from '../../types';

interface RoomCardProps {
  room: Room;
  onSelect: (room: Room) => void;
  hasEntry?: boolean;
}

export const RoomCard = memo(function RoomCard({ room, onSelect, hasEntry }: RoomCardProps) {
  const { user } = useAuth();
  const tierConfig = ROOM_TIERS[room.tier as RoomTier];
  const participantPercent = (room.participant_count || 0) / room.max_participants * 100;
  const escrowPercent = room.escrow_balance_cents / room.escrow_target_cents * 100;
  const { time: timeRemaining, isLockingSoon } = useMemo(
    () => formatTimeRemaining(room.end_at, room.lock_at), 
    [room.end_at, room.lock_at]
  );
  const isFunded = room.is_funded || escrowPercent >= 100;
  const isUrgent = timeRemaining.includes('m') && !timeRemaining.includes('h') && !timeRemaining.includes('d');
  const isLocked = room.status === 'LOCKED';
  const isSettled = room.status === 'SETTLED';

  // Estimated rewards for this tier
  const tierMultiplier = REWARD_CONFIG.TIER_MULTIPLIERS[room.tier as RoomTier];
  const baseCredits = REWARD_CONFIG.BASE_PARTICIPATION_CREDITS[room.tier as RoomTier];
  const estimatedMinCredits = Math.floor(baseCredits * tierMultiplier);

  return (
    <motion.button
      onClick={() => onSelect(room)}
      className={`
        w-full rounded-xl sm:rounded-2xl text-left transition-all overflow-hidden
        bg-gradient-to-br from-white/[0.08] to-white/[0.02]
        border ${tierConfig.borderColor}
        hover:shadow-lg hover:shadow-black/20
        ${isLocked ? 'opacity-80' : ''}
      `}
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Tier banner */}
      <div className={`px-4 py-2 bg-gradient-to-r ${tierConfig.color}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-black/70" />
            <span className="text-sm font-semibold text-black">{tierConfig.name} Drop</span>
          </div>
          <div className="flex items-center gap-2">
            {hasEntry && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/20 text-black text-xs font-medium">
                <Check className="w-3 h-3" />
                <span>Entered</span>
              </div>
            )}
            <span className="text-xs font-medium text-black/70">
              Up to {formatCents(room.tier_cap_cents)}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Time and status row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${
              isUrgent ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white/60'
            }`}>
              <Clock className="w-3 h-3" />
              <span>{timeRemaining}</span>
              {isUrgent && <Zap className="w-3 h-3" />}
            </div>
            
            {isLockingSoon && !isLocked && (
              <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-amber-500/20 text-amber-400">
                <Lock className="w-3 h-3" />
                <span>Locking soon</span>
              </div>
            )}
            
            {isLocked && (
              <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-amber-500/20 text-amber-400">
                <Lock className="w-3 h-3" />
                <span>Locked</span>
              </div>
            )}
          </div>
          
          {isFunded && (
            <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">
              <Trophy className="w-3 h-3" />
              <span>Funded</span>
            </div>
          )}
        </div>

        {/* Progress sections */}
        <div className="space-y-3">
          {/* Participants */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <div className="flex items-center gap-1.5 text-white/60">
                <Users className="w-3.5 h-3.5" />
                <span>Participants</span>
              </div>
              <span className="text-white/80 font-medium">
                {room.participant_count || 0}/{room.max_participants}
              </span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${participantPercent}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* Escrow */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <div className="flex items-center gap-1.5 text-white/60">
                <Wallet className="w-3.5 h-3.5" />
                <span>Prize Pool</span>
              </div>
              <span className="text-white/80 font-medium">
                {formatCents(room.escrow_balance_cents)} / {formatCents(room.escrow_target_cents)}
              </span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${
                  isFunded 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                    : 'bg-gradient-to-r from-amber-500 to-yellow-500'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(escrowPercent, 100)}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/40">
              {isSettled ? 'View results' : isLocked ? 'View drop' : 'Tap to join'}
            </span>
            {!isSettled && (
              <span className="text-xs text-cyan-400">
                Min +{estimatedMinCredits} credits
              </span>
            )}
          </div>
          <ChevronRight className="w-4 h-4 text-white/40" />
        </div>
      </div>
    </motion.button>
  );
});
