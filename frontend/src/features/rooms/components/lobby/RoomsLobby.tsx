/**
 * @fileoverview Main drops lobby with improved UI/UX
 */

import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, RefreshCw, Trophy, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRooms } from '../../hooks';
import { RoomCard } from './RoomCard';
import { RoomDetailPage } from '../RoomDetailPage';
import { ROOM_TIERS } from '../../constants';
import type { Room, RoomTier } from '../../types';
const TIERS: RoomTier[] = ['ICON', 'RARE', 'GRAIL', 'MYTHIC'];
export const RoomsLobby = memo(function RoomsLobby() {
  const [selectedTier, setSelectedTier] = useState<RoomTier | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const {
    data,
    isLoading,
    refetch,
    isRefetching
  } = useRooms(selectedTier || undefined);
  const rooms = data?.rooms || [];
  if (selectedRoom) {
    return <RoomDetailPage room={selectedRoom} onBack={() => setSelectedRoom(null)} />;
  }
  return <div className="min-h-full">
      {/* Tier tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
        <button onClick={() => setSelectedTier(null)} className={`
            px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all
            ${selectedTier === null ? 'bg-gradient-to-r from-cyan-500 via-violet-500 to-purple-500 text-white shadow-lg shadow-violet-500/20' : 'bg-white/5 text-white/50 hover:bg-white/10 border border-white/10'}
          `}>
          All Drops
        </button>
        {TIERS.map(tier => {
        const config = ROOM_TIERS[tier];
        const isSelected = selectedTier === tier;
        return <button key={tier} onClick={() => setSelectedTier(tier)} className={`
                px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2
                ${isSelected ? `bg-gradient-to-r ${config.color} text-black shadow-lg` : `bg-white/5 ${config.borderColor} border text-white/70 hover:text-white hover:bg-white/10`}
              `}>
              <span>{config.name}</span>
              <span className={`text-xs ${isSelected ? 'opacity-70' : 'opacity-50'}`}>{config.cap_display}</span>
            </button>;
      })}
      </div>

      {/* Description */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-xs text-white/50">
          Stake your Collect Cards and compete to redeem exclusive Collectibles
        </p>
        <Button variant="ghost" size="icon" onClick={() => refetch()} disabled={isRefetching} className="text-white/60 hover:text-white hover:bg-white/10">
          <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Room list */}
      <AnimatePresence mode="wait">
        {isLoading ? <motion.div key="loading" initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }} className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
              <p className="text-sm text-white/40">Loading drops...</p>
            </div>
          </motion.div> : rooms.length === 0 ? <motion.div key="empty" initial={{
        opacity: 0,
        y: 10
      }} animate={{
        opacity: 1,
        y: 0
      }} exit={{
        opacity: 0,
        y: -10
      }} className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Trophy className="w-8 h-8 text-white/20" />
            </div>
            <h3 className="text-lg font-medium text-white/60 mb-2">No Active Drops</h3>
            <p className="text-sm text-white/40 max-w-xs mx-auto">
              {selectedTier ? `No ${ROOM_TIERS[selectedTier].name} drops available right now` : 'Check back soon for new drops'}
            </p>
          </motion.div> : <motion.div key="rooms" initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }} className="grid gap-4 sm:grid-cols-2">
            {rooms.map((room, index) => <motion.div key={room.id} initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: index * 0.05
        }}>
                <RoomCard room={room} onSelect={setSelectedRoom} />
              </motion.div>)}
          </motion.div>}
      </AnimatePresence>

      {/* Info footer */}
      <div className="mt-8 p-4 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-violet-400" />
          <h4 className="text-sm font-medium text-white/80">How Drops Work</h4>
        </div>
        <ul className="text-xs text-white/50 space-y-2">
          <li className="flex items-start gap-2">
            <span className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
            <span>Stake one of your Product Cards into a tier-appropriate Drop</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1 h-1 rounded-full bg-violet-400 mt-1.5 flex-shrink-0" />
            <span>Compete on a deterministic leaderboard (no randomness)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1 h-1 rounded-full bg-green-400 mt-1.5 flex-shrink-0" />
            <span>Winner earns the right to redeem their staked product</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1 h-1 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />
            <span>Losers keep their cards; Priority Points decay 20%</span>
          </li>
        </ul>
      </div>
    </div>;
});