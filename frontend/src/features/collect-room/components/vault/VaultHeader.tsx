/**
 * @fileoverview Vault Header - "Digital Vandalism" Style
 * @description Sticky header with sticker aesthetic
 */

import { memo } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import { NotificationCenter } from '../NotificationCenter';

interface VaultHeaderProps {
  totalPoints: number;
  cardCount: number;
  onBack: () => void;
  onUnbox: () => void;
  hideNotification?: boolean;
}

export const VaultHeader = memo(({ onBack, onUnbox, hideNotification = false }: VaultHeaderProps) => {
  return (
    <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Left: Back button - Sticker style */}
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl 
              bg-secondary border-2 border-border text-muted-foreground 
              hover:bg-secondary/80 hover:text-foreground transition-all text-xs sm:text-sm font-bold uppercase"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} />
            <span className="hidden xs:inline">Back</span>
          </button>

          {/* Right: Notifications + Unbox button */}
          <div className="flex items-center gap-2">
            {!hideNotification && <NotificationCenter />}
            {/* Unbox button - Hype gradient sticker */}
            <button
              onClick={onUnbox}
              className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl 
                bg-gradient-to-r from-hype-pink to-hype-blue text-white 
                border-2 border-white shadow-sticker
                hover:shadow-lg transition-all text-xs sm:text-sm font-bold uppercase tracking-wide
                transform rotate-1"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={3} />
              <span>Unbox</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

VaultHeader.displayName = 'VaultHeader';
