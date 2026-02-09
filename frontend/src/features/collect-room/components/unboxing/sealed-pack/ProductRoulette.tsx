/**
 * @fileoverview Product Roulette Component
 * @description Animated circular display that cycles through product images
 */

import { motion, AnimatePresence } from 'framer-motion';
import { rouletteProducts } from './constants';

interface ProductRouletteProps {
  currentProductIndex: number;
  isUnsealing: boolean;
}

export function ProductRoulette({ currentProductIndex, isUnsealing }: ProductRouletteProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <motion.div 
        className="w-48 h-48"
        animate={isUnsealing ? { scale: 0.8, opacity: 0 } : {
          scale: [1, 1.03, 1],
        }}
        transition={isUnsealing ? { duration: 0.4 } : { 
          duration: 3, 
          repeat: Infinity, 
          ease: 'easeInOut' 
        }}
      >
        {/* Outer glow ring */}
        <motion.div
          className="absolute -inset-4 rounded-full bg-gradient-to-br from-violet-500/20 via-purple-500/10 to-amber-500/20 blur-xl"
          animate={{
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        
        <motion.div
          className="w-full h-full rounded-full"
          animate={{
            background: [
              'linear-gradient(45deg, rgba(139,92,246,0.5), rgba(217,70,239,0.5), rgba(251,191,36,0.5))',
              'linear-gradient(135deg, rgba(217,70,239,0.5), rgba(251,191,36,0.5), rgba(139,92,246,0.5))',
              'linear-gradient(225deg, rgba(251,191,36,0.5), rgba(139,92,246,0.5), rgba(217,70,239,0.5))',
              'linear-gradient(315deg, rgba(139,92,246,0.5), rgba(217,70,239,0.5), rgba(251,191,36,0.5))',
            ],
            boxShadow: [
              '0 0 30px rgba(139,92,246,0.3)',
              '0 0 40px rgba(217,70,239,0.4)',
              '0 0 30px rgba(251,191,36,0.3)',
              '0 0 40px rgba(139,92,246,0.4)',
            ],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        />
        
        {/* Inner seal with product roulette */}
        <motion.div 
          className="absolute inset-3 rounded-full border border-white/20 flex items-center justify-center backdrop-blur-sm bg-black/40 overflow-hidden"
          animate={{
            borderColor: ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.25)', 'rgba(255,255,255,0.1)'],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {/* Product crossfade */}
          <div className="relative w-20 h-20">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentProductIndex}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <img 
                  src={rouletteProducts[currentProductIndex].src} 
                  alt={rouletteProducts[currentProductIndex].alt}
                  className="max-w-full max-h-full object-contain drop-shadow-lg"
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
        
        {/* "MYSTERY" label below the circle */}
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2">
          <motion.span 
            className="text-[10px] font-light tracking-[0.3em] text-white/40 uppercase"
            animate={{
              opacity: [0.4, 0.7, 0.4],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Mystery
          </motion.span>
        </div>
      </motion.div>
    </div>
  );
}
