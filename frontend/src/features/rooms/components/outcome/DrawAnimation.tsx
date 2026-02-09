/**
 * @fileoverview Dramatic winner selection animation
 */

import { memo, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers } from 'lucide-react';

interface DrawAnimationProps {
  participants: Array<{
    user_id: string;
    username?: string;
    display_name?: string;
    entries: number;
  }>;
  totalEntries: number;
  winningEntry: number;
  winnerUserId: string;
  onComplete: () => void;
}

export const DrawAnimation = memo(function DrawAnimation({
  participants,
  totalEntries,
  winningEntry,
  winnerUserId,
  onComplete,
}: DrawAnimationProps) {
  const [phase, setPhase] = useState<'countdown' | 'spinning' | 'slowing' | 'winner'>('countdown');
  const [countdown, setCountdown] = useState(3);
  const [currentEntry, setCurrentEntry] = useState(1);
  const [spinSpeed, setSpinSpeed] = useState(50);

  // Countdown phase
  useEffect(() => {
    if (phase !== 'countdown') return;
    
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setPhase('spinning');
    }
  }, [phase, countdown]);

  // Spinning phase - rapid random entries
  useEffect(() => {
    if (phase !== 'spinning') return;

    const interval = setInterval(() => {
      setCurrentEntry(Math.floor(Math.random() * totalEntries) + 1);
    }, spinSpeed);

    // After 3 seconds, start slowing
    const slowTimer = setTimeout(() => {
      setPhase('slowing');
    }, 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(slowTimer);
    };
  }, [phase, spinSpeed, totalEntries]);

  // Slowing phase - gradually approach winning entry
  useEffect(() => {
    if (phase !== 'slowing') return;

    let speed = spinSpeed;
    let entryRange = totalEntries;
    
    const slowDown = () => {
      speed += 30; // Slow down
      entryRange = Math.max(10, entryRange * 0.8); // Narrow range
      
      // Generate entry closer to winner
      const offset = Math.floor((Math.random() - 0.5) * entryRange);
      const nearEntry = Math.max(1, Math.min(totalEntries, winningEntry + offset));
      setCurrentEntry(nearEntry);
      setSpinSpeed(speed);

      if (speed < 500) {
        setTimeout(slowDown, speed);
      } else {
        // Final reveal
        setCurrentEntry(winningEntry);
        setTimeout(() => setPhase('winner'), 500);
      }
    };

    slowDown();
  }, [phase, spinSpeed, totalEntries, winningEntry]);

  // Winner phase - trigger completion after delay
  useEffect(() => {
    if (phase !== 'winner') return;
    const timer = setTimeout(onComplete, 2000);
    return () => clearTimeout(timer);
  }, [phase, onComplete]);

  const winner = participants.find(p => p.user_id === winnerUserId);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
    >
      {/* Background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-gradient-to-r from-cyan-400 to-violet-500"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              opacity: 0.3,
            }}
            animate={{
              y: [null, Math.random() * -200],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        ))}
      </div>

      <div className="relative z-10 text-center">
        {/* Countdown */}
        <AnimatePresence mode="wait">
          {phase === 'countdown' && (
            <motion.div
              key="countdown"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              className="text-center"
            >
              <p className="text-white/60 text-lg mb-4">Drawing winner in...</p>
              <motion.span
                key={countdown}
                initial={{ scale: 2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-violet-500 to-purple-500"
              >
                {countdown}
              </motion.span>
            </motion.div>
          )}

          {/* Spinning cards */}
          {(phase === 'spinning' || phase === 'slowing') && (
            <motion.div
              key="spinning"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <p className="text-white/60 text-lg mb-6">Selecting winning card...</p>
              
              {/* Card display */}
              <motion.div
                className="relative"
                animate={{
                  rotateY: phase === 'spinning' ? [0, 360] : 0,
                }}
                transition={{
                  duration: phase === 'spinning' ? 0.5 : 0,
                  repeat: phase === 'spinning' ? Infinity : 0,
                  ease: 'linear',
                }}
              >
                <div className="w-64 h-40 mx-auto rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border-2 border-cyan-400/50 flex flex-col items-center justify-center backdrop-blur-sm">
                  <Layers className="w-8 h-8 text-cyan-400 mb-2" />
                  <motion.span
                    key={currentEntry}
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-5xl font-bold text-white font-mono"
                  >
                    #{currentEntry.toString().padStart(4, '0')}
                  </motion.span>
                  <span className="text-white/40 text-sm mt-2">of {totalEntries.toLocaleString()}</span>
                </div>
              </motion.div>

              {/* Progress bar */}
              <div className="mt-8 w-64 mx-auto">
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-cyan-400 to-violet-500"
                    animate={{ width: phase === 'slowing' ? '100%' : '60%' }}
                    transition={{ duration: phase === 'slowing' ? 3 : 0 }}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Winner reveal */}
          {phase === 'winner' && (
            <motion.div
              key="winner"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', bounce: 0.5 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="text-8xl mb-6"
              >
                🎉
              </motion.div>
              
              <p className="text-white/60 text-lg mb-2">Winning Card</p>
              <motion.div
                initial={{ y: 20 }}
                animate={{ y: 0 }}
                className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 mb-6"
              >
                #{winningEntry.toString().padStart(4, '0')}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <p className="text-white/40 text-sm mb-2">Winner</p>
                <p className="text-2xl font-semibold text-white">
                  {winner?.display_name || winner?.username || 'Anonymous'}
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});
