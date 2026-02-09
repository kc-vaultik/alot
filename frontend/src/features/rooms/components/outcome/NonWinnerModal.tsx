/**
 * @fileoverview Non-winner modal - "Digital Vandalism" Style
 * @description NOT THIS TIME. with sticker aesthetic
 */

import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RefreshCw, Coins, ArrowRight, Check, AlertCircle, Ticket } from 'lucide-react';
import { REFUND_CREDIT_MULTIPLIER } from '../../constants';
import { formatCents } from '../../utils';

interface NonWinnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  amountSpentCents: number;
  onRequestRefund: () => Promise<void>;
  onConvertToCredits: () => Promise<void>;
  productName?: string;
  isExpired?: boolean;
}

export const NonWinnerModal = memo(function NonWinnerModal({
  isOpen,
  onClose,
  amountSpentCents,
  onRequestRefund,
  onConvertToCredits,
  productName,
  isExpired = false,
}: NonWinnerModalProps) {
  const [selectedOption, setSelectedOption] = useState<'refund' | 'credits' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);

  const creditsAmount = Math.floor(amountSpentCents * REFUND_CREDIT_MULTIPLIER);

  const handleConfirm = async () => {
    if (!selectedOption) return;
    
    setIsProcessing(true);
    try {
      if (selectedOption === 'refund') {
        await onRequestRefund();
      } else {
        await onConvertToCredits();
      }
      setCompleted(true);
    } catch (error) {
      console.error('Error processing choice:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/90 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20, rotate: -2 }}
            animate={{ scale: 1, opacity: 1, y: 0, rotate: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-card rounded-2xl border-4 border-white overflow-hidden shadow-sticker"
            onClick={e => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors z-10"
            >
              <X className="w-4 h-4 text-muted-foreground" strokeWidth={2.5} />
            </button>

            {/* Completed state */}
            {completed ? (
              <div className="p-8 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-hype-green/20 flex items-center justify-center border-4 border-white shadow-sticker"
                >
                  <Check className="w-10 h-10 text-hype-green" strokeWidth={3} />
                </motion.div>
                <h2 className="font-display text-2xl text-foreground mb-2">
                  {selectedOption === 'refund' ? 'REFUND INCOMING' : 'CREDITS ADDED!'}
                </h2>
                <p className="text-muted-foreground mb-6">
                  {selectedOption === 'refund'
                    ? 'Your refund is being processed. It may take 5-10 business days.'
                    : `${formatCents(creditsAmount)} in credits have been added to your stash.`}
                </p>
                <button
                  onClick={onClose}
                  className="w-full py-3 rounded-xl bg-secondary text-foreground font-bold uppercase border-2 border-border hover:bg-secondary/80 transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="px-6 pt-6 pb-4">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-hype-pink/20 to-hype-blue/20 flex items-center justify-center border-4 border-white shadow-sticker transform -rotate-3">
                    <AlertCircle className="w-8 h-8 text-hype-pink" strokeWidth={2.5} />
                  </div>
                  <h2 className="font-display text-3xl text-foreground text-center mb-2 transform rotate-1">
                    {isExpired ? 'LOT CLOSED' : 'NOT THIS TIME.'}
                  </h2>
                  <p className="text-muted-foreground text-center text-sm font-medium">
                    {isExpired
                      ? "This lot didn't hit its target."
                      : `You didn't win ${productName || 'this lot'}, but you have options:`}
                  </p>
                </div>

                {/* Your entry summary - Sticker style */}
                <div className="mx-6 p-4 rounded-xl bg-secondary border-4 border-white shadow-sticker mb-4 transform rotate-[0.5deg]">
                  <div className="flex items-center gap-3">
                    <Ticket className="w-5 h-5 text-hype-blue" strokeWidth={2.5} />
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wider font-bold">Your Entry</p>
                      <p className="text-foreground text-2xl font-display">{formatCents(amountSpentCents)}</p>
                    </div>
                  </div>
                </div>

                {/* Options */}
                <div className="px-6 space-y-3">
                  {/* Refund option */}
                  <button
                    onClick={() => setSelectedOption('refund')}
                    className={`w-full p-4 rounded-xl border-4 transition-all text-left ${
                      selectedOption === 'refund'
                        ? 'border-hype-blue bg-hype-blue/10 shadow-sticker'
                        : 'border-border hover:border-border/80 bg-secondary/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-xl ${
                        selectedOption === 'refund' ? 'bg-hype-blue/20' : 'bg-secondary'
                      }`}>
                        <RefreshCw className={`w-5 h-5 ${
                          selectedOption === 'refund' ? 'text-hype-blue' : 'text-muted-foreground'
                        }`} strokeWidth={2.5} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-foreground uppercase text-sm">Get Refund</span>
                          <span className="text-muted-foreground font-display">{formatCents(amountSpentCents)}</span>
                        </div>
                        <p className="text-muted-foreground text-sm">
                          Full refund to original payment (5-10 days)
                        </p>
                      </div>
                      {selectedOption === 'refund' && (
                        <div className="w-6 h-6 rounded-lg bg-hype-blue flex items-center justify-center border-2 border-white">
                          <Check className="w-4 h-4 text-white" strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  </button>

                  {/* Credits option - highlighted as better value */}
                  <button
                    onClick={() => setSelectedOption('credits')}
                    className={`w-full p-4 rounded-xl border-4 transition-all text-left relative overflow-hidden ${
                      selectedOption === 'credits'
                        ? 'border-hype-green bg-hype-green/10 shadow-sticker'
                        : 'border-border hover:border-border/80 bg-secondary/50'
                    }`}
                  >
                    {/* Best value badge - Sticker style */}
                    <div className="absolute top-0 right-0 px-3 py-1 bg-hype-green text-black text-[10px] font-bold uppercase tracking-wide rounded-bl-xl border-l-4 border-b-4 border-white">
                      Best Value
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-xl ${
                        selectedOption === 'credits' ? 'bg-hype-green/20' : 'bg-secondary'
                      }`}>
                        <Coins className={`w-5 h-5 ${
                          selectedOption === 'credits' ? 'text-hype-green' : 'text-muted-foreground'
                        }`} strokeWidth={2.5} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-foreground uppercase text-sm">Get Credits</span>
                          <span className="text-hype-green font-display">{formatCents(creditsAmount)}</span>
                        </div>
                        <p className="text-muted-foreground text-sm">
                          {REFUND_CREDIT_MULTIPLIER}× your entry as credits - instant, use in any lot
                        </p>
                        <div className="mt-2 flex items-center gap-1 text-hype-green text-xs font-bold">
                          <ArrowRight className="w-3 h-3" strokeWidth={3} />
                          <span>+{formatCents(creditsAmount - amountSpentCents)} bonus!</span>
                        </div>
                      </div>
                      {selectedOption === 'credits' && (
                        <div className="w-6 h-6 rounded-lg bg-hype-green flex items-center justify-center border-2 border-white">
                          <Check className="w-4 h-4 text-black" strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  </button>
                </div>

                {/* Confirm button */}
                <div className="p-6 pt-4">
                  <button
                    onClick={handleConfirm}
                    disabled={!selectedOption || isProcessing}
                    className={`w-full py-4 rounded-xl font-bold text-lg uppercase tracking-wide transition-all border-4 ${
                      selectedOption
                        ? selectedOption === 'credits'
                          ? 'bg-gradient-to-r from-hype-green to-emerald-400 text-black border-white shadow-sticker hover:scale-105'
                          : 'bg-gradient-to-r from-hype-blue to-cyan-400 text-white border-white shadow-sticker hover:scale-105'
                        : 'bg-secondary text-muted-foreground border-border cursor-not-allowed'
                    }`}
                  >
                    {isProcessing ? 'Processing...' : selectedOption ? 'Confirm' : 'Pick One'}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
