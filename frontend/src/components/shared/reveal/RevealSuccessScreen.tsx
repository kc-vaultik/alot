/**
 * @fileoverview Reveal Success Screen
 * 
 * A flexible success/confirmation screen shown after a reveal.
 * Used for showing ticket counts, progress, or other post-reveal info.
 */

import { memo } from 'react';
import { motion } from 'framer-motion';

export interface RevealSuccessProps {
  /** Large emoji or icon to display */
  icon: string;
  /** Main title */
  title: string;
  /** Subtitle / description */
  subtitle?: string;
  /** Stats to display in a grid */
  stats?: Array<{
    label: string;
    value: string | number;
    colorClass?: string;
  }>;
  /** Progress bar config (0-100) */
  progress?: {
    value: number;
    colorClass?: string;
  };
  /** Additional info text */
  infoText?: string;
  /** Primary button text */
  primaryButtonText: string;
  /** Primary button handler */
  onPrimaryAction: () => void;
  /** Ambient glow gradient (Tailwind classes) */
  ambientGlow?: string;
  /** Button gradient (Tailwind classes) */
  buttonGradient?: string;
}

export const RevealSuccessScreen = memo(function RevealSuccessScreen({
  icon,
  title,
  subtitle,
  stats,
  progress,
  infoText,
  primaryButtonText,
  onPrimaryAction,
  ambientGlow = 'from-violet-500/20 to-purple-500/20',
  buttonGradient = 'from-violet-500 to-purple-600',
}: RevealSuccessProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center min-h-screen px-4 py-12"
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          className={`w-[500px] h-[500px] rounded-full blur-3xl bg-gradient-to-r ${ambientGlow}`}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.4, 0.6, 0.4],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', bounce: 0.5 }}
        className="text-5xl mb-6 relative z-10"
      >
        {icon}
      </motion.div>

      {/* Title */}
      <motion.h2
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-2xl sm:text-3xl font-bold text-white mb-2 relative z-10 text-center"
      >
        {title}
      </motion.h2>

      {/* Subtitle */}
      {subtitle && (
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-white/50 mb-8 relative z-10 text-center"
        >
          {subtitle}
        </motion.p>
      )}

      {/* Stats card */}
      {stats && stats.length > 0 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="w-full max-w-sm bg-zinc-900/50 rounded-2xl p-6 border border-white/10 mb-8 relative z-10"
        >
          <div className={`grid ${stats.length === 2 ? 'grid-cols-2' : 'grid-cols-1'} gap-6`}>
            {stats.map((stat, index) => (
              <div key={index}>
                <p className="text-white/40 text-xs uppercase tracking-wider mb-1">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.colorClass || 'text-white'}`}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
          
          {/* Progress bar */}
          {progress && (
            <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(progress.value, 100)}%` }}
                transition={{ delay: 0.6, duration: 1, ease: 'easeOut' }}
                className={`h-full bg-gradient-to-r ${progress.colorClass || 'from-violet-500 to-purple-500'}`}
              />
            </div>
          )}

          {/* Info text */}
          {infoText && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-4 text-center text-white/30 text-sm"
            >
              {infoText}
            </motion.p>
          )}
        </motion.div>
      )}

      {/* Action button */}
      <motion.button
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        onClick={onPrimaryAction}
        className={`px-8 py-3 rounded-xl bg-gradient-to-r ${buttonGradient} text-white font-medium hover:shadow-lg hover:shadow-violet-500/20 transition-all relative z-10`}
      >
        {primaryButtonText}
      </motion.button>
    </motion.div>
  );
});
