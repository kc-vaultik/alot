/**
 * @fileoverview Shared Card Emerge Animation
 * 
 * A reusable card emergence animation that works for:
 * - Mystery pack reveals (collect room)
 * - Room entry ticket reveals
 * - Any future card-based reveal flows
 * 
 * The component shows a face-down card sliding up with premium effects,
 * prompting the user to tap to reveal.
 */

import { memo, useState, useRef, useEffect, useCallback } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import alotLogo from '@/assets/alot-logo.png';

export interface CardEmergeProps {
  /** Handler called when user taps to reveal */
  onReveal: () => void;
  /** Primary gradient colors for the card glow (Tailwind classes) */
  gradientColors?: string;
  /** Border glow effect (Tailwind classes) */
  borderGlow?: string;
  /** Glow color for the center icon (CSS color) */
  glowColor?: string;
  /** Ambient background gradient (Tailwind classes) */
  ambientBg?: string;
  /** Center icon - defaults to "?" */
  centerIcon?: React.ReactNode;
  /** Top-right badge content */
  badge?: React.ReactNode;
  /** Title shown below the card */
  title?: string;
  /** Subtitle shown below the title */
  subtitle?: string;
  /** Hint text shown at the bottom */
  hint?: string;
  /** Optional product image to show blurred as a preview */
  productImageUrl?: string | null;
}

export const CardEmergeAnimation = memo(function CardEmergeAnimation({
  onReveal,
  gradientColors = 'from-violet-500 to-purple-600',
  borderGlow = 'from-violet-500 via-purple-500 to-violet-500',
  glowColor = 'rgba(139, 92, 246, 0.5)',
  ambientBg = 'bg-gradient-to-br from-violet-500/30 to-purple-600/30',
  centerIcon,
  badge,
  title = 'Your card is emerging...',
  subtitle = 'Tap to reveal',
  hint,
  productImageUrl,
}: CardEmergeProps) {
  const [hasSlid, setHasSlid] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  // 3D parallax effect
  const rotateX = useSpring(useTransform(mouseY, [-200, 200], [15, -15]), { stiffness: 200, damping: 25 });
  const rotateY = useSpring(useTransform(mouseX, [-200, 200], [-15, 15]), { stiffness: 200, damping: 25 });
  const shineX = useTransform(mouseX, [-200, 200], ['0%', '100%']);
  const shineY = useTransform(mouseY, [-200, 200], ['0%', '100%']);
  const glowIntensity = useTransform(mouseX, [-200, 200], [0.3, 0.8]);

  useEffect(() => {
    const timer = setTimeout(() => setHasSlid(true), 1200);
    return () => clearTimeout(timer);
  }, []);

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

  const handleClick = () => {
    if (hasSlid) {
      onReveal();
    }
  };

  const defaultCenterIcon = (
    <motion.span 
      className="text-5xl font-serif text-white/70"
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
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-start min-h-screen px-4 sm:px-6 pt-24 pb-12 overflow-x-hidden"
    >
      {/* Ambient background glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          className={`w-[600px] h-[600px] rounded-full blur-3xl ${ambientBg}`}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Card container */}
      <motion.div
        ref={cardRef}
        initial={{ y: 400, opacity: 0, rotateX: 60, scale: 0.8 }}
        animate={{ y: 0, opacity: 1, rotateX: 0, scale: 1 }}
        transition={{ 
          type: 'spring', 
          duration: 1.8,
          bounce: 0.15,
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
        onClick={handleClick}
        className={`relative z-10 ${hasSlid ? 'cursor-pointer' : ''} group`}
      >
        {/* Multi-layer glow effect */}
        <motion.div
          className={`absolute -inset-6 rounded-3xl bg-gradient-to-br ${borderGlow} blur-2xl`}
          style={{ opacity: glowIntensity }}
        />
        <motion.div
          className={`absolute -inset-3 rounded-2xl bg-gradient-to-br ${borderGlow} blur-xl opacity-50 group-hover:opacity-90 transition-opacity duration-300`}
        />

        {/* Main card face-down */}
        <div className="relative w-72 sm:w-80 aspect-[3/4.5]">
          <div className="absolute inset-0 bg-[#0a0a0f] rounded-2xl overflow-hidden border-4 border-white shadow-sticker">
            {/* Gradient accent */}
            <div className={`absolute bottom-0 right-0 w-3/4 h-1/2 bg-gradient-to-tl ${gradientColors} blur-2xl opacity-60`} />
            <div className={`absolute bottom-0 right-0 w-1/2 h-1/3 bg-gradient-to-tl ${gradientColors} blur-xl opacity-80`} />
            
            {/* Noise texture */}
            <div 
              className="absolute inset-0 opacity-[0.03]" 
              style={{ 
                backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' 
              }} 
            />

            {/* Card Header - Logo */}
            <div className="absolute top-6 left-6 z-10">
              <img 
                src={alotLogo} 
                alt="Alot!" 
                className="h-12 object-contain"
                draggable={false} 
              />
            </div>

            {/* Top-right badge */}
            {badge && (
              <div className="absolute top-6 right-6 z-10">
                {badge}
              </div>
            )}

            {/* Holographic shine effect */}
            <motion.div
              className="absolute inset-0 opacity-40"
              style={{
                background: `radial-gradient(circle at ${shineX} ${shineY}, rgba(255,255,255,0.5) 0%, transparent 40%)`,
              }}
            />
            {/* Rainbow holographic sweep */}
            <motion.div
              className="absolute inset-0 opacity-20"
              style={{
                background: `linear-gradient(
                  135deg,
                  transparent 20%,
                  rgba(255,0,100,0.3) 30%,
                  rgba(255,200,0,0.3) 40%,
                  rgba(0,255,200,0.3) 50%,
                  rgba(100,0,255,0.3) 60%,
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

            {/* Center content */}
            <div className="absolute inset-0 flex items-center justify-center">
              {productImageUrl ? (
                // Show blurred product preview
                <motion.div
                  className="w-32 h-32 rounded-2xl overflow-hidden border border-white/10 bg-white/5"
                  animate={{
                    boxShadow: [
                      '0 0 20px rgba(255,255,255,0.1)',
                      '0 0 40px rgba(255,255,255,0.2)',
                      '0 0 20px rgba(255,255,255,0.1)',
                    ],
                  }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                >
                  <img 
                    src={productImageUrl} 
                    alt="" 
                    className="w-full h-full object-contain filter blur-sm opacity-60"
                  />
                </motion.div>
              ) : (
                // Default mystery icon
                <motion.div
                  className="w-28 h-28 rounded-full border border-white/20 flex items-center justify-center backdrop-blur-sm"
                  animate={{
                    boxShadow: [
                      `0 0 30px ${glowColor}`,
                      `0 0 50px ${glowColor}`,
                      `0 0 30px ${glowColor}`,
                    ],
                    borderColor: ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)'],
                  }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                >
                  {centerIcon || defaultCenterIcon}
                </motion.div>
              )}
            </div>

            {/* Footer placeholders */}
            <div className="absolute bottom-8 left-8 right-8 z-10">
              <p className="text-amber-200/40 text-xs tracking-[0.2em] uppercase mb-2">
                Unique Digital Number
              </p>
              <motion.div 
                className="h-6 w-48 bg-white/5 rounded mb-6"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <p className="text-amber-200/40 text-xs tracking-[0.2em] uppercase mb-2">
                Expire Date
              </p>
              <motion.div 
                className="h-5 w-16 bg-white/5 rounded"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              />
            </div>

            {/* Premium shine overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5 pointer-events-none rounded-2xl" />
          </div>
        </div>
      </motion.div>

      {/* Instructions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: hasSlid ? 1 : 0, y: hasSlid ? 0 : 20 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className="mt-10 text-center relative z-10"
      >
        <motion.p 
          className="text-white/40 text-sm mb-3"
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          {title}
        </motion.p>
        <p className="text-white/70 text-lg tracking-wide mb-2">
          {subtitle}
        </p>
        {hint && (
          <p className="text-white/30 text-xs">
            {hint}
          </p>
        )}
      </motion.div>
    </motion.div>
  );
});
