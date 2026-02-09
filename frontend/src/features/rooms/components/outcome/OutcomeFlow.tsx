/**
 * @fileoverview Orchestrator component for full outcome flow
 */

import { memo, useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { DrawAnimation } from './DrawAnimation';
import { WinnerReveal } from './WinnerReveal';
import { NonWinnerModal } from './NonWinnerModal';
import { MysteryReveal } from './MysteryReveal';
import type { Room, RoomTier } from '../../types';

interface OutcomeFlowProps {
  room: Room;
  product: {
    id: string;
    name: string;
    brand: string;
    image_url: string | null;
    retail_value_usd: number;
    category: string;
  };
  participants: Array<{
    user_id: string;
    username?: string;
    display_name?: string;
    entries: number;
  }>;
  totalEntries: number;
  winningEntry: number;
  winnerUserId: string;
  winnerName: string;
  currentUserId?: string;
  userAmountSpentCents?: number;
  isMysteryRoom?: boolean;
  isMysteryRevealed?: boolean;
  onRequestRefund: () => Promise<void>;
  onConvertToCredits: () => Promise<void>;
  onClaimPrize?: () => void;
  onClose: () => void;
}

type FlowPhase = 'mystery-reveal' | 'draw' | 'winner-reveal' | 'non-winner' | 'complete';

export const OutcomeFlow = memo(function OutcomeFlow({
  room,
  product,
  participants,
  totalEntries,
  winningEntry,
  winnerUserId,
  winnerName,
  currentUserId,
  userAmountSpentCents = 0,
  isMysteryRoom = false,
  isMysteryRevealed = true,
  onRequestRefund,
  onConvertToCredits,
  onClaimPrize,
  onClose,
}: OutcomeFlowProps) {
  const isCurrentUserWinner = currentUserId === winnerUserId;
  const hasEntry = userAmountSpentCents > 0;

  // Determine starting phase
  const getInitialPhase = (): FlowPhase => {
    if (isMysteryRoom && !isMysteryRevealed) return 'mystery-reveal';
    return 'draw';
  };

  const [phase, setPhase] = useState<FlowPhase>(getInitialPhase);

  const handleMysteryComplete = useCallback(() => {
    setPhase('draw');
  }, []);

  const handleDrawComplete = useCallback(() => {
    setPhase('winner-reveal');
  }, []);

  const handleWinnerRevealClose = useCallback(() => {
    if (isCurrentUserWinner) {
      setPhase('complete');
      onClose();
    } else if (hasEntry) {
      setPhase('non-winner');
    } else {
      setPhase('complete');
      onClose();
    }
  }, [isCurrentUserWinner, hasEntry, onClose]);

  const handleNonWinnerClose = useCallback(() => {
    setPhase('complete');
    onClose();
  }, [onClose]);

  return (
    <AnimatePresence mode="wait">
      {/* Mystery reveal (if mystery room and not yet revealed) */}
      {phase === 'mystery-reveal' && (
        <MysteryReveal
          key="mystery"
          product={product}
          tier={room.tier as RoomTier}
          onComplete={handleMysteryComplete}
        />
      )}

      {/* Draw animation */}
      {phase === 'draw' && (
        <DrawAnimation
          key="draw"
          participants={participants}
          totalEntries={totalEntries}
          winningEntry={winningEntry}
          winnerUserId={winnerUserId}
          onComplete={handleDrawComplete}
        />
      )}

      {/* Winner reveal */}
      {phase === 'winner-reveal' && (
        <WinnerReveal
          key="winner"
          product={product}
          winnerName={winnerName}
          isCurrentUserWinner={isCurrentUserWinner}
          onClaim={isCurrentUserWinner ? onClaimPrize : undefined}
          onClose={handleWinnerRevealClose}
        />
      )}

      {/* Non-winner modal */}
      {phase === 'non-winner' && (
        <NonWinnerModal
          key="non-winner"
          isOpen={true}
          onClose={handleNonWinnerClose}
          amountSpentCents={userAmountSpentCents}
          onRequestRefund={onRequestRefund}
          onConvertToCredits={onConvertToCredits}
          productName={product.name}
        />
      )}
    </AnimatePresence>
  );
});
