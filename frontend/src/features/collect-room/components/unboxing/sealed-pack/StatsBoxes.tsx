/**
 * @fileoverview Stats Boxes Component - "Digital Vandalism" Style
 * @description Sticker aesthetic stat boxes with thick borders and tilts
 */

import { DollarSign, Coins, Layers, Gift } from 'lucide-react';

interface StatsBoxesProps {
  totalVaultValue: number;
  totalCredits: number;
  totalPacks: number;
  freePullAvailable: boolean;
}

export function StatsBoxes({ 
  totalVaultValue, 
  totalCredits, 
  totalPacks, 
  freePullAvailable 
}: StatsBoxesProps) {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 mb-4 sm:mb-6">
      {/* Collection Value Box - Full Width, Sticker Style */}
      <div 
        className="relative rounded-2xl bg-card border-4 border-white shadow-sticker mb-3 overflow-hidden"
        style={{ transform: 'rotate(-0.5deg)' }}
      >
        {/* Gradient glow behind */}
        <div className="absolute inset-0 gradient-hype opacity-20" />
        
        <div className="relative p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl gradient-hype flex items-center justify-center flex-shrink-0 border-2 border-white shadow-sticker">
            <DollarSign className="w-6 h-6 text-white" strokeWidth={2.5} />
          </div>
          <div className="text-left min-w-0">
            <p className="text-foreground font-display text-2xl sm:text-3xl tracking-wide">
              ${totalVaultValue.toLocaleString()}
            </p>
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Collection Value</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Credits Box */}
        <div 
          className="relative rounded-2xl bg-card border-4 border-white shadow-sticker overflow-hidden"
          style={{ transform: 'rotate(0.5deg)' }}
        >
          {/* Volt glow */}
          <div className="absolute inset-0 bg-success/10" />
          
          <div className="relative p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl gradient-volt flex items-center justify-center flex-shrink-0 border-2 border-white shadow-sticker">
              <Coins className="w-5 h-5 sm:w-6 sm:h-6 text-black" strokeWidth={2.5} />
            </div>
            <div className="text-left min-w-0">
              <p className="text-foreground font-display text-xl sm:text-2xl">{totalCredits.toLocaleString()}</p>
              <p className="text-muted-foreground text-[10px] sm:text-xs font-bold uppercase">Credits</p>
            </div>
          </div>
        </div>

        {/* Packs Box */}
        <div 
          className="relative rounded-2xl bg-card border-4 border-white shadow-sticker overflow-hidden"
          style={{ transform: 'rotate(-0.5deg)' }}
        >
          {/* Free pack notification badge */}
          {freePullAvailable && (
            <div className="absolute -top-1 -right-1 z-10 flex items-center justify-center w-7 h-7 rounded-full gradient-volt border-2 border-white shadow-lg animate-pulse-glow">
              <Gift className="w-4 h-4 text-black" strokeWidth={2.5} />
            </div>
          )}
          
          {/* Hype glow */}
          <div className="absolute inset-0 gradient-hype opacity-10" />
          
          <div className="relative p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl gradient-hype flex items-center justify-center flex-shrink-0 border-2 border-white shadow-sticker">
              <Layers className="w-5 h-5 sm:w-6 sm:h-6 text-white" strokeWidth={2.5} />
            </div>
            <div className="text-left min-w-0">
              <p className="text-foreground font-display text-xl sm:text-2xl">{totalPacks}</p>
              <p className="text-muted-foreground text-[10px] sm:text-xs font-bold uppercase">Packs</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
