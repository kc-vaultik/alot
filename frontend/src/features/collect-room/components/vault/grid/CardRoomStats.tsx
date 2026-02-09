/**
 * CardRoomStats - Displays core redemption stats for cards
 * Shows Redeem Progress (percentage bar) and Credits (dollar value)
 */

import { memo } from 'react';
import { TrendingUp, Coins } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import type { CollectCard } from '@/features/collect-room/types';

interface CardRoomStatsProps {
  card: CollectCard;
}

export const CardRoomStats = memo(function CardRoomStats({ card }: CardRoomStatsProps) {
  const { redeem_credits_cents, product_value } = card;
  
  // Calculate redemption progress
  const productValueCents = product_value * 100;
  const progress = productValueCents > 0 
    ? Math.min(100, (redeem_credits_cents / productValueCents) * 100) 
    : 0;
  const creditsInDollars = redeem_credits_cents / 100;
  const isRedeemable = progress >= 100;

  return (
    <div className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-3">
      {/* Credits */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coins className="w-4 h-4 text-green-400" />
          <span className="text-white/60 text-sm">Credits</span>
        </div>
        <span className="text-green-400 font-semibold">
          ${creditsInDollars.toFixed(2)}
        </span>
      </div>

      {/* Redeem Progress */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-white/50">Redeem Progress</span>
          </div>
          <span className={isRedeemable ? 'text-green-400 font-medium' : 'text-white/70'}>
            {progress.toFixed(1)}%
          </span>
        </div>
        <Progress 
          value={progress} 
          className="h-2 bg-white/10"
        />
        <p className="text-white/40 text-[10px]">
          ${creditsInDollars.toFixed(2)} / ${product_value.toLocaleString()} to redeem
        </p>
      </div>
    </div>
  );
});

export default CardRoomStats;
