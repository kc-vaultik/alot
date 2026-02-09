/**
 * @fileoverview Collection Value Box Component - "Digital Vandalism" Style
 * @description Displays total stash value and card count with treasure chest aesthetic
 */

import { Gem, Package } from 'lucide-react';

interface CollectionValueBoxProps {
  collectionValue: number;
  credits: number;
  cardCount: number;
}

export function CollectionValueBox({ collectionValue, credits, cardCount }: CollectionValueBoxProps) {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 mb-4 sm:mb-6">
      {/* Main Collection Value - Treasure Chest Style */}
      <div className="rounded-2xl bg-gradient-to-br from-amber-900/40 via-zinc-900/90 to-amber-900/30 backdrop-blur-sm p-4 sm:p-5 border-4 border-white shadow-sticker transform rotate-[0.8deg] mb-3 relative overflow-hidden">
        {/* Shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/10 to-transparent animate-pulse" />
        
        <div className="flex items-center gap-3 sm:gap-4 relative z-10">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 flex items-center justify-center flex-shrink-0 border-4 border-white shadow-sticker transform -rotate-2">
            <Gem className="w-7 h-7 sm:w-8 sm:h-8 text-white drop-shadow-lg" strokeWidth={2.5} />
          </div>
          <div className="text-left min-w-0">
            <p className="text-foreground font-display text-3xl sm:text-4xl tracking-wide">
              ${collectionValue.toLocaleString()}
            </p>
            <p className="text-amber-400/80 text-xs sm:text-sm font-bold uppercase tracking-widest">
              COLLECTION VALUE
            </p>
          </div>
        </div>
      </div>

      {/* Credits and Cards Row */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {/* Credits Display - Coin stack style */}
        <div className="rounded-2xl bg-card/90 backdrop-blur-sm p-3 sm:p-4 border-4 border-white shadow-sticker transform -rotate-[0.5deg]">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-hype-green to-emerald-400 flex items-center justify-center flex-shrink-0 border-2 border-white shadow-md">
              <span className="text-xl sm:text-2xl">🪙</span>
            </div>
            <div className="text-left min-w-0">
              <p className="text-hype-green font-display text-lg sm:text-xl">
                {credits.toLocaleString()} C
              </p>
              <p className="text-muted-foreground text-[10px] sm:text-xs font-bold uppercase tracking-wide">
                CREDITS
              </p>
            </div>
          </div>
        </div>

        {/* Card Count - Sticker style */}
        <div className="rounded-2xl bg-card/90 backdrop-blur-sm p-3 sm:p-4 border-4 border-white shadow-sticker transform rotate-[0.5deg]">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-hype-pink to-hype-blue flex items-center justify-center flex-shrink-0 border-2 border-white shadow-md">
              <Package className="w-5 h-5 sm:w-6 sm:h-6 text-white" strokeWidth={2.5} />
            </div>
            <div className="text-left min-w-0">
              <p className="text-foreground font-display text-lg sm:text-xl">{cardCount}</p>
              <p className="text-muted-foreground text-[10px] sm:text-xs font-bold uppercase tracking-wide">
                ITEMS
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
