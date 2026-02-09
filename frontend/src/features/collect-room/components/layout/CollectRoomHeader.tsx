/**
 * @fileoverview Alot! Global Header Component
 * @description Top header with Alot! logo and Stash Counter
 * Design: "Digital Vandalism" - chunky, loud, sticker aesthetic
 */

import { ReactNode, memo } from 'react';
import { motion } from 'framer-motion';
import { Coins } from 'lucide-react';
import { Link } from 'react-router-dom';
import alotLogo from '@/assets/alot-logo.png';
import { useCollectRoom } from '@/features/collect-room/context/CollectRoomContext';

interface CollectRoomHeaderProps {
  left?: ReactNode;
  showStashCounter?: boolean;
}

/**
 * Stash Counter - Pill-shaped credit balance display
 * Pulses when credits are added
 */
const StashCounter = memo(function StashCounter() {
  const { credits } = useCollectRoom();
  const totalCredits = credits?.universal || 0;

  return (
    <motion.button
      className="flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm
        bg-gradient-to-r from-hype-pink to-hype-blue text-white
        border-2 border-white shadow-sticker
        hover:shadow-sticker-hover hover:-translate-y-0.5 transition-all"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Coins className="w-4 h-4" />
      <span className="font-display tracking-wide">{totalCredits.toLocaleString()} C</span>
    </motion.button>
  );
});

export const CollectRoomHeader = memo(function CollectRoomHeader({ 
  left,
  showStashCounter = true 
}: CollectRoomHeaderProps) {
  return (
    <header className="flex-shrink-0 bg-background border-b border-border/30 py-4 safe-top">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Left: Optional elements (notifications) */}
        <div className="flex items-center gap-3 min-w-[80px]">
          {left}
        </div>

        {/* Center: Big ALOT! Logo */}
        <Link to="/collect-room" className="flex items-center justify-center flex-1">
          <motion.img 
            src={alotLogo} 
            alt="Alot!" 
            className="h-28 sm:h-36 w-auto object-contain"
            whileHover={{ scale: 1.05, rotate: 2 }}
            whileTap={{ scale: 0.95 }}
          />
        </Link>

        {/* Right: Stash Counter */}
        <div className="flex items-center gap-3 min-w-[80px] justify-end">
          {showStashCounter && <StashCounter />}
        </div>
      </div>
    </header>
  );
});

CollectRoomHeader.displayName = 'CollectRoomHeader';