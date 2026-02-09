/**
 * @fileoverview Golden Card Reveal Component
 * Special reveal sequence for golden cards with enhanced celebration effects.
 */

import { memo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CollectCard } from '@/features/collect-room/types';
import { formatDigitalNumber, getExpireDate } from '@/features/collect-room/utils/formatters';
import { Star } from 'lucide-react';
import alotLogo from '@/assets/alot-logo.png';
import {
  Vignette,
  GoldenAmbientGlow,
  GoldenLightRays,
  GoldenSparkles,
  GoldenConfetti,
} from './effects';

interface GoldenRevealProps {
  card: CollectCard;
  onClaim: () => void;
}

export const GoldenReveal = memo(({ card, onClaim }: GoldenRevealProps) => {
  const [phase, setPhase] = useState<'silence' | 'reveal' | 'celebration'>('silence');

  const digitalNumber = formatDigitalNumber(card.serial_number);
  const expireDate = getExpireDate(card.card_id);

  useEffect(() => {
    const silenceTimer = setTimeout(() => setPhase('reveal'), 800);
    const celebrationTimer = setTimeout(() => setPhase('celebration'), 2000);
    
    return () => {
      clearTimeout(silenceTimer);
      clearTimeout(celebrationTimer);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ 
        opacity: 1,
        x: phase === 'reveal' ? [0, -10, 10, -10, 10, -6, 6, -3, 3, 0] : 0,
        y: phase === 'reveal' ? [0, 5, -5, 5, -5, 3, -3, 2, -2, 0] : 0,
      }}
      exit={{ opacity: 0 }}
      transition={{
        opacity: { duration: 0.4 },
        x: { duration: 0.8, ease: 'easeOut' },
        y: { duration: 0.8, ease: 'easeOut' },
      }}
      className="flex flex-col items-center justify-start min-h-screen px-4 sm:px-6 pt-24 pb-12 relative overflow-x-hidden"
    >
      <Vignette variant="golden" />
      <GoldenAmbientGlow phase={phase} />
      <GoldenLightRays isVisible={phase !== 'silence'} />
      <GoldenSparkles isVisible={phase !== 'silence'} />
      <GoldenConfetti isVisible={phase === 'celebration'} />

      {/* Card with golden transformation */}
      <motion.div
        className="relative z-10"
        initial={{ rotateY: 180, scale: 0.7, opacity: 0 }}
        animate={{ 
          rotateY: phase !== 'silence' ? 0 : 180, 
          scale: phase === 'celebration' ? 1 : 0.85,
          opacity: 1,
        }}
        transition={{ type: 'spring', duration: 1.2, bounce: 0.2 }}
        style={{ perspective: 1200 }}
      >
        {/* Multi-layer pulsing golden aura */}
        <motion.div
          className="absolute -inset-12 rounded-3xl bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500 blur-xl"
          animate={{
            opacity: phase !== 'silence' ? [0.2, 0.5, 0.2] : 0,
            scale: phase !== 'silence' ? [1, 1.15, 1] : 1,
          }}
          transition={{ duration: 1.8, repeat: Infinity }}
        />
        <motion.div
          className="absolute -inset-8 rounded-3xl bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-500"
          animate={{
            opacity: phase !== 'silence' ? [0.25, 0.7, 0.25] : 0,
            scale: phase !== 'silence' ? [1, 1.1, 1] : 1,
          }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
        />
        <motion.div
          className="absolute -inset-4 rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-300 to-amber-400 blur-sm"
          animate={{ opacity: phase !== 'silence' ? [0.3, 0.8, 0.3] : 0 }}
          transition={{ duration: 1.2, repeat: Infinity, delay: 0.6 }}
        />

        {/* Main card */}
        <div className="relative w-72 sm:w-80 aspect-[3/4.5]">
          <motion.div 
            className="absolute inset-0 rounded-2xl overflow-hidden"
            style={{ boxShadow: phase !== 'silence' ? '0 0 80px rgba(251,191,36,0.6), 0 0 120px rgba(251,191,36,0.3)' : undefined }}
          >
            {/* Golden gradient background */}
            <motion.div
              className="absolute inset-0"
              animate={{
                background: [
                  'linear-gradient(45deg, #B8860B, #FFD700, #FFA500, #FFD700, #B8860B)',
                  'linear-gradient(135deg, #FFD700, #FFA500, #B8860B, #FFA500, #FFD700)',
                  'linear-gradient(225deg, #FFA500, #B8860B, #FFD700, #B8860B, #FFA500)',
                  'linear-gradient(315deg, #B8860B, #FFD700, #FFA500, #FFD700, #B8860B)',
                ],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            />

            {/* Metallic shimmer sweep */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
              animate={{ x: ['-200%', '200%'] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
            />

            {/* Card Header */}
            <div className="absolute top-6 left-6 z-10">
              <img src={alotLogo} alt="Alot!" className="h-12 object-contain drop-shadow-lg" draggable={false} />
            </div>

            {/* GOLDEN badge */}
            <div className="absolute top-6 right-6 z-10">
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.8 }}
                animate={{ opacity: phase !== 'silence' ? 1 : 0, y: 0, scale: 1 }}
                transition={{ delay: 0.4, type: 'spring' }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-sm border border-white/20"
              >
                <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                  <Star className="w-3.5 h-3.5 text-white" fill="currentColor" />
                </motion.div>
                <span className="text-white text-[11px] font-bold tracking-[0.2em]">GOLDEN</span>
                <motion.div animate={{ rotate: [0, -15, 15, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                  <Star className="w-3.5 h-3.5 text-white" fill="currentColor" />
                </motion.div>
              </motion.div>
            </div>

            {/* Product image */}
            <div className="absolute inset-x-0 top-[15%] bottom-[35%] flex items-center justify-center">
              <motion.div
                initial={{ scale: 0, opacity: 0, rotate: -10 }}
                animate={{ scale: phase !== 'silence' ? 1 : 0, opacity: phase !== 'silence' ? 1 : 0, rotate: 0 }}
                transition={{ delay: 0.6, type: 'spring', bounce: 0.4 }}
              >
                <motion.img
                  src={card.product_image}
                  alt={card.product_reveal}
                  className="max-w-[160px] max-h-[160px] sm:max-w-[180px] sm:max-h-[180px] object-contain"
                  animate={{ filter: ['drop-shadow(0 0 20px rgba(255,255,255,0.5))', 'drop-shadow(0 0 40px rgba(255,255,255,0.8))', 'drop-shadow(0 0 20px rgba(255,255,255,0.5))'] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  draggable={false}
                />
              </motion.div>
            </div>

            {/* Card Footer Info */}
            <motion.div 
              className="absolute bottom-5 left-5 right-5 sm:bottom-6 sm:left-6 sm:right-6 z-10"
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: phase === 'celebration' ? 1 : 0, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <p className="text-black/60 text-[8px] sm:text-[10px] tracking-[0.15em] uppercase mb-1">Unique Digital Number</p>
              <p className="text-black text-sm sm:text-base font-light tracking-[0.1em] mb-3 sm:mb-4 whitespace-nowrap drop-shadow-sm">{digitalNumber}</p>
              <p className="text-black/60 text-[8px] sm:text-[10px] tracking-[0.15em] uppercase mb-1">Expire Date</p>
              <p className="text-black text-sm sm:text-base font-light drop-shadow-sm">{expireDate}</p>
            </motion.div>

            {/* Ornate golden border */}
            <div className="absolute inset-0 rounded-2xl border-4 border-amber-200/70" />
            <div className="absolute inset-1 rounded-[14px] border-2 border-amber-300/50" />
            <div className="absolute inset-2.5 rounded-xl border border-amber-400/30" />
          </motion.div>
        </div>
      </motion.div>

      {/* Text reveal */}
      <AnimatePresence>
        {phase !== 'silence' && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="mt-10 text-center max-w-md relative z-10"
          >
            <motion.h1
              className="text-2xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-100 to-amber-400 mb-4"
              animate={{ textShadow: ['0 0 40px rgba(251,191,36,0.6)', '0 0 80px rgba(251,191,36,1)', '0 0 40px rgba(251,191,36,0.6)'] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              You found a Golden Card!
            </motion.h1>
            <motion.p className="text-white/80 text-sm mb-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }}>
              Congratulations! You've unlocked instant 100% redemption!
            </motion.p>
            <motion.p className="text-amber-400/70 text-xs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}>
              Golden Cards grant immediate product redemption. No shards needed - claim your {card.model} now!
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Claim button */}
      <AnimatePresence>
        {phase === 'celebration' && (
          <motion.button
            initial={{ opacity: 0, y: 25, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 1.5, type: 'spring' }}
            onClick={onClaim}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="mt-8 px-12 py-4 rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-black font-bold hover:from-amber-300 hover:to-amber-400 transition-all text-sm tracking-wide relative z-10 overflow-hidden"
            style={{ boxShadow: '0 0 40px rgba(251,191,36,0.5), 0 4px 20px rgba(0,0,0,0.3)' }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.5 }}
            />
            <span className="relative z-10">Redeem Product</span>
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

GoldenReveal.displayName = 'GoldenReveal';
