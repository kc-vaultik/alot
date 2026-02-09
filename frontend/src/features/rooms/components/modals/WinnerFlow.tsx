/**
 * @fileoverview Winner celebration and redemption flow
 */

import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Sparkles, CreditCard, Gift, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useClaimRedemption } from '../../hooks';
import { formatCents } from '../../utils';
import type { Room, LeaderboardEntry } from '../../types';

interface WinnerFlowProps {
  room: Room;
  entry: LeaderboardEntry;
  onClose: () => void;
}

export const WinnerFlow = memo(function WinnerFlow({
  room,
  entry,
  onClose,
}: WinnerFlowProps) {
  const claimRedemption = useClaimRedemption();
  const [showPayment, setShowPayment] = useState(false);

  const productValueCents = entry.stake_snapshot.product_value_cents;
  const rcCents = entry.stake_snapshot.rc_cents;
  const payCents = Math.max(0, productValueCents - rcCents);
  const isFreeRedemption = payCents === 0;
  const discountPercent = Math.min(100, (rcCents / productValueCents) * 100);

  const handleClaim = async () => {
    try {
      const result = await claimRedemption.mutateAsync(room.id);
      
      if (result.requires_payment) {
        setShowPayment(true);
        // TODO: Redirect to Stripe checkout
        // For now, show payment info
      } else {
        // Free redemption completed
        onClose();
      }
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="w-full max-w-md bg-gradient-to-b from-zinc-800 to-zinc-900 rounded-2xl border border-amber-500/30 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors z-10"
        >
          <X className="w-5 h-5 text-white/60" />
        </button>

        {/* Celebration header */}
        <div className="relative p-6 text-center overflow-hidden">
          {/* Animated sparkles background */}
          <div className="absolute inset-0 opacity-30">
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-amber-400 rounded-full"
                initial={{
                  x: Math.random() * 100 + '%',
                  y: Math.random() * 100 + '%',
                  opacity: 0,
                }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0.5, 1.5, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="relative"
          >
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <Trophy className="w-10 h-10 text-black" />
            </div>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold text-white mb-2"
          >
            🎉 You Won!
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-white/60"
          >
            You earned the right to redeem your product
          </motion.p>
        </div>

        {/* Product info */}
        <div className="px-6 pb-4">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="text-sm text-white/40 mb-1">Your Prize</div>
            <div className="text-lg font-semibold text-white mb-2">
              {entry.stake_snapshot.product_name}
            </div>
            <div className="text-sm text-white/60">
              {entry.stake_snapshot.band} • {formatCents(productValueCents)} value
            </div>
          </div>
        </div>

        {/* Pricing breakdown */}
        <div className="px-6 pb-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-white/60">
              <span>Product Value</span>
              <span>{formatCents(productValueCents)}</span>
            </div>
            <div className="flex justify-between text-green-400">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Redeem Credits ({discountPercent.toFixed(0)}%)
              </span>
              <span>-{formatCents(rcCents)}</span>
            </div>
            <div className="border-t border-white/10 pt-2 flex justify-between text-white font-semibold">
              <span>You Pay</span>
              <span className={isFreeRedemption ? 'text-green-400' : ''}>
                {isFreeRedemption ? 'FREE' : formatCents(payCents)}
              </span>
            </div>
          </div>
        </div>

        {/* Action */}
        <div className="p-6 border-t border-white/10 bg-black/20">
          {isFreeRedemption ? (
            <Button
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500"
              onClick={handleClaim}
              disabled={claimRedemption.isPending}
            >
              {claimRedemption.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Gift className="w-4 h-4 mr-2" />
              )}
              Claim Free Redemption
            </Button>
          ) : (
            <Button
              className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500"
              onClick={handleClaim}
              disabled={claimRedemption.isPending}
            >
              {claimRedemption.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CreditCard className="w-4 h-4 mr-2" />
              )}
              Pay {formatCents(payCents)} to Redeem
            </Button>
          )}

          <p className="text-xs text-white/40 text-center mt-3">
            {isFreeRedemption
              ? 'Your Redeem Credits cover the full cost!'
              : 'You can continue building credits for future wins'}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
});
