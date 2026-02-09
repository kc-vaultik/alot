/**
 * @fileoverview Full room detail view with sealed leaderboard support
 */

import { memo, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRoomLeaderboard, useMyRoomEntry, useLeaveRoom } from '../hooks';
import { RoomDetailHeader } from './detail/RoomDetailHeader';
import { RoomStatsGrid } from './detail/RoomStatsGrid';
import { EscrowProgressCard } from './detail/EscrowProgressCard';
import { StakedCardDisplay } from './detail/StakedCardDisplay';
import { MyEntryCard } from './detail/MyEntryCard';
import { RoomActions } from './detail/RoomActions';
import { RoomLeaderboard } from './shared/RoomLeaderboard';
import { StakeModal } from './modals/StakeModal';
import { WinnerFlow } from './modals/WinnerFlow';
import { SealedLeaderboardMessage } from './shared/SealedLeaderboardMessage';
import { RewardsPanel } from './shared/RewardsPanel';
import { TierProductCarousel } from './shared/TierProductCarousel';
import { RoomCommunityTabs } from './shared/RoomCommunityTabs';
import { DrawVerification } from './shared/DrawVerification';

import { formatTimeRemainingSimple } from '../utils';
import type { Room, RoomTier, CompetitivenessBand, PercentileBand } from '../types';

interface RoomDetailPageProps {
  room: Room;
  onBack: () => void;
}

export const RoomDetailPage = memo(function RoomDetailPage({
  room,
  onBack,
}: RoomDetailPageProps) {
  const { user } = useAuth();
  const { data: leaderboardData, isLoading } = useRoomLeaderboard(room.id);
  const { data: myEntryData } = useMyRoomEntry(room.id);
  const leaveRoom = useLeaveRoom();

  const [showStakeModal, setShowStakeModal] = useState(false);
  const [showWinnerFlow, setShowWinnerFlow] = useState(false);

  const participantCount = leaderboardData?.room?.participant_count || room.participant_count || 0;
  const timeRemaining = useMemo(() => formatTimeRemainingSimple(room.end_at), [room.end_at]);

  // Determine states
  const isSealed = leaderboardData?.is_sealed ?? (room.status === 'OPEN' || room.status === 'LOCKED');
  const isSettled = room.status === 'SETTLED';
  const isLocked = room.status === 'LOCKED';

  // Find user's entry
  const myEntry = useMemo(() => {
    if (!user) return null;
    if (leaderboardData?.my_entry) return leaderboardData.my_entry;
    if (leaderboardData?.leaderboard) {
      return leaderboardData.leaderboard.find((e) => e.user_id === user.id);
    }
    return null;
  }, [user, leaderboardData]);

  const competitivenessBand = myEntryData?.competitiveness_band as CompetitivenessBand | undefined;
  const improvementTips = myEntryData?.improvement_tips || [];
  const isWinner = room.status === 'SETTLED' && room.winner_user_id === user?.id;
  const canStake = room.status === 'OPEN' && !myEntry && !isLocked;
  const canLeave = room.status === 'OPEN' && myEntry && !isLocked;

  const handleLeave = async () => {
    if (!myEntry) return;
    try {
      await leaveRoom.mutateAsync({
        roomId: room.id,
        revealId: myEntry.reveal_id,
      });
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950 overflow-y-auto">
      {/* Header */}
      <RoomDetailHeader room={room} onBack={onBack} />

      {/* Tier Product Carousel */}
      <div className="px-4 py-3">
        <TierProductCarousel tier={room.tier as RoomTier} />
      </div>

      {/* Actions */}
      <RoomActions
        canStake={canStake}
        canLeave={!!canLeave}
        isWinner={isWinner}
        onStake={() => setShowStakeModal(true)}
        onLeave={handleLeave}
        onClaim={() => setShowWinnerFlow(true)}
        isLeaving={leaveRoom.isPending}
      />

      {/* Room info */}
      <div className="p-4 pt-0">
        <RoomStatsGrid
          timeRemaining={timeRemaining}
          participantCount={participantCount}
          maxParticipants={room.max_participants}
          tierCapCents={room.tier_cap_cents}
        />

        <EscrowProgressCard
          escrowBalanceCents={room.escrow_balance_cents}
          escrowTargetCents={room.escrow_target_cents}
        />

        {/* Staked card display - shown when user has entry */}
        {isLoading && user ? (
          <div className="mb-4 p-4 rounded-xl bg-white/5 border border-white/10">
            <Skeleton className="h-4 w-32 mb-3 bg-white/10" />
            <div className="flex gap-4">
              <Skeleton className="w-24 h-32 rounded-lg bg-white/10" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4 bg-white/10" />
                <Skeleton className="h-3 w-1/2 bg-white/10" />
                <Skeleton className="h-6 w-full bg-white/10" />
              </div>
            </div>
          </div>
        ) : myEntry && !isSettled ? (
          <StakedCardDisplay entry={myEntry} tier={room.tier as RoomTier} />
        ) : null}

        {/* Rules & Chat Tabs */}
        <RoomCommunityTabs roomId={room.id} tier={room.tier as RoomTier} />

        {/* My entry - enhanced for sealed rooms */}
        {isLoading && user ? (
          <div className="mb-4 p-4 rounded-xl bg-white/5 border border-white/10">
            <Skeleton className="h-4 w-24 mb-2 bg-white/10" />
            <Skeleton className="h-8 w-full bg-white/10" />
          </div>
        ) : myEntry && !isSettled ? (
          <MyEntryCard
            entry={myEntry}
            competitivenessBand={competitivenessBand}
            improvementTips={improvementTips}
          />
        ) : null}

        {/* Rewards panel for settled room */}
        {isSettled && myEntry && (
          <div className="mb-4">
            <RewardsPanel
              tier={room.tier as RoomTier}
              percentileBand={(myEntry.percentile_band || 'C') as PercentileBand}
              finalRank={myEntry.rank || 0}
              creditsAwarded={myEntry.credits_awarded || 0}
              packsAwarded={myEntry.packs_awarded || 0}
              isWinner={isWinner}
            />
          </div>
        )}

        {/* Provably Fair Verification for settled rooms */}
        {isSettled && (
          <div className="mb-4">
            <DrawVerification roomId={room.id} />
          </div>
        )}

        {/* Legacy rules section removed - now handled by RoomCommunityTabs */}

        {/* Sealed leaderboard message */}
        {isSealed && (
          <div className="mb-4">
            <SealedLeaderboardMessage lockAt={room.lock_at} />
          </div>
        )}

        {/* Leaderboard - only show when not sealed */}
        <div>
          <h3 className="font-display text-base text-white/80 mb-3 transform -rotate-1">
            {isSealed ? 'LEADERBOARD (Hidden until LOT ends)' : 'LEADERBOARD'}
          </h3>
          {isSealed ? (
            <div className="p-6 rounded-2xl bg-white/5 border-4 border-white shadow-sticker text-center transform rotate-[0.5deg]">
              <Lock className="w-8 h-8 text-white/30 mx-auto mb-2" strokeWidth={2.5} />
              <p className="text-sm text-white/50 font-medium">
                Rankings revealed when LOT ends
              </p>
            </div>
          ) : (
            <RoomLeaderboard
              entries={leaderboardData?.leaderboard || []}
              isLoading={isLoading}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showStakeModal && (
          <StakeModal room={room} onClose={() => setShowStakeModal(false)} />
        )}
        {showWinnerFlow && myEntry && (
          <WinnerFlow
            room={room}
            entry={myEntry}
            onClose={() => setShowWinnerFlow(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
});
