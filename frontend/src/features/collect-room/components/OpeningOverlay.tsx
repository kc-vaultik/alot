// Opening Overlay Component
// Displays loading state while waiting for cards after Stripe checkout

import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface OpeningOverlayProps {
  isOpening: boolean;
}

export function OpeningOverlay({ isOpening }: OpeningOverlayProps) {
  return (
    <AnimatePresence>
      {isOpening && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950/95 backdrop-blur-sm"
        >
          <Loader2 className="w-12 h-12 text-violet-400 animate-spin mb-4" />
          <p className="text-white text-lg font-light">Opening your cards...</p>
          <p className="text-white/40 text-sm mt-2 font-light">
            Please wait while we prepare your reveals
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
