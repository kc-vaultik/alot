/**
 * @fileoverview Shared Card Reveal Animation
 * 
 * A reusable card reveal animation with flip effect and product display.
 * Works for mystery packs, room entries, and other card-based reveals.
 */

import { memo, useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import alotLogo from '@/assets/alot-logo.png';
import {
  Vignette,
  BackgroundBurst,
  LightRays,
} from '@/features/collect-room/components/unboxing/effects';
import { Confetti, FlipBurst } from '@/features/collect-room';

/**
 * Aura color configuration for card reveals
 */
export interface RevealAuraColors {
  /** Primary gradient classes for aura ring */
  primary: string;
  /** Background glow classes */
  glow: string;
  /** Particle effect classes */
  particles: string;
  /** Text color classes */
  text: string;
  /** Card gradient accent classes */
  gradient: string;
  /** RGBA glow color for box-shadow and filters */
  glowColor: string;
}

export interface CardRevealProps {
  /** Product image URL */
  productImageUrl?: string | null;
  /** Product name */
  productName: string;
  /** Product brand */
  productBrand?: string;
  /** Product value in dollars */
  productValue?: number;
  /** Digital number / serial */
  digitalNumber?: string;
  /** Expire date string */
  expireDate?: string;
  /** Rarity tier for styling */
  tier?: 'icon' | 'rare' | 'grail' | 'mythic';
  /** Aura colors config */
  aura?: RevealAuraColors;
  /** Number of confetti particles */
  confettiCount?: number;
  /** Primary action button text */
  primaryButtonText?: string;
  /** Secondary action button text */
  secondaryButtonText?: string;
  /** Handler for primary action */
  onPrimaryAction: () => void;
  /** Handler for secondary action */
  onSecondaryAction?: () => void;
  /** Custom content to show below product info */
  customContent?: React.ReactNode;
}

const DEFAULT_AURA: RevealAuraColors = {
  primary: 'from-violet-500 to-purple-600',
  glow: 'bg-violet-500/30',
  particles: 'bg-violet-400',
  gradient: 'from-violet-500 to-purple-600',
  text: 'text-violet-400',
  glowColor: 'rgba(139, 92, 246, 0.5)',
};

export const CardRevealAnimation = memo(function CardRevealAnimation({
  productImageUrl,
  productName,
  productBrand,
  productValue,
  digitalNumber = '0000-0000-0000-0000',
  expireDate = '—',
  tier = 'rare',
  aura = DEFAULT_AURA,
  confettiCount = 20,
  primaryButtonText = 'Continue',
  secondaryButtonText,
  onPrimaryAction,
  onSecondaryAction,
  customContent,
}: CardRevealProps) {
  const [phase, setPhase] = useState<'pause' | 'flip' | 'reveal'>('pause');
  const [showDetails, setShowDetails] = useState(false);
  const [showButtons, setShowButtons] = useState(false);
  const [cameraShake, setCameraShake] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // 3D tilt effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-200, 200], [8, -8]), { stiffness: 200, damping: 25 });
  const rotateY = useSpring(useTransform(mouseX, [-200, 200], [-8, 8]), { stiffness: 200, damping: 25 });

  useEffect(() => {
    const pauseTimer = setTimeout(() => setPhase('flip'), 400);
    const flipTimer = setTimeout(() => {
      setPhase('reveal');
      if (tier === 'mythic' || tier === 'grail') {
        setCameraShake(true);
        setTimeout(() => setCameraShake(false), 600);
      }
    }, 800);
    const detailsTimer = setTimeout(() => setShowDetails(true), 1200);
    const buttonsTimer = setTimeout(() => setShowButtons(true), 1800);
    
    return () => {
      clearTimeout(pauseTimer);
      clearTimeout(flipTimer);
      clearTimeout(detailsTimer);
      clearTimeout(buttonsTimer);
    };
  }, [tier]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    mouseX.set(e.clientX - centerX);
    mouseY.set(e.clientY - centerY);
  }, [mouseX, mouseY]);

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
  }, [mouseX, mouseY]);

  const cardBorderColor = {
    icon: 'border-cyan-400/40',
    rare: 'border-violet-400/40',
    grail: 'border-amber-400/40',
    mythic: 'border-amber-300/60',
  }[tier];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ 
        opacity: 1,
        x: cameraShake ? [0, -8, 8, -8, 8, -4, 4, 0] : 0,
        y: cameraShake ? [0, 4, -4, 4, -4, 2, -2, 0] : 0,
      }}
      exit={{ opacity: 0 }}
      transition={{ 
        opacity: { duration: 0.3 },
        x: { duration: 0.6, ease: 'easeOut' },
        y: { duration: 0.6, ease: 'easeOut' },
      }}
      className="flex flex-col items-center justify-start min-h-screen px-4 sm:px-6 pt-24 pb-32 relative overflow-x-hidden overflow-y-auto"
    >
      <Vignette />
      <BackgroundBurst phase={phase} aura={aura} tier={tier} />
      <LightRays tier={tier} isVisible={phase === 'reveal'} />
      <Confetti tier={tier} count={confettiCount} isVisible={phase === 'reveal'} />
      <FlipBurst isVisible={phase === 'flip'} glowColor={aura.glowColor} />

      {/* Card with flip animation */}
      <motion.div
        ref={cardRef}
        className="relative z-10"
        initial={{ rotateY: 180, scale: 0.7, opacity: 0 }}
        animate={{ 
          rotateY: phase !== 'pause' ? 0 : 180,
          scale: phase === 'reveal' ? 1 : 0.85,
          opacity: 1,
        }}
        transition={{ 
          type: 'spring', 
          duration: 1,
          bounce: 0.25,
          delay: phase === 'pause' ? 0.2 : 0,
        }}
        style={{ 
          perspective: 1200,
          rotateX,
          rotateY: phase === 'reveal' ? rotateY : undefined,
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Rarity aura ring */}
        <div style={{ filter: 'blur(20px)' }} className="absolute inset-0 pointer-events-none">
          <motion.div
            className={`absolute -inset-12 rounded-3xl bg-gradient-to-br ${aura.primary} blur-3xl`}
            animate={{
              opacity: phase === 'reveal' ? [0.3, 0.7, 0.3] : 0,
              scale: phase === 'reveal' ? [1, 1.1, 1] : 1,
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.div
            className={`absolute -inset-8 rounded-2xl bg-gradient-to-br ${aura.primary} blur-3xl`}
            animate={{ opacity: phase === 'reveal' ? [0.4, 0.8, 0.4] : 0 }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
          />
        </div>

        {/* Main card */}
        <div className="relative w-72 sm:w-80 aspect-[3/4.5]">
          <div 
            className={`absolute inset-0 bg-[#0a0a0f] rounded-2xl overflow-hidden border-4 border-white shadow-sticker ${cardBorderColor}`}
            style={{ boxShadow: phase === 'reveal' ? `0 0 60px ${aura.glowColor}` : undefined }}
          >
            {/* Gradient accent */}
            <div className={`absolute bottom-0 right-0 w-3/4 h-1/2 bg-gradient-to-tl ${aura.gradient} blur-2xl opacity-70`} />
            <div className={`absolute bottom-0 right-0 w-1/2 h-1/3 bg-gradient-to-tl ${aura.gradient} blur-xl opacity-90`} />
            
            {/* Noise texture */}
            <div 
              className="absolute inset-0 opacity-[0.03]" 
              style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }} 
            />

            {/* Card Header */}
            <div className="absolute top-6 left-6 z-10">
              <img src={alotLogo} alt="Alot!" className="h-12 object-contain" draggable={false} />
            </div>

            {/* Product image */}
            <AnimatePresence>
              {showDetails && productImageUrl && (
                <motion.div 
                  className="absolute inset-x-0 top-[15%] bottom-[35%] flex items-center justify-center pointer-events-none z-10"
                  initial={{ opacity: 0, scale: 0.3, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ type: 'spring', duration: 0.7, bounce: 0.3 }}
                >
                  <motion.img 
                    src={productImageUrl}
                    alt={productName}
                    className="max-w-[180px] max-h-[180px] sm:max-w-[200px] sm:max-h-[200px] object-contain"
                    draggable={false}
                    style={{ filter: `drop-shadow(0 0 20px ${aura.glowColor})` }}
                    animate={{ filter: [`drop-shadow(0 0 15px ${aura.glowColor})`, `drop-shadow(0 0 30px ${aura.glowColor})`, `drop-shadow(0 0 15px ${aura.glowColor})`] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Card Footer Info */}
            <AnimatePresence>
              {showDetails && (
                <motion.div 
                  className="absolute bottom-5 left-5 right-5 sm:bottom-6 sm:left-6 sm:right-6 z-10"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  <p className="text-amber-200/60 text-[8px] sm:text-[10px] tracking-[0.15em] uppercase mb-1">Unique Digital Number</p>
                  <p className="text-amber-200/90 text-sm sm:text-base font-light tracking-[0.1em] mb-3 sm:mb-4 whitespace-nowrap">{digitalNumber}</p>
                  <p className="text-amber-200/60 text-[8px] sm:text-[10px] tracking-[0.15em] uppercase mb-1">Expire Date</p>
                  <p className="text-amber-200/90 text-sm sm:text-base font-light">{expireDate}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Premium shine effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5 pointer-events-none rounded-2xl" />
            
            {/* Shimmer sweep on reveal */}
            {phase === 'reveal' && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                initial={{ x: '-100%' }}
                animate={{ x: '200%' }}
                transition={{ duration: 0.8, delay: 0.5 }}
              />
            )}
          </div>
        </div>
      </motion.div>

      {/* Product info section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: phase === 'reveal' ? 1 : 0, y: phase === 'reveal' ? 0 : 20 }}
        transition={{ delay: 0.8 }}
        className="mt-8 text-center relative z-10 w-full max-w-sm px-4"
      >
        <motion.p 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 0.9 }} 
          className="text-white/60 text-xs uppercase tracking-[0.2em] mb-1"
        >
          You got
        </motion.p>
        <motion.h2 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ delay: 1 }} 
          className={`text-2xl font-medium mb-1 ${aura.text}`}
        >
          {productName}
        </motion.h2>
        {productBrand && (
          <motion.p 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ delay: 1.1 }} 
            className="text-white/50 text-sm mb-2"
          >
            {productBrand}
          </motion.p>
        )}
        {productValue !== undefined && (
          <motion.p 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ delay: 1.15 }} 
            className={`text-lg font-semibold mb-6 ${aura.text}`}
          >
            ${productValue.toLocaleString()}
          </motion.p>
        )}

        {/* Custom content slot */}
        {customContent && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3 }}
          >
            {customContent}
          </motion.div>
        )}
      </motion.div>

      {/* Action buttons */}
      <AnimatePresence>
        {showButtons && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.2 }} 
            className="mt-6 flex flex-col sm:flex-row items-center gap-3 relative z-10"
          >
            {secondaryButtonText && onSecondaryAction && (
              <button 
                onClick={onSecondaryAction} 
                className="px-6 py-3 rounded-xl bg-white/10 border border-white/10 text-white text-sm font-light hover:bg-white/20 transition-all"
              >
                {secondaryButtonText}
              </button>
            )}
            <button 
              onClick={onPrimaryAction} 
              className={`px-6 py-3 rounded-xl text-sm font-medium transition-all bg-gradient-to-r ${tier === 'mythic' ? 'from-amber-500 to-amber-600 text-black' : 'from-violet-500 to-purple-600 text-white'} hover:opacity-90`}
            >
              {primaryButtonText}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});
