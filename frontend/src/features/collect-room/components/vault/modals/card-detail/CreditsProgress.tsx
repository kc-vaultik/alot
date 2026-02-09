/**
 * @fileoverview Credits Progress Component - "Digital Vandalism" Style
 * Shows credits accumulated and redemption progress with sticker aesthetic
 */

import { memo } from 'react';
import { Coins } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import type { CardOrListing } from './types';

interface CreditsProgressProps {
  card: CardOrListing;
}

export const CreditsProgress = memo(({ card }: CreditsProgressProps) => {
  // Calculate redemption progress
  const productValue = card.product_value || 0;
  const creditsInDollars = (card.redeem_credits_cents || 0) / 100;
  const redeemProgress = productValue > 0 ? Math.min(100, (creditsInDollars / productValue) * 100) : 0;
  const isRedeemable = redeemProgress >= 100;

  return (
    <div className="bg-zinc-900/80 rounded-2xl p-4 border-4 border-white shadow-sticker transform -rotate-[0.5deg] space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-hype-green/20 border-2 border-hype-green">
            <Coins className="w-4 h-4 text-hype-green" strokeWidth={2.5} />
          </div>
          <span className="text-white font-display text-sm tracking-wide">CREDITS</span>
        </div>
        <span className="text-hype-green font-display text-lg">
          ${creditsInDollars.toFixed(2)}
        </span>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-white/60 font-bold uppercase tracking-wide">Redeem Progress</span>
          <span className={`font-display text-sm ${isRedeemable ? 'text-hype-green' : 'text-white'}`}>
            {redeemProgress.toFixed(1)}%
          </span>
        </div>
        <div className="rounded-full border-2 border-white overflow-hidden">
          <Progress 
            value={redeemProgress} 
            className="h-3 bg-white/10"
          />
        </div>
        <p className="text-white/50 text-[10px] font-semibold">
          ${creditsInDollars.toFixed(2)} / ${productValue.toLocaleString()} to redeem
        </p>
      </div>

      {isRedeemable && (
        <button className="w-full py-3 rounded-xl gradient-volt text-zinc-900 font-display text-sm tracking-wide border-4 border-white shadow-sticker transform rotate-[0.3deg] hover:scale-[1.02] transition-transform">
          REDEEM PRODUCT
        </button>
      )}
    </div>
  );
});

CreditsProgress.displayName = 'CreditsProgress';
