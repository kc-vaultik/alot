/**
 * @fileoverview Winner celebration - "Digital Vandalism" Style
 * @description YOU WON ALOT! with confetti and sticker aesthetic
 */

import { memo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Sparkles, Gift, ArrowRight } from 'lucide-react';
import { formatCents } from '../../utils';

interface WinnerRevealProps {
  product: {
    id: string;
    name: string;
    brand: string;
    image_url: string | null;
    retail_value_usd: number;
    category: string;
  };
  winnerName: string;
  isCurrentUserWinner: boolean;
  onClaim?: () => void;
  onClose: () => void;
}

// Confetti with hype colors
const ConfettiParticle = memo(function ConfettiParticle({ index }: { index: number }) {
  const colors = ['#FF1493', '#00D4FF', '#39FF14', '#FFD700', '#FF6B6B', '#4ECDC4'];
  const color = colors[index % colors.length];
  const startX = Math.random() * 100;
  const delay = Math.random() * 2;
  const duration = 3 + Math.random() * 2;
  const size = 10 + Math.random() * 10;
  
  return (
    <motion.div
      className="absolute"
      style={{
        left: `${startX}%`,
        top: -20,
        width: size,
        height: size,
        backgroundColor: color,
        borderRadius: Math.random() > 0.5 ? '50%' : '4px',
        border: '2px solid white',
      }}
      initial={{ y: -20, opacity: 1, rotate: 0 }}
      animate={{
        y: window.innerHeight + 20,
        opacity: [1, 1, 0],
        rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
        x: (Math.random() - 0.5) * 200,
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'linear',
      }}
    />
  );
});

export const WinnerReveal = memo(function WinnerReveal({
  product,
  winnerName,
  isCurrentUserWinner,
  onClaim,
  onClose,
}: WinnerRevealProps) {
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/98 overflow-hidden"
    >
      {/* Confetti */}
      {showConfetti && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(60)].map((_, i) => (
            <ConfettiParticle key={i} index={i} />
          ))}
        </div>
      )}

      {/* Radial glow with hype colors */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          className="w-[800px] h-[800px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(255,20,147,0.3) 0%, rgba(0,212,255,0.2) 50%, transparent 70%)',
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      </div>

      {/* Content */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', bounce: 0.4, delay: 0.2 }}
        className="relative z-10 text-center px-6 max-w-lg"
      >
        {/* Trophy - Sticker style */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', bounce: 0.5, delay: 0.3 }}
          className="w-28 h-28 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-hype-green to-emerald-400 flex items-center justify-center border-4 border-white shadow-sticker transform rotate-3"
        >
          <Trophy className="w-14 h-14 text-black" strokeWidth={2.5} />
        </motion.div>

        {/* Winner text */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {isCurrentUserWinner ? (
            <>
              <h1 className="font-display text-5xl sm:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-hype-pink via-hype-blue to-hype-green mb-2 transform -rotate-1">
                YOU WON ALOT!
              </h1>
              <p className="text-muted-foreground text-lg font-bold uppercase tracking-wide">Congratulations!</p>
            </>
          ) : (
            <>
              <h1 className="font-display text-4xl sm:text-5xl text-foreground mb-2 transform -rotate-1">
                WINNER!
              </h1>
              <p className="text-hype-green text-xl font-bold">{winnerName}</p>
            </>
          )}
        </motion.div>

        {/* Product card - Sticker style */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-8 bg-card rounded-2xl p-6 border-4 border-white shadow-sticker transform rotate-1"
        >
          {product.image_url && (
            <div className="w-32 h-32 mx-auto mb-4">
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-contain"
              />
            </div>
          )}
          <h3 className="text-xl font-bold text-foreground mb-1">{product.name}</h3>
          <p className="text-muted-foreground text-sm mb-2">{product.brand} • {product.category}</p>
          <div className="flex items-center justify-center gap-1 text-hype-green">
            <Sparkles className="w-5 h-5" strokeWidth={2.5} />
            <span className="text-lg font-display">
              {formatCents(product.retail_value_usd * 100)}
            </span>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-8 space-y-3"
        >
          {isCurrentUserWinner && onClaim ? (
            <button
              onClick={onClaim}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-hype-green to-emerald-400 text-black font-bold text-lg uppercase tracking-wide flex items-center justify-center gap-2 border-4 border-white shadow-sticker hover:scale-105 transition-transform transform -rotate-1"
            >
              <Gift className="w-5 h-5" strokeWidth={2.5} />
              Claim Your Prize
              <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="w-full py-4 rounded-xl bg-secondary text-foreground font-bold text-lg uppercase tracking-wide border-2 border-border hover:bg-secondary/80 transition-colors"
            >
              {isCurrentUserWinner ? 'Close' : 'See Your Options'}
            </button>
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  );
});
