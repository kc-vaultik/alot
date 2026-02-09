/**
 * @fileoverview Participant list showing entry holders
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Users, Layers, Crown, Medal } from 'lucide-react';
import { ECONOMY_MESSAGING } from '../../constants';

interface Participant {
  user_id: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
  /** Number of entries (chances) in the draw */
  entries: number;
  rank: number;
}

interface ParticipantListProps {
  participants: Participant[];
  totalEntries: number;
  currentUserId?: string;
  isLoading?: boolean;
}

export const ParticipantList = memo(function ParticipantList({
  participants,
  totalEntries,
  currentUserId,
  isLoading,
}: ParticipantListProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl p-4 bg-white/5 border border-white/10 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-white/40" />
          <span className="text-white/60 text-sm">Participants</span>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-white/5 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const sortedParticipants = [...participants].sort((a, b) => b.entries - a.entries);

  return (
    <div className="rounded-2xl p-4 bg-zinc-900 border-4 border-white shadow-sticker mb-4 transform -rotate-[0.5deg]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-hype-blue" />
          <span className="text-white font-display text-sm">PLAYERS</span>
        </div>
        <span className="text-xs text-white/60 font-medium bg-white/10 px-2 py-1 rounded-full">{participants.length} joined</span>
      </div>

      {sortedParticipants.length === 0 ? (
        <div className="text-center py-6 text-white/60 font-display">
          BE THE FIRST TO ENTER!
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {sortedParticipants.map((participant, idx) => {
            const odds = totalEntries > 0 
              ? ((participant.entries / totalEntries) * 100).toFixed(1) 
              : '0';
            const isCurrentUser = participant.user_id === currentUserId;
            const isTopThree = idx < 3;

            return (
              <motion.div
                key={participant.user_id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  isCurrentUser 
                    ? 'bg-cyan-500/10 border border-cyan-500/30' 
                    : 'bg-white/[0.02] hover:bg-white/[0.05]'
                }`}
              >
                {/* Rank indicator */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-display ${
                  idx === 0 ? 'bg-amber-500/30 text-amber-400 border-2 border-amber-400/50' :
                  idx === 1 ? 'bg-zinc-400/30 text-zinc-300 border-2 border-zinc-400/50' :
                  idx === 2 ? 'bg-orange-500/30 text-orange-400 border-2 border-orange-400/50' :
                  'bg-white/10 text-white/50 border border-white/20'
                }`}>
                  {idx === 0 ? <Crown className="w-4 h-4" /> :
                   idx === 1 || idx === 2 ? <Medal className="w-4 h-4" /> :
                   idx + 1}
                </div>

                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500/30 to-purple-600/30 flex items-center justify-center">
                  {participant.avatar_url ? (
                    <img 
                      src={participant.avatar_url} 
                      alt="" 
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-xs font-medium text-white/60">
                      {(participant.display_name || participant.username || 'A')[0].toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm truncate ${isCurrentUser ? 'text-cyan-300 font-medium' : 'text-white/80'}`}>
                    {isCurrentUser ? 'You' : participant.display_name || participant.username || `Player ${idx + 1}`}
                  </p>
                </div>

                {/* Entries and odds */}
                <div className="text-right">
                  <div className="flex items-center gap-1 text-white/80">
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-sm font-medium">{participant.entries}</span>
                  </div>
                  <span className={`text-xs ${isTopThree ? 'text-green-400' : 'text-white/40'}`}>
                    {odds}%
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
});