/**
 * @fileoverview Alot! Landing Card Component
 * @description Animated mystery card with sticker aesthetic and hype pack colors
 */

import { memo, useRef, useCallback } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import alotLogo from '@/assets/alot-logo.png';

export const LandingCard = memo(() => {
  const cardRef = useRef<HTMLDivElement>(null);
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  // Parallax with depth
  const rotateX = useSpring(useTransform(mouseY, [-200, 200], [15, -15]), { stiffness: 200, damping: 25 });
  const rotateY = useSpring(useTransform(mouseX, [-200, 200], [-15, 15]), { stiffness: 200, damping: 25 });
  
  const shineX = useTransform(mouseX, [-200, 200], ['0%', '100%']);
  const shineY = useTransform(mouseY, [-200, 200], ['0%', '100%']);
  
  const glowIntensity = useTransform(mouseX, [-200, 200], [0.3, 0.8]);

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

  return (
    <motion.div
      ref={cardRef}
      initial={{ y: 50, opacity: 0, scale: 0.9 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      transition={{ 
        type: 'spring', 
        duration: 1.5,
        bounce: 0.2,
        delay: 0.3,
      }}
      style={{ 
        perspective: 1200,
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative z-10 group"
    >
      {/* Multi-layer glow effect - Hype Pack colors */}
      <motion.div
        className="absolute -inset-6 rounded-3xl bg-gradient-to-br from-primary/40 via-accent-blue/40 to-primary/40 blur-2xl"
        style={{ opacity: glowIntensity }}
      />
      <motion.div
        className="absolute -inset-3 rounded-2xl bg-gradient-to-br from-primary/30 via-accent-blue/30 to-primary/30 blur-xl opacity-50 group-hover:opacity-90 transition-opacity duration-300"
      />

      {/* Main card - Sticker aesthetic with thick white border */}
      <div className="relative w-56 sm:w-64 md:w-56 lg:w-60 aspect-[3/4.5]">
        <div className="absolute inset-0 bg-card rounded-2xl overflow-hidden border-4 border-white shadow-sticker">
          {/* Gradient accent - Hype Pack colors */}
          <div className="absolute bottom-0 right-0 w-3/4 h-1/2 bg-gradient-to-tl from-primary/70 via-accent-blue/50 to-primary/80 blur-2xl opacity-60" />
          <div className="absolute bottom-0 right-0 w-1/2 h-1/3 bg-gradient-to-tl from-primary/70 via-accent-blue/50 to-primary/80 blur-xl opacity-80" />
          
          {/* Noise texture */}
          <div 
            className="absolute inset-0 opacity-[0.03]" 
            style={{ 
              backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' 
            }} 
          />

          {/* Card Header - Alot! Logo */}
          <div className="absolute top-5 left-5 z-10">
            <img 
              src={alotLogo} 
              alt="Alot!" 
              className="h-10 sm:h-12 object-contain"
              draggable={false} 
            />
          </div>

          {/* Enhanced holographic shine effect */}
          <motion.div
            className="absolute inset-0 opacity-40"
            style={{
              background: `radial-gradient(circle at ${shineX} ${shineY}, rgba(255,255,255,0.5) 0%, transparent 40%)`,
            }}
          />
          {/* Rainbow holographic sweep - Hype Pack colors */}
          <motion.div
            className="absolute inset-0 opacity-20"
            style={{
              background: `linear-gradient(
                135deg,
                transparent 20%,
                hsl(330 95% 60% / 0.3) 30%,
                hsl(195 100% 50% / 0.3) 40%,
                hsl(80 100% 50% / 0.3) 50%,
                hsl(195 100% 50% / 0.3) 60%,
                transparent 80%
              )`,
              backgroundSize: '200% 200%',
            }}
            animate={{
              backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          />
          {/* Moving shine streak */}
          <motion.div
            className="absolute inset-0 opacity-30"
            style={{
              background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.4) 50%, transparent 60%)',
              backgroundSize: '200% 100%',
            }}
            animate={{
              backgroundPosition: ['-100% 0%', '200% 0%'],
            }}
            transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1 }}
          />

          {/* Center mystery icon with glow */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-white/30 flex items-center justify-center backdrop-blur-sm"
              animate={{
                boxShadow: [
                  '0 0 30px hsl(330 95% 60% / 0.4)',
                  '0 0 50px hsl(330 95% 60% / 0.6)',
                  '0 0 30px hsl(330 95% 60% / 0.4)',
                ],
                borderColor: ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.4)', 'rgba(255,255,255,0.2)'],
              }}
              transition={{ duration: 2.5, repeat: Infinity }}
            >
              <motion.span 
                className="font-display text-4xl sm:text-5xl text-white/80"
                animate={{
                  textShadow: [
                    '0 0 10px rgba(255,255,255,0.3)',
                    '0 0 25px rgba(255,255,255,0.6)',
                    '0 0 10px rgba(255,255,255,0.3)',
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                ?
              </motion.span>
            </motion.div>
          </div>

          {/* Footer text - Chunky style */}
          <div className="absolute bottom-5 left-5 right-5 z-10">
            <p className="text-primary/60 text-[10px] tracking-[0.2em] uppercase font-bold mb-1">
              LOT #
            </p>
            <motion.div 
              className="h-4 w-32 sm:w-40 bg-white/10 rounded mb-4"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <p className="text-accent-blue/60 text-[10px] tracking-[0.2em] uppercase font-bold mb-1">
              Win Date
            </p>
            <motion.div 
              className="h-3 w-16 bg-white/10 rounded"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            />
          </div>

          {/* Premium shine effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5 pointer-events-none rounded-2xl" />
        </div>
      </div>
    </motion.div>
  );
});

LandingCard.displayName = 'LandingCard';
