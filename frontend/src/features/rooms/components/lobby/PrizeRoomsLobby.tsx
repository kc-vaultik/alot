/**
 * @fileoverview Prize Rooms Lobby - "Digital Vandalism" Style
 * FOMO-inducing drop feed with sticker aesthetic
 */

import { memo, useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, RefreshCw, Trophy, Sparkles, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRooms, useRoomLeaderboard } from '../../hooks';
import { PrizeRoomCard } from './PrizeRoomCard';
import { RoomFilters, FundingFilter, CategoryFilter } from './RoomFilters';
import { PrizeRoomDetailPage } from '../detail/PrizeRoomDetailPage';
import { ROOM_TIERS } from '../../constants';
import type { Room, RoomTier } from '../../types';

export const PrizeRoomsLobby = memo(function PrizeRoomsLobby() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedTier, setSelectedTier] = useState<RoomTier | null>(null);
  const [fundingFilter, setFundingFilter] = useState<FundingFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>(null);
  const [showMysteryOnly, setShowMysteryOnly] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  
  const { data, isLoading, refetch, isRefetching } = useRooms(selectedTier || undefined);
  const rooms = data?.rooms || [];

  // Auto-select room from URL param (after returning from reveal)
  useEffect(() => {
    const selectedRoomId = searchParams.get('selected_room');
    if (selectedRoomId && rooms.length > 0 && !selectedRoom) {
      const roomToSelect = rooms.find(r => r.id === selectedRoomId);
      if (roomToSelect) {
        setSelectedRoom(roomToSelect);
        // Clear the param after selecting
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('selected_room');
        setSearchParams(newParams, { replace: true });
      }
    }
  }, [searchParams, rooms, selectedRoom, setSearchParams]);

  // Fetch leaderboard when a room is selected (includes my_entry)
  const { data: leaderboardData, isLoading: isLoadingLeaderboard } = useRoomLeaderboard(selectedRoom?.id || null);

  // Extract unique categories from rooms
  const categories = useMemo(() => {
    const cats = new Set<string>();
    rooms.forEach(room => {
      if (room.category) cats.add(room.category);
    });
    return Array.from(cats).sort();
  }, [rooms]);

  // Filter rooms
  const filteredRooms = useMemo(() => {
    return rooms.filter(room => {
      // Funding filter
      const fundingProgress = room.funding_target_cents 
        ? (room.escrow_balance_cents / room.funding_target_cents) * 100
        : 0;
      
      if (fundingFilter === 'new' && fundingProgress >= 25) return false;
      if (fundingFilter === 'almost_funded' && fundingProgress < 75) return false;
      if (fundingFilter === 'funded' && room.status !== 'FUNDED') return false;
      
      // Category filter
      if (categoryFilter && room.category !== categoryFilter) return false;
      
      // Mystery filter
      if (showMysteryOnly && !room.is_mystery) return false;
      
      return true;
    });
  }, [rooms, fundingFilter, categoryFilter, showMysteryOnly]);

  if (selectedRoom) {
    // Build participants list from leaderboard
    const participants = leaderboardData?.leaderboard?.map((entry, index) => ({
      user_id: entry.user_id,
      username: entry.username,
      display_name: entry.display_name,
      avatar_url: entry.avatar_url,
      entries: entry.entries || 0,
      rank: index + 1,
    })) || [];

    // Build user entry from my_entry in leaderboard response
    const myEntry = leaderboardData?.my_entry;
    const userEntry = myEntry ? {
      entries: myEntry.entries || 0,
      amount_spent_cents: myEntry.amount_spent_cents || 0,
    } : null;

    // Get total entries from response
    const totalEntries = leaderboardData?.total_entries || participants.reduce((sum, p) => sum + p.entries, 0);

    return (
      <PrizeRoomDetailPage 
        room={selectedRoom}
        onBack={() => setSelectedRoom(null)}
        product={selectedRoom.product || null}
        participants={participants}
        userEntry={userEntry}
        totalEntries={totalEntries}
        isLoading={isLoadingLeaderboard}
      />
    );
  }

  return (
    <div className="min-h-full">
      {/* Header - Chunky style */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-xl gradient-hype flex items-center justify-center border-2 border-white shadow-sticker"
            style={{ transform: 'rotate(-3deg)' }}
          >
            <Flame className="w-6 h-6 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="font-display text-xl text-foreground tracking-wide">THE LOTS</h2>
            <p className="text-xs text-muted-foreground font-semibold">Fund & win ALOT!</p>
          </div>
        </div>
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => refetch()} 
            disabled={isRefetching} 
            className="text-muted-foreground hover:text-foreground hover:bg-muted w-10 h-10 rounded-xl"
          >
            <RefreshCw className={`w-5 h-5 ${isRefetching ? 'animate-spin' : ''}`} strokeWidth={2.5} />
          </Button>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <RoomFilters
          selectedTier={selectedTier}
          onTierChange={setSelectedTier}
          fundingFilter={fundingFilter}
          onFundingFilterChange={setFundingFilter}
          categoryFilter={categoryFilter}
          onCategoryFilterChange={setCategoryFilter}
          categories={categories}
          showMysteryOnly={showMysteryOnly}
          onMysteryToggle={setShowMysteryOnly}
        />
      </div>

      {/* Room grid */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div 
            key="loading" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="flex items-center justify-center py-16"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-2xl gradient-hype flex items-center justify-center border-4 border-white shadow-sticker animate-pulse">
                <Loader2 className="w-8 h-8 animate-spin text-white" />
              </div>
              <p className="text-sm text-muted-foreground font-bold">Loading lots...</p>
            </div>
          </motion.div>
        ) : filteredRooms.length === 0 ? (
          <motion.div 
            key="empty" 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }} 
            className="text-center py-16"
          >
            <div 
              className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-card border-4 border-white shadow-sticker flex items-center justify-center"
              style={{ transform: 'rotate(-3deg)' }}
            >
              <Trophy className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="font-display text-xl text-muted-foreground mb-2">NO LOTS YET</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              {selectedTier 
                ? `No ${ROOM_TIERS[selectedTier].name} lots match your filters` 
                : 'Fresh lots coming soon!'}
            </p>
          </motion.div>
        ) : (
          <motion.div 
            key="rooms" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="grid gap-6 sm:grid-cols-2"
          >
            {filteredRooms.map((room, index) => (
              <motion.div 
                key={room.id} 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: index * 0.05 }}
              >
                <PrizeRoomCard 
                  room={room}
                  product={room.product}
                  onSelect={setSelectedRoom}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info footer - Sticker style */}
      <div 
        className="mt-8 p-5 rounded-2xl bg-card border-4 border-white shadow-sticker"
        style={{ transform: 'rotate(0.5deg)' }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-primary" />
          <h4 className="font-display text-base text-foreground">HOW LOTS WORK</h4>
        </div>
        <ul className="text-sm text-muted-foreground space-y-3 font-medium">
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full gradient-hype flex items-center justify-center flex-shrink-0 text-xs font-bold text-white border border-white">1</span>
            <span>Fund lots to get entries (1 entry = $1)</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full gradient-hype flex items-center justify-center flex-shrink-0 text-xs font-bold text-white border border-white">2</span>
            <span>More entries = higher chance to win</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full gradient-volt flex items-center justify-center flex-shrink-0 text-xs font-bold text-black border border-white">3</span>
            <span>Winner gets the prize. Everyone else gets credits in their Stash!</span>
          </li>
        </ul>
      </div>
    </div>
  );
});
