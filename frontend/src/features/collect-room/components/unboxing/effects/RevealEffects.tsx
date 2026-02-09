/**
 * @fileoverview Shared visual effects for card reveal animations
 * Includes light rays, confetti, background bursts, and sparkles
 */

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { RarityTier } from '@/types/shared';
import type { AuraColors } from '@/utils/styling';
import { getLightRayGradient, getConfettiColor } from '@/utils/styling';

// ============= Background Burst =============

interface BackgroundBurstProps {
  phase: string;
  aura: AuraColors;
  tier: RarityTier;
}

export const BackgroundBurst = memo(({ phase, aura, tier }: BackgroundBurstProps) => (
  <motion.div
    className="absolute inset-0 flex items-center justify-center pointer-events-none"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    style={{ filter: 'blur(40px)' }}
  >
    <motion.div
      className={`w-[900px] h-[900px] rounded-full ${aura.glow}`}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ 
        scale: phase !== 'pause' ? [0, 1.8, 1.2] : 0,
        opacity: phase !== 'pause' ? 1 : 0,
      }}
      transition={{ duration: 1.2, ease: 'easeOut' }}
    />
    {/* Secondary glow ring for high rarity */}
    {(tier === 'mythic' || tier === 'grail') && (
      <motion.div
        className={`absolute w-[600px] h-[600px] rounded-full ${aura.glow}`}
        initial={{ scale: 0 }}
        animate={{ 
          scale: phase === 'reveal' ? [0, 2, 1.5] : 0,
        }}
        transition={{ duration: 0.8, delay: 0.3 }}
      />
    )}
  </motion.div>
));

BackgroundBurst.displayName = 'BackgroundBurst';

// ============= Light Rays =============

interface LightRaysProps {
  tier: RarityTier;
  isVisible: boolean;
}

export const LightRays = memo(({ tier, isVisible }: LightRaysProps) => {
  if (tier !== 'mythic' && tier !== 'grail' && tier !== 'rare') return null;
  
  const rayCount = tier === 'mythic' ? 16 : tier === 'grail' ? 12 : 8;
  const lightRayGradient = getLightRayGradient(tier);

  return (
    <AnimatePresence>
      {isVisible && (
        <div 
          className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden"
          style={{ filter: 'blur(8px)' }}
        >
          {[...Array(rayCount)].map((_, i) => (
            <motion.div
              key={i}
              className={`absolute h-[600px] ${lightRayGradient}`}
              style={{
                width: `${4 + Math.random() * 3}px`,
                rotate: `${i * (360 / rayCount)}deg`,
                transformOrigin: 'center center',
              }}
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: 1, scaleY: 1 }}
              transition={{ delay: 0.1 + i * 0.02, duration: 0.6 }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
});

LightRays.displayName = 'LightRays';

// ============= Confetti =============

interface ConfettiProps {
  tier: RarityTier;
  count: number;
  isVisible: boolean;
}

export const Confetti = memo(({ tier, count, isVisible }: ConfettiProps) => {
  if (count === 0) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(count)].map((_, i) => (
            <motion.div
              key={i}
              className={`absolute ${getConfettiColor(tier, i)}`}
              style={{
                left: `${Math.random() * 100}%`,
                top: '-8%',
                width: `${3 + Math.random() * 6}px`,
                height: `${3 + Math.random() * 6}px`,
                borderRadius: i % 3 === 0 ? '50%' : i % 3 === 1 ? '2px' : '1px',
              }}
              initial={{ opacity: 0, y: 0 }}
              animate={{
                opacity: [0, 1, 1, 0.5, 0],
                y: ['0vh', '130vh'],
                x: [(Math.random() - 0.5) * 60, (Math.random() - 0.5) * 200],
                rotate: [0, 540 * (Math.random() > 0.5 ? 1 : -1)],
                scale: [1, 1.2, 0.8],
              }}
              transition={{
                duration: 3.5 + Math.random() * 2,
                delay: 0.3 + Math.random() * 0.8,
                ease: 'linear',
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
});

Confetti.displayName = 'Confetti';

// ============= Flip Burst =============

interface FlipBurstProps {
  isVisible: boolean;
  glowColor: string;
}

export const FlipBurst = memo(({ isVisible, glowColor }: FlipBurstProps) => (
  <AnimatePresence>
    {isVisible && (
      <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        style={{ filter: 'blur(20px)' }}
      >
        <div 
          className="w-[500px] h-[500px] rounded-full blur-3xl"
          style={{ background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)` }}
        />
      </motion.div>
    )}
  </AnimatePresence>
));

FlipBurst.displayName = 'FlipBurst';

// ============= Vignette =============

interface VignetteProps {
  variant?: 'default' | 'golden';
}

export const Vignette = memo(({ variant = 'default' }: VignetteProps) => (
  <div className="absolute inset-0 pointer-events-none z-30">
    {variant === 'golden' ? (
      <>
        <div className="absolute inset-0 bg-gradient-to-t from-amber-900/30 via-transparent to-amber-900/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-amber-900/20 via-transparent to-amber-900/20" />
      </>
    ) : (
      <>
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30" />
      </>
    )}
  </div>
));

Vignette.displayName = 'Vignette';

// ============= Golden Effects =============

interface GoldenAmbientGlowProps {
  phase: string;
}

export const GoldenAmbientGlow = memo(({ phase }: GoldenAmbientGlowProps) => (
  <motion.div
    className="absolute inset-0 flex items-center justify-center pointer-events-none"
    initial={{ opacity: 0 }}
    animate={{ opacity: phase !== 'silence' ? 1 : 0 }}
  >
    <motion.div
      className="w-[1200px] h-[1200px] rounded-full bg-gradient-radial from-amber-400/40 via-amber-500/15 to-transparent blur-3xl"
      animate={{
        scale: phase === 'celebration' ? [1, 1.4, 1.2] : 1,
        opacity: phase === 'celebration' ? [0.5, 1, 0.7] : 0.5,
      }}
      transition={{ duration: 2.5, repeat: Infinity }}
    />
    <motion.div
      className="absolute w-[600px] h-[600px] rounded-full bg-gradient-radial from-yellow-300/30 via-amber-400/10 to-transparent blur-2xl"
      animate={{
        scale: phase !== 'silence' ? [1, 1.3, 1] : 0,
      }}
      transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
    />
  </motion.div>
));

GoldenAmbientGlow.displayName = 'GoldenAmbientGlow';

interface GoldenLightRaysProps {
  isVisible: boolean;
}

export const GoldenLightRays = memo(({ isVisible }: GoldenLightRaysProps) => (
  <AnimatePresence>
    {isVisible && (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        {[...Array(24)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute bg-gradient-to-t from-amber-400/60 via-yellow-300/35 to-transparent"
            style={{
              width: `${2 + (i % 3)}px`,
              height: `${500 + Math.random() * 200}px`,
              rotate: `${i * 15}deg`,
              transformOrigin: 'center center',
            }}
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: 1, scaleY: 1 }}
            transition={{ delay: 0.1 + i * 0.025, duration: 0.9 }}
          />
        ))}
      </div>
    )}
  </AnimatePresence>
));

GoldenLightRays.displayName = 'GoldenLightRays';

interface GoldenSparklesProps {
  isVisible: boolean;
}

export const GoldenSparkles = memo(({ isVisible }: GoldenSparklesProps) => (
  <AnimatePresence>
    {isVisible && (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(30)].map((_, i) => {
          const angle = (i / 30) * Math.PI * 2;
          const radius = 250 + Math.random() * 100;
          return (
            <motion.div
              key={`sparkle-${i}`}
              className="absolute w-1 h-1 bg-amber-200 rounded-full"
              style={{
                left: '50%',
                top: '40%',
              }}
              initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1.5, 0],
                x: Math.cos(angle) * radius,
                y: Math.sin(angle) * radius,
              }}
              transition={{
                duration: 1.5,
                delay: 0.5 + i * 0.05,
                repeat: Infinity,
                repeatDelay: 2,
              }}
            />
          );
        })}
      </div>
    )}
  </AnimatePresence>
));

GoldenSparkles.displayName = 'GoldenSparkles';

interface GoldenConfettiProps {
  isVisible: boolean;
}

export const GoldenConfetti = memo(({ isVisible }: GoldenConfettiProps) => (
  <AnimatePresence>
    {isVisible && (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(120)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute ${
              i % 5 === 0 ? 'bg-amber-400' :
              i % 5 === 1 ? 'bg-yellow-300' :
              i % 5 === 2 ? 'bg-amber-500' :
              i % 5 === 3 ? 'bg-white' :
              'bg-yellow-200'
            }`}
            style={{
              left: `${Math.random() * 100}%`,
              top: '-12%',
              width: `${4 + Math.random() * 10}px`,
              height: `${4 + Math.random() * 10}px`,
              borderRadius: i % 3 === 0 ? '50%' : i % 3 === 1 ? '2px' : '1px',
            }}
            animate={{
              y: ['0vh', '130vh'],
              x: [(Math.random() - 0.5) * 120, (Math.random() - 0.5) * 400],
              rotate: [0, 900 * (Math.random() > 0.5 ? 1 : -1)],
              opacity: [1, 1, 0.5, 0],
              scale: [1, 1.2, 0.6],
            }}
            transition={{
              duration: 3 + Math.random() * 2.5,
              delay: Math.random() * 0.7,
              ease: 'easeOut',
            }}
          />
        ))}
      </div>
    )}
  </AnimatePresence>
));

GoldenConfetti.displayName = 'GoldenConfetti';
