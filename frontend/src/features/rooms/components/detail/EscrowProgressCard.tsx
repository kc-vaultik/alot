/**
 * @fileoverview Lot progress card with animated bar - "Digital Vandalism" style
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Wallet } from 'lucide-react';
import { formatCents } from '../../utils';

interface EscrowProgressCardProps {
  escrowBalanceCents: number;
  escrowTargetCents: number;
}

export const EscrowProgressCard = memo(function EscrowProgressCard({
  escrowBalanceCents,
  escrowTargetCents,
}: EscrowProgressCardProps) {
  const escrowPercent = (escrowBalanceCents / escrowTargetCents) * 100;
  const isFunded = escrowPercent >= 100;

  return (
    <div className="rounded-2xl p-4 bg-zinc-900/90 border-4 border-white shadow-sticker mb-4 transform -rotate-1">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-white/80">
          <Wallet className="w-5 h-5 text-white" strokeWidth={2.5} />
          <span className="font-display text-sm">LOT PROGRESS</span>
        </div>
        <span
          className={`font-display text-sm px-3 py-1 rounded-full border-2 ${
            isFunded 
              ? 'bg-hype-green/20 text-hype-green border-hype-green/50' 
              : 'bg-amber-500/20 text-amber-400 border-amber-400/50'
          }`}
        >
          {isFunded ? 'FUNDED ✓' : `${escrowPercent.toFixed(0)}%`}
        </span>
      </div>
      
      {/* Progress bar with liquid effect */}
      <div className="h-4 bg-white/10 rounded-full overflow-hidden border-2 border-white/30">
        <motion.div
          className={`h-full rounded-full ${
            isFunded ? 'gradient-volt' : 'progress-liquid'
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(escrowPercent, 100)}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      
      <div className="flex justify-between text-xs text-white/60 mt-2">
        <span className="font-medium">{formatCents(escrowBalanceCents)}</span>
        <span className="font-medium">{formatCents(escrowTargetCents)}</span>
      </div>
    </div>
  );
});
