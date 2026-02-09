/**
 * @fileoverview Gift/Swap Modal (Orchestrator)
 * Main modal shell that composes step components
 */

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift, ArrowLeftRight } from 'lucide-react';
import type { CollectCard } from '@/features/collect-room/types';
import { CardPreviewSection } from './CardPreviewSection';
import { ConfirmStep, GeneratingStep, SuccessStep, ErrorStep } from './steps';
import { useGiftSwapState } from './useGiftSwapState';

interface GiftSwapModalProps {
  card: CollectCard;
  mode: 'gift' | 'swap';
  onClose: () => void;
  onConfirm: (mode: 'gift' | 'swap') => void;
  preselectedCollector?: { user_id: string; username: string; display_name?: string | null };
}

export const GiftSwapModal = memo(({ 
  card, 
  mode, 
  onClose, 
  onConfirm, 
  preselectedCollector 
}: GiftSwapModalProps) => {
  const {
    step,
    copied,
    shareableLink,
    timeRemaining,
    errorMessage,
    selectedCollector,
    isLoading,
    setSelectedCollector,
    handleCreateTransfer,
    handleCancelTransfer,
    handleCopyLink,
    handleShare,
    handleConfirmAndClose,
    handleRetry,
  } = useGiftSwapState({
    card,
    mode,
    preselectedCollector,
    onConfirm,
    onClose,
  });

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative max-w-md w-full bg-zinc-900 rounded-2xl border border-white/10 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`p-6 ${mode === 'gift' ? 'bg-gradient-to-r from-pink-500/20 to-rose-500/10' : 'bg-gradient-to-r from-blue-500/20 to-cyan-500/10'} border-b border-white/10`}>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-white/60 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3">
              {mode === 'gift' ? (
                <div className="w-12 h-12 rounded-full bg-pink-500/20 flex items-center justify-center">
                  <Gift className="w-6 h-6 text-pink-400" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <ArrowLeftRight className="w-6 h-6 text-blue-400" />
                </div>
              )}
              <div>
                <h2 className={`text-xl font-bold ${mode === 'gift' ? 'text-pink-400' : 'text-blue-400'}`}>
                  {mode === 'gift' ? 'Gift This Card' : 'Swap This Card'}
                </h2>
                <p className="text-white/60 text-sm">
                  {mode === 'gift' ? 'Send this card to a friend' : 'Trade cards with a friend'}
                </p>
              </div>
            </div>
          </div>

          {/* Card Preview */}
          <CardPreviewSection card={card} />

          {/* Content based on step */}
          <div className="p-6 space-y-4">
            {step === 'confirm' && (
              <ConfirmStep
                mode={mode}
                selectedCollector={selectedCollector}
                isLoading={isLoading}
                onSelectCollector={setSelectedCollector}
                onCreateTransfer={handleCreateTransfer}
              />
            )}

            {step === 'generating' && (
              <GeneratingStep mode={mode} />
            )}

            {step === 'error' && (
              <ErrorStep
                errorMessage={errorMessage}
                onRetry={handleRetry}
              />
            )}

            {step === 'success' && (
              <SuccessStep
                mode={mode}
                shareableLink={shareableLink}
                timeRemaining={timeRemaining}
                copied={copied}
                isLoading={isLoading}
                onCopyLink={handleCopyLink}
                onShare={handleShare}
                onCancelTransfer={handleCancelTransfer}
                onConfirmAndClose={handleConfirmAndClose}
              />
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
});

GiftSwapModal.displayName = 'GiftSwapModal';
