/**
 * @fileoverview HomeView Component - "The Lots"
 * Main home feed with FOMO-inducing drop cards
 * Design: "Digital Vandalism" - loud, tactile, gamified
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { useFreePullStatus } from '@/features/collect-room/hooks';
import { useAuth } from '@/contexts/AuthContext';
import { useCollectRoom } from '@/features/collect-room/context/CollectRoomContext';

import { StatsBoxes } from '../unboxing/sealed-pack/StatsBoxes';
import { getUserDisplayName } from '../unboxing/sealed-pack/utils';
import { PrizeRoomsLobby } from '@/features/rooms/components/lobby/PrizeRoomsLobby';
import { NotificationCenter } from '../NotificationCenter';
import { CollectRoomHeader } from '../layout/CollectRoomHeader';

interface HomeViewProps {
  /** Number of available cards to reveal */
  availableCards?: number;
}

export const HomeView = memo(({ availableCards = 0 }: HomeViewProps) => {
  const { user } = useAuth();
  const { data: freePullStatus } = useFreePullStatus();
  const { credits, totalVaultValue } = useCollectRoom();
  
  const totalCredits = credits?.universal || 0;
  const freePullAvailable = user && freePullStatus?.canClaim ? 1 : 0;
  const totalPacks = availableCards + freePullAvailable;
  const displayName = getUserDisplayName(user);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full flex flex-col overflow-hidden bg-background"
    >
      <CollectRoomHeader
        left={<NotificationCenter />}
      />

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden pb-32 pt-6">
        <StatsBoxes
          totalVaultValue={totalVaultValue}
          totalCredits={totalCredits}
          totalPacks={totalPacks}
          freePullAvailable={freePullAvailable > 0}
        />

        {/* Prize Rooms - "Fund collectibles & win" */}
        <div className="px-4 sm:px-6 mt-8 sm:mt-10">
          <PrizeRoomsLobby />
        </div>
      </div>
    </motion.div>
  );
});

HomeView.displayName = 'HomeView';

// Backward compatibility export
export const SealedPack = HomeView;
