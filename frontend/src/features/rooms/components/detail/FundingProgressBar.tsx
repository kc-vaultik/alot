/**
 * @fileoverview Large animated funding progress bar for prize rooms
 */

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Target, Zap, CheckCircle } from 'lucide-react';
import { formatCents } from '../../utils';

interface FundingProgressBarProps {
  currentCents: number;
  targetCents: number;
  productName?: string;
}

export const FundingProgressBar = memo(function FundingProgressBar({
  currentCents,
  targetCents,
  productName,
}: FundingProgressBarProps) {
  const progress = useMemo(() => {
    if (targetCents <= 0) return 0;
    return Math.min((currentCents / targetCents) * 100, 100);
  }, [currentCents, targetCents]);

  const isFunded = progress >= 100;
  const isAlmostFunded = progress >= 80 && !isFunded;

  return (
    <div className="rounded-2xl border-4 border-white shadow-sticker mb-5 transform rotate-[0.5deg] overflow-hidden">
      <div className="p-5 bg-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl border-2 border-white shadow-sticker ${isFunded ? 'bg-hype-green/20' : 'bg-hype-pink/20'}`}>
              {isFunded ? (
                <CheckCircle className="w-5 h-5 text-hype-green" />
              ) : (
                <Target className="w-5 h-5 text-hype-pink" />
              )}
            </div>
            <div>
              <h3 className="text-white font-display text-lg">LOT FUNDING</h3>
              {productName && (
                <p className="text-xs text-white/50 font-medium">{productName}</p>
              )}
            </div>
          </div>
          <div className="text-right">
            <span className={`text-3xl font-display ${
              isFunded ? 'text-hype-green' : isAlmostFunded ? 'text-amber-400' : 'text-white'
            }`}>
              {progress.toFixed(1)}%
            </span>
            {isFunded && (
              <p className="text-xs text-hype-green font-display">FULLY FUNDED!</p>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative h-7 bg-zinc-800 rounded-full overflow-hidden mb-3 border-2 border-white shadow-sticker">
          {/* Animated stripes background */}
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `repeating-linear-gradient(
                45deg,
                transparent,
                transparent 10px,
                rgba(255,255,255,0.1) 10px,
                rgba(255,255,255,0.1) 20px
              )`,
            }}
          />
          
          {/* Progress fill */}
          <motion.div
            className={`absolute top-0 left-0 h-full rounded-full ${
              isFunded 
                ? 'bg-gradient-to-r from-green-500 to-emerald-400' 
                : isAlmostFunded
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                : 'bg-gradient-to-r from-cyan-500 via-violet-500 to-purple-500'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          >
            {/* Shine effect */}
            <motion.div
              className="absolute inset-0 opacity-30"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                backgroundSize: '200% 100%',
              }}
              animate={{
                backgroundPosition: ['-100%', '200%'],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            />
          </motion.div>

          {/* Current amount indicator */}
          {progress > 10 && (
            <motion.div
              className="absolute top-0 h-full flex items-center justify-end pr-2"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            >
              <span className="text-xs font-medium text-white drop-shadow-lg">
                {formatCents(currentCents)}
              </span>
            </motion.div>
          )}
        </div>

        {/* Footer stats */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-white/60">
            <span className="font-medium">Raised: <span className="text-white font-display">{formatCents(currentCents)}</span></span>
          </div>
          <div className="flex items-center gap-2 text-white/60">
            <span className="font-medium">Target: <span className="text-white font-display">{formatCents(targetCents)}</span></span>
          </div>
        </div>

        {/* Almost funded callout */}
        {isAlmostFunded && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border-2 border-amber-500/40 shadow-sticker"
          >
            <Zap className="w-5 h-5 text-amber-400" />
            <span className="text-sm text-amber-300 font-medium">
              Almost there! Only {formatCents(targetCents - currentCents)} left!
            </span>
          </motion.div>
        )}

        {/* Funded celebration */}
        {isFunded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-hype-green/10 border-2 border-hype-green/40 shadow-sticker"
          >
            <CheckCircle className="w-5 h-5 text-hype-green" />
            <span className="text-sm text-hype-green font-medium">
              Lot fully funded! Drawing winner soon...
            </span>
          </motion.div>
        )}
      </div>
    </div>
  );
});
