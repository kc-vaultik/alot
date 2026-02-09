/**
 * @fileoverview Card Reveal Component
 * Orchestrates the card reveal animation sequence with flip, effects, and product info display.
 */

import { memo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CollectCard } from '@/features/collect-room/types';
import { getRarityTier, getRarityLabel } from '@/utils/styling';
import { getAuraColors, getCardBorderColor } from '@/utils/styling';
import { formatDigitalNumber, getExpireDate } from '@/features/collect-room/utils/formatters';
import { Sparkles } from 'lucide-react';
import alotLogo from '@/assets/alot-logo.png';
import {
  Vignette,
  BackgroundBurst,
  LightRays,
  Confetti,
  FlipBurst,
} from './effects';

interface CardRevealProps {
  card: CollectCard;
  onContinue: () => void;
  onUnboxAnother: () => void;
}

export const CardReveal = memo(({ card, onContinue, onUnboxAnother }: CardRevealProps) => {
  const [phase, setPhase] = useState<'pause' | 'flip' | 'reveal'>('pause');
  const [showDetails, setShowDetails] = useState(false);
  const [showAdded, setShowAdded] = useState(false);
  const [cameraShake, setCameraShake] = useState(false);
  
  const tier = getRarityTier(card.rarity_score);
  const rarityLabel = getRarityLabel(tier);
  const aura = getAuraColors(tier);
  const cardBorderColor = getCardBorderColor(tier);
  const confettiCount = tier === 'mythic' ? 60 : tier === 'grail' ? 40 : tier === 'rare' ? 20 : 0;

  const digitalNumber = formatDigitalNumber(card.serial_number);
  const expireDate = getExpireDate(card.card_id);

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
    const addedTimer = setTimeout(() => setShowAdded(true), 1800);
    
    return () => {
      clearTimeout(pauseTimer);
      clearTimeout(flipTimer);
      clearTimeout(detailsTimer);
      clearTimeout(addedTimer);
    };
  }, [tier]);

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
      className="flex flex-col items-center justify-start min-h-screen px-4 sm:px-6 pt-24 pb-24 relative overflow-x-hidden"
    >
      <Vignette />
      <BackgroundBurst phase={phase} aura={aura} tier={tier} />
      <LightRays tier={tier} isVisible={phase === 'reveal'} />
      <Confetti tier={tier} count={confettiCount} isVisible={phase === 'reveal'} />
      <FlipBurst isVisible={phase === 'flip'} glowColor={aura.glowColor} />

      {/* Card with flip animation */}
      <motion.div
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
        style={{ perspective: 1200 }}
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
              {showDetails && (
                <motion.div 
                  className="absolute inset-x-0 top-[15%] bottom-[35%] flex items-center justify-center pointer-events-none z-10"
                  initial={{ opacity: 0, scale: 0.3, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ type: 'spring', duration: 0.7, bounce: 0.3 }}
                >
                  <motion.img 
                    src={card.product_image}
                    alt={card.product_reveal}
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

      {/* Product reveal + Progress Shards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: phase === 'reveal' ? 1 : 0, y: phase === 'reveal' ? 0 : 20 }}
        transition={{ delay: 0.8 }}
        className="mt-8 text-center relative z-10 w-full max-w-sm px-4"
      >
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }} className="text-white/60 text-xs uppercase tracking-[0.2em] mb-1">You pulled</motion.p>
        <motion.h2 initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1 }} className={`text-2xl font-medium mb-1 ${aura.text}`}>{card.model}</motion.h2>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }} className="text-white/50 text-sm mb-2">{card.brand}</motion.p>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.15 }} className={`text-lg font-semibold mb-6 ${aura.text}`}>${card.product_value?.toLocaleString() || '0'}</motion.p>

        {/* Progress Shards Section */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.3 }} className="bg-white/5 rounded-2xl p-5 border border-white/10 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className={`w-4 h-4 ${aura.text}`} />
              <span className="text-white/70 text-sm font-medium">Progress Shards Earned</span>
            </div>
            <span className={`text-lg font-bold ${aura.text}`}>+{(card.rewards?.progress?.shards_earned || 0).toFixed(2)}%</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-3">
            <motion.div className={`h-full bg-gradient-to-r ${aura.primary}`} initial={{ width: 0 }} animate={{ width: `${Math.min(card.rewards?.progress?.shards_earned || 0, 100)}%` }} transition={{ delay: 1.5, duration: 0.8, ease: 'easeOut' }} />
          </div>
          <p className="text-white/40 text-xs text-center">Collecting shards toward {card.model} redemption</p>
        </motion.div>

        {/* Credits earned */}
        {card.rewards?.points && card.rewards.points > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }} className="mt-4 flex items-center justify-center gap-4 text-xs">
            <span className="text-violet-400">+{card.rewards.points} credits earned</span>
          </motion.div>
        )}
      </motion.div>

      {/* Action buttons */}
      <AnimatePresence>
        {showAdded && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-6 flex flex-col sm:flex-row items-center gap-3 relative z-10">
            <button onClick={onContinue} className="px-6 py-3 rounded-xl bg-white/10 border border-white/10 text-white text-sm font-light hover:bg-white/20 transition-all">View Vault</button>
            <button onClick={onUnboxAnother} className={`px-6 py-3 rounded-xl text-sm font-medium transition-all bg-gradient-to-r ${tier === 'mythic' ? 'from-amber-500 to-amber-600 text-black' : 'from-violet-500 to-purple-600 text-white'} hover:opacity-90`}>Unbox Another</button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

CardReveal.displayName = 'CardReveal';
