/**
 * @fileoverview Room entry reveal screen wrapper
 * 
 * A simple wrapper component that renders the unified RoomEntryRevealFlow.
 * Provides a consistent fullscreen overlay for room entry reveals.
 */

import { motion } from 'framer-motion';
import { RoomEntryRevealFlow } from './RoomEntryRevealFlow';
import type { Room, RoomProduct } from '../../types';

interface RoomEntryRevealScreenProps {
  room: Room;
  product: RoomProduct | null;
  creditsEarned: number;
  userTotalCredits: number;
  totalRoomCredits: number;
  redeemProgress?: {
    current: number;
    target: number;
  };
  onComplete: () => void;
}

export function RoomEntryRevealScreen({
  room,
  product,
  creditsEarned,
  userTotalCredits,
  totalRoomCredits,
  redeemProgress,
  onComplete,
}: RoomEntryRevealScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-zinc-950"
    >
      <RoomEntryRevealFlow
        room={room}
        product={product}
        creditsEarned={creditsEarned}
        userTotalCredits={userTotalCredits}
        totalRoomCredits={totalRoomCredits}
        redeemProgress={redeemProgress}
        onComplete={onComplete}
      />
    </motion.div>
  );
}
