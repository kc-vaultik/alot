/**
 * @fileoverview Action Buttons Component
 * @description Buy Cards and Win Cards action buttons
 */

import { motion } from 'framer-motion';
import { Sparkles, Gift, Trophy } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ActionButtonsProps {
  onBuyCards?: () => void;
  onFreePull: () => void;
  canClaim: boolean;
  countdown: string;
}

export function ActionButtons({
  onBuyCards,
  onFreePull,
  canClaim,
  countdown,
}: ActionButtonsProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const handleWinCards = () => {
    if (!user) {
      navigate('/auth?returnTo=/collect-room');
    } else if (canClaim) {
      onFreePull();
    }
  };

  const handleGoToRooms = () => {
    const params = new URLSearchParams(location.search);
    params.set('tab', 'rooms');
    navigate({ pathname: location.pathname, search: params.toString() });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.6 }}
      className="mt-8 flex flex-col items-center gap-3 relative z-10"
    >
      {/* Two side-by-side action boxes */}
      <div className="flex gap-3">
        {/* Buy Cards Box */}
        <button
          onClick={onBuyCards}
          className="w-36 sm:w-40 h-14 flex items-center justify-center gap-2 rounded-2xl bg-white/10 border border-white/20 text-white text-sm font-medium tracking-wide hover:bg-white/15 hover:border-white/30 transition-all duration-200 backdrop-blur-sm"
        >
          <Sparkles className="w-4 h-4" />
          Buy Cards
        </button>

        {/* Free Card Box */}
        <button
          onClick={handleWinCards}
          disabled={user && !canClaim}
          className={`w-36 sm:w-40 h-14 flex items-center justify-center gap-2 rounded-2xl text-sm font-medium tracking-wide transition-all duration-200 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed ${
            user && canClaim
              ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 border border-amber-300/50 text-amber-950 hover:from-amber-400 hover:via-yellow-300 hover:to-amber-400 shadow-lg shadow-amber-500/30'
              : 'bg-white/10 border border-white/20 text-white hover:bg-white/15 hover:border-white/30'
          }`}
        >
          <Gift className="w-4 h-4" />
          {user && countdown ? countdown : 'Free Card'}
        </button>
      </div>

      {/* Rooms shortcut */}
      <button
        type="button"
        onClick={handleGoToRooms}
        className="inline-flex items-center gap-2 text-xs text-white/60 hover:text-white transition-colors"
      >
        <Trophy className="w-3.5 h-3.5" />
        View Rooms
      </button>
    </motion.div>
  );
}
