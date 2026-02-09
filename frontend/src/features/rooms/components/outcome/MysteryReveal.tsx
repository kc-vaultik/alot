/**
 * @fileoverview Mystery product reveal animation
 */

import { memo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Eye } from 'lucide-react';
import { formatCents } from '../../utils';
import { ROOM_TIERS } from '../../constants';
import type { RoomTier } from '../../types';

interface MysteryRevealProps {
  product: {
    id: string;
    name: string;
    brand: string;
    image_url: string | null;
    retail_value_usd: number;
    category: string;
  };
  tier: RoomTier;
  onComplete: () => void;
}

export const MysteryReveal = memo(function MysteryReveal({
  product,
  tier,
  onComplete,
}: MysteryRevealProps) {
  const [phase, setPhase] = useState<'mystery' | 'revealing' | 'revealed'>('mystery');
  const tierConfig = ROOM_TIERS[tier];

  useEffect(() => {
    // Auto-advance phases
    const timers = [
      setTimeout(() => setPhase('revealing'), 2000),
      setTimeout(() => setPhase('revealed'), 4000),
      setTimeout(onComplete, 7000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
    >
      {/* Ambient particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-violet-400"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            animate={{
              y: [null, Math.random() * -300],
              opacity: [0, 0.8, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Radial glow */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full"
        style={{
          background: `radial-gradient(circle, ${
            phase === 'revealed' ? 'rgba(251,191,36,0.3)' : 'rgba(139,92,246,0.3)'
          } 0%, transparent 70%)`,
        }}
        animate={{
          scale: phase === 'revealing' ? [1, 1.5, 1] : 1,
          opacity: phase === 'mystery' ? 0.5 : 0.8,
        }}
        transition={{ duration: 1 }}
      />

      <div className="relative z-10 text-center px-6">
        <AnimatePresence mode="wait">
          {/* Mystery phase */}
          {phase === 'mystery' && (
            <motion.div
              key="mystery"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.2 }}
              className="text-center"
            >
              <p className="text-violet-400/80 text-sm uppercase tracking-widest mb-6">
                Mystery Room Funded
              </p>
              
              <motion.div
                className="w-40 h-40 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 border-2 border-violet-400/30 flex items-center justify-center backdrop-blur-sm relative"
                animate={{
                  boxShadow: [
                    '0 0 30px rgba(139,92,246,0.3)',
                    '0 0 60px rgba(139,92,246,0.5)',
                    '0 0 30px rgba(139,92,246,0.3)',
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <motion.span
                  className="text-8xl font-bold text-white/60"
                  animate={{ 
                    scale: [1, 1.1, 1],
                    opacity: [0.6, 0.9, 0.6],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  ?
                </motion.span>
                <Sparkles className="absolute -top-3 -right-3 w-8 h-8 text-violet-400 animate-pulse" />
              </motion.div>

              <h2 className="text-3xl font-bold text-white mb-2">What will it be?</h2>
              <p className="text-white/50">Revealing the mystery prize...</p>
            </motion.div>
          )}

          {/* Revealing phase */}
          {phase === 'revealing' && (
            <motion.div
              key="revealing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <motion.div
                className="w-48 h-48 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-white/5 to-white/10 border-2 border-white/20 flex items-center justify-center overflow-hidden relative"
                animate={{
                  borderColor: ['rgba(255,255,255,0.2)', 'rgba(251,191,36,0.5)', 'rgba(255,255,255,0.2)'],
                }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                {/* Scanning effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-400/30 to-transparent"
                  animate={{ y: [-200, 200] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                />
                
                {/* Blurred product preview */}
                {product.image_url && (
                  <motion.img
                    src={product.image_url}
                    alt=""
                    className="w-32 h-32 object-contain"
                    initial={{ filter: 'blur(30px)', opacity: 0.3 }}
                    animate={{ filter: 'blur(10px)', opacity: 0.6 }}
                    transition={{ duration: 2 }}
                  />
                )}

                <Eye className="absolute w-10 h-10 text-white/30" />
              </motion.div>

              <div className="flex items-center justify-center gap-2 text-white/60">
                <motion.div
                  className="w-2 h-2 rounded-full bg-violet-400"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 0.6, repeat: Infinity }}
                />
                <motion.div
                  className="w-2 h-2 rounded-full bg-violet-400"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                />
                <motion.div
                  className="w-2 h-2 rounded-full bg-violet-400"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                />
              </div>
            </motion.div>
          )}

          {/* Revealed phase */}
          {phase === 'revealed' && (
            <motion.div
              key="revealed"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', bounce: 0.5 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="text-6xl mb-6"
              >
                ✨
              </motion.div>

              <p className={`text-sm uppercase tracking-widest mb-4 bg-gradient-to-r ${tierConfig.color} text-transparent bg-clip-text`}>
                {tierConfig.name} Prize Revealed
              </p>

              {/* Product card */}
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-2xl p-6 border border-amber-500/30 max-w-sm mx-auto"
              >
                {product.image_url && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="w-40 h-40 mx-auto mb-4"
                  >
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-contain"
                    />
                  </motion.div>
                )}
                
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  <h3 className="text-2xl font-bold text-white mb-1">{product.name}</h3>
                  <p className="text-white/50 text-sm mb-3">{product.brand} • {product.category}</p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/20 border border-amber-500/30">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="text-amber-400 font-semibold">
                      {formatCents(product.retail_value_usd * 100)}
                    </span>
                  </div>
                </motion.div>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="mt-6 text-white/40 text-sm"
              >
                Drawing winner now...
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});
