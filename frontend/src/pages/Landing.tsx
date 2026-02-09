/**
 * @fileoverview Alot! Landing Page
 * @description "Digital Vandalism" aesthetic - loud, tactile, gamified
 * Theme: Hype-beast drop site x retro arcade x street market
 */

import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { LandingCard, BrandCarousel } from '@/components/landing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import alotLogo from '@/assets/alot-logo.png';

export default function Landing() {
  const { isAuthenticated, loading, sendMagicLink } = useAuth();
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Redirect authenticated users to collect room
  if (!loading && isAuthenticated) {
    return <Navigate to="/collect-room" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSending(true);
    try {
      await sendMagicLink(email, '/collect-room');
      setEmailSent(true);
      toast.success('Check your email for the magic link!');
    } catch (error) {
      toast.error('Failed to send magic link. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      {/* Dark asphalt background */}
      <div className="fixed inset-0 -z-20 gradient-bg" />
      
      {/* Subtle noise texture */}
      <div 
        className="fixed inset-0 -z-10 opacity-[0.03]" 
        style={{ 
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' 
        }} 
      />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center px-6 py-8 md:py-6">
        {/* Alot! Logo - Sticker style with slight tilt */}
        <motion.div
          initial={{ opacity: 0, y: -20, rotate: -5 }}
          animate={{ opacity: 1, y: 0, rotate: -3 }}
          transition={{ duration: 0.6, type: 'spring' }}
          className="mt-4 md:mt-2 mb-auto"
        >
          <img 
            src={alotLogo} 
            alt="Alot!" 
            className="h-36 sm:h-48 md:h-56 w-auto object-contain drop-shadow-2xl"
            draggable={false}
          />
        </motion.div>

        {/* Spacer to push content to center */}
        <div className="flex-1 flex flex-col items-center justify-center w-full">

          {/* Card Animation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, rotate: 2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-8 md:mb-6"
          >
            <LandingCard />
          </motion.div>

          {/* Tagline - Chunky, bold, sticker style */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center mb-8 md:mb-6"
          >
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl gradient-hype-text mb-3 tilt-right-sm">
              Fund Lots. Win big.
            </h2>
            <p className="text-foreground/80 text-sm sm:text-base font-semibold max-w-sm mx-auto">
              Every lot you fund = a chance to win the real thing.
            </p>
          </motion.div>

          {/* Login Form - Sticker button style */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="w-full max-w-sm md:max-w-xs lg:max-w-sm"
          >
            {emailSent ? (
              <div className="text-center">
                <div className="sticker-card bg-card p-6">
                  <p className="text-foreground font-bold mb-2">Magic link sent!</p>
                  <p className="text-muted-foreground text-sm">Check your email to sign in.</p>
                  <Button
                    variant="ghost"
                    onClick={() => setEmailSent(false)}
                    className="mt-4 text-muted-foreground hover:text-foreground"
                  >
                    Use a different email
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-card border-2 border-border text-foreground placeholder:text-muted-foreground h-14 rounded-xl focus:border-primary focus:ring-primary/30 text-center font-medium"
                  required
                />
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    type="submit"
                    disabled={isSending || !email.trim()}
                    className="w-full h-14 sticker-btn gradient-hype text-lg tracking-wide disabled:opacity-50"
                  >
                    {isSending ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      "LET'S GO!"
                    )}
                  </Button>
                </motion.div>
              </form>
            )}
          </motion.div>

          {/* Subtle hint */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="text-muted-foreground text-xs mt-6 md:mt-4 text-center"
          >
            We'll send you a magic link to sign in instantly
          </motion.p>
        </div>

        {/* Brand Carousel */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="w-full mt-auto md:mt-2"
        >
          <BrandCarousel />
        </motion.div>
      </div>
    </div>
  );
}
