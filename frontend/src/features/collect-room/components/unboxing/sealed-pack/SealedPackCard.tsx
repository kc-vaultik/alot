/**
 * @fileoverview Sealed Pack Card Component
 * @description Main pack with tear animation and effects
 */

import { motion, AnimatePresence } from 'framer-motion';
import packImage from '@/assets/collect-room-pack.png';

interface SealedPackCardProps {
  isUnsealing: boolean;
  isHovering: boolean;
  suspenseProgress: number;
  currentProductIndex: number;
  availableCards: number;
  onTap: () => void;
  onHoverStart: () => void;
  onHoverEnd: () => void;
}

export function SealedPackCard({
  isUnsealing,
  isHovering,
  suspenseProgress,
  availableCards,
  onTap,
  onHoverStart,
  onHoverEnd,
}: SealedPackCardProps) {
  return (
    <div className="flex flex-col items-center">
      <motion.button
        onClick={onTap}
        disabled={isUnsealing}
        onMouseEnter={onHoverStart}
        onMouseLeave={onHoverEnd}
        className="relative group cursor-pointer focus:outline-none z-10"
        whileHover={!isUnsealing ? { scale: 1.02, y: -5 } : {}}
        whileTap={!isUnsealing ? { scale: 0.98 } : {}}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {/* Pack container */}
        <div className="relative">
          {/* Available cards badge */}
          <AnimatePresence>
            {availableCards > 0 && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute -top-2 -right-2 z-30 min-w-[28px] h-7 px-2 rounded-full bg-violet-500 flex items-center justify-center shadow-lg shadow-violet-500/40"
              >
                <span className="text-white text-sm font-semibold">{availableCards}</span>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Enhanced outer glow - always visible, intensifies on hover */}
          <motion.div
            className="absolute -inset-6 rounded-2xl bg-gradient-to-br from-violet-500/30 via-purple-500/20 to-amber-500/30 blur-2xl"
            animate={{ 
              opacity: isHovering ? 0.9 : 0.6,
              scale: isHovering ? 1.05 : 1,
            }}
            transition={{ duration: 0.4 }}
          />
          <motion.div
            className="absolute -inset-3 rounded-2xl bg-gradient-to-br from-amber-400/20 via-transparent to-violet-500/20 blur-xl"
            animate={{ 
              opacity: isHovering ? 0.7 : 0.4,
            }}
            transition={{ duration: 0.3 }}
          />
          
          {/* Main pack image */}
          <div className="relative w-72 sm:w-96">
            <img
              src={packImage}
              alt="Mystery Pack"
              className="w-full h-auto object-contain drop-shadow-2xl"
              draggable={false}
            />
            
            {/* Hover spotlight effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-radial from-white/10 via-transparent to-transparent rounded-lg"
              animate={{
                opacity: isHovering ? 1 : 0,
              }}
              transition={{ duration: 0.3 }}
              style={{ backgroundPosition: 'center 30%', backgroundSize: '150% 150%' }}
            />
            
            {/* Enhanced tear effect when unsealing */}
            <AnimatePresence>
              {isUnsealing && (
                <>
                  {/* Dramatic light burst from tear */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute top-[5%] left-0 right-0 h-24 bg-gradient-to-b from-amber-400/40 via-amber-300/20 to-transparent blur-md z-5"
                    transition={{ duration: 0.4 }}
                  />
                  
                  {/* Top tear line - glowing */}
                  <motion.div
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: 1 }}
                    className="absolute top-[8%] left-[10%] right-[10%] h-1.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent origin-left z-20"
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                  />
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    className="absolute top-[8%] left-[10%] right-[10%] h-4 bg-gradient-to-r from-transparent via-amber-400/50 to-transparent origin-left blur-sm z-19"
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                  />
                  
                  {/* Tear opening with better gradient */}
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: '60%', opacity: 1 }}
                    className="absolute top-[8%] left-[12%] right-[12%] bg-gradient-to-b from-violet-500/40 via-purple-600/25 via-amber-500/10 to-transparent z-10 rounded-b-xl"
                    style={{ originY: 0 }}
                    transition={{ delay: 0.25, duration: 0.6, ease: 'easeOut' }}
                  />
                  
                  {/* Enhanced light rays emerging - more dramatic */}
                  {[...Array(7)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scaleY: 0, height: 0 }}
                      animate={{ 
                        opacity: [0, 0.8, 0.5], 
                        scaleY: 1, 
                        height: `${100 + Math.random() * 80}px` 
                      }}
                      className="absolute top-[8%] bg-gradient-to-b from-amber-400/90 via-amber-300/40 to-transparent z-15"
                      style={{ 
                        left: `${20 + i * 9}%`,
                        width: `${2 + Math.random() * 2}px`,
                        rotate: `${(i - 3) * 4}deg`,
                        transformOrigin: 'top center',
                      }}
                      transition={{ delay: 0.3 + i * 0.04, duration: 0.5 }}
                    />
                  ))}

                  {/* Sparkle particles from tear */}
                  {[...Array(10)].map((_, i) => (
                    <motion.div
                      key={`sparkle-${i}`}
                      initial={{ opacity: 0, scale: 0, y: 0 }}
                      animate={{ 
                        opacity: [0, 1, 0],
                        scale: [0, 1, 0.5],
                        y: [0, -40 - Math.random() * 60],
                        x: [(Math.random() - 0.5) * 20, (Math.random() - 0.5) * 60],
                      }}
                      className="absolute top-[10%] w-1 h-1 rounded-full bg-amber-300"
                      style={{ left: `${25 + i * 5}%` }}
                      transition={{ delay: 0.4 + i * 0.03, duration: 0.8 }}
                    />
                  ))}
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Suspense meter at bottom - only when unsealing */}
          {isUnsealing && (
            <div className="absolute -bottom-12 left-0 right-0 px-4">
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-violet-400 via-purple-500 to-amber-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${suspenseProgress * 100}%` }}
                  transition={{ duration: 0.05 }}
                />
              </div>
              <p className="text-white/40 text-[10px] text-center mt-2 tracking-widest uppercase">
                Opening...
              </p>
            </div>
          )}
        </div>
      </motion.button>

      {/* Tap to unseal text and animated loading bar - visible when NOT unsealing */}
      {!isUnsealing && (
        <div className="mt-6 flex flex-col items-center w-72 sm:w-96">
          <p className="text-white/50 text-sm tracking-wide mb-3">
            Tap to unseal
          </p>
          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-400 via-violet-500 to-purple-500"
              initial={{ width: '0%' }}
              animate={{ width: ['0%', '100%'] }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
