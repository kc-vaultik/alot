/**
 * @fileoverview Lot leaderboard component
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Award, User, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type { LeaderboardEntry } from '../../types';

interface RoomLeaderboardProps {
  entries: LeaderboardEntry[];
  isLoading?: boolean;
}

function getRankIcon(rank: number) {
  switch (rank) {
    case 1:
      return <Trophy className="w-5 h-5 text-amber-400" strokeWidth={2.5} />;
    case 2:
      return <Medal className="w-5 h-5 text-zinc-300" strokeWidth={2.5} />;
    case 3:
      return <Award className="w-5 h-5 text-amber-700" strokeWidth={2.5} />;
    default:
      return <span className="font-display text-sm text-white/40 w-5 text-center">{rank}</span>;
  }
}

export const RoomLeaderboard = memo(function RoomLeaderboard({
  entries,
  isLoading,
}: RoomLeaderboardProps) {
  const { user } = useAuth();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-14 bg-white/5 rounded-xl border-2 border-white/10 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <div className="text-center py-8 px-4 bg-zinc-900 rounded-2xl border-4 border-white shadow-sticker transform -rotate-[0.5deg]">
        <Users className="w-10 h-10 mx-auto mb-2 text-white/30" strokeWidth={2.5} />
        <p className="font-display text-white/60 text-lg">NO ENTRIES YET</p>
        <p className="text-sm text-white/40 font-semibold">Be the first to enter!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry, index) => {
        const isMe = user?.id === entry.user_id;
        const rcPercent = Math.min(
          100,
          (entry.stake_snapshot.rc_cents / entry.stake_snapshot.product_value_cents) * 100
        );
        const isTopThree = entry.rank <= 3;

        return (
          <motion.div
            key={entry.entry_id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`
              flex items-center gap-3 p-3 rounded-xl
              ${isMe 
                ? 'bg-violet-500/20 border-4 border-violet-400 shadow-sticker transform -rotate-[0.3deg]' 
                : isTopThree
                  ? 'bg-zinc-800 border-2 border-white/30 shadow-sticker'
                  : 'bg-white/5 border border-white/10'
              }
              ${entry.rank === 1 ? 'border-4 border-amber-400 shadow-[0_4px_20px_rgba(251,191,36,0.3)]' : ''}
            `}
          >
            {/* Rank - sticker style for top 3 */}
            <div className={`w-8 h-8 flex items-center justify-center rounded-lg ${
              isTopThree ? 'bg-white/10 border-2 border-white/30' : ''
            }`}>
              {getRankIcon(entry.rank)}
            </div>

            {/* Avatar */}
            <div className="w-10 h-10 rounded-xl bg-white/10 border-2 border-white/20 flex items-center justify-center overflow-hidden">
              {entry.avatar_url ? (
                <img
                  src={entry.avatar_url}
                  alt={entry.display_name || entry.username || 'User'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-5 h-5 text-white/40" strokeWidth={2.5} />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white truncate">
                  {entry.display_name || entry.username || 'Anonymous'}
                </span>
                {isMe && (
                  <span className="text-xs font-display text-violet-400 bg-violet-500/20 px-2 py-0.5 rounded-full">(YOU)</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-white/40 font-semibold">
                <span className="truncate">{entry.stake_snapshot.product_name}</span>
                <span>•</span>
                <span>{entry.stake_snapshot.band}</span>
              </div>
            </div>

            {/* Score - chunky display */}
            <div className="text-right">
              <div className={`font-display text-lg ${entry.rank === 1 ? 'text-amber-400' : 'text-white'}`}>
                {entry.priority_score?.toFixed(1) || '—'}
              </div>
              <div className="text-xs text-white/40 font-semibold">
                {rcPercent.toFixed(0)}% RC
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
});
