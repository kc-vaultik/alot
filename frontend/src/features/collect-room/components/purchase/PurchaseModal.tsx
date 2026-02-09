import { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Zap, Crown } from 'lucide-react';
import { useCheckout } from '@/features/collect-room/hooks';
import { useAuth } from '@/contexts/AuthContext';

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const tiers = [
  { 
    id: 'T5' as const, 
    price: 5, 
    name: '$5', 
    icon: Sparkles, 
    description: 'Standard Pack',
    details: 'Base odds for all collectibles. Earn credits toward any item in your collection.',
    creditsRange: '50-150'
  },
  { 
    id: 'T10' as const, 
    price: 10, 
    name: '$10', 
    icon: Zap, 
    description: 'Premium Pack',
    details: '2× rare odds. Higher credit rewards accelerate your progress.',
    creditsRange: '120-350'
  },
  { 
    id: 'T20' as const, 
    price: 20, 
    name: '$20', 
    icon: Crown, 
    description: 'Elite Pack',
    details: '5× rare odds. Maximum credits per card. Best path to redemption.',
    creditsRange: '280-800'
  },
];

const quantities = [1, 3, 5, 10];

export const PurchaseModal = memo(({ isOpen, onClose }: PurchaseModalProps) => {
  const [selectedTier, setSelectedTier] = useState<'T5' | 'T10' | 'T20'>('T5');
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const { createCheckout, isLoading } = useCheckout();
  const { user } = useAuth();

  const selectedTierData = tiers.find(t => t.id === selectedTier)!;
  const totalPrice = selectedTierData.price * selectedQuantity;

  const handlePurchase = async () => {
    if (!user) {
      window.location.href = '/auth?returnTo=/collect-room';
      return;
    }
    await createCheckout(selectedTier, selectedQuantity);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-lg bg-zinc-950 rounded-2xl border border-white/10 overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative px-6 pt-6 pb-4">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4 text-white/40" />
              </button>
              <h2 className="text-2xl">
                <span className="font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-500">Buy</span>
                {' '}
                <span className="font-sans font-light text-white">Mystery Cards</span>
              </h2>
              <p className="text-white/50 text-sm mt-2 font-light leading-relaxed">
                Each card reveals a collectible and earns you <span className="text-violet-400">progress credits</span> toward owning it. 
                Not fractional ownership—real progress toward redemption.
              </p>
            </div>

            {/* Content */}
            <div className="px-6 pb-6 space-y-6">
              {/* How it works */}
              <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
                <p className="text-white/30 text-[10px] uppercase tracking-widest mb-2 font-light">
                  How Progress Works
                </p>
                <ul className="text-white/60 text-xs font-light space-y-1.5">
                  <li className="flex items-start gap-2">
                    <span className="text-violet-400 mt-0.5">•</span>
                    <span>Each card earns credits toward redeeming that collectible</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-violet-400 mt-0.5">•</span>
                    <span>Earn bonus credits through quizzes, swaps & gifts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-violet-400 mt-0.5">•</span>
                    <span>Reach 100% to redeem the actual product</span>
                  </li>
                </ul>
              </div>

              {/* Tier Selection */}
              <div>
                <label className="text-white/30 text-[10px] uppercase tracking-widest mb-3 block font-light">
                  Select Pack
                </label>
                <div className="space-y-2">
                  {tiers.map((tier) => {
                    const Icon = tier.icon;
                    const isSelected = selectedTier === tier.id;
                    return (
                      <button
                        key={tier.id}
                        onClick={() => setSelectedTier(tier.id)}
                        className={`relative w-full p-4 rounded-xl border transition-all text-left ${
                          isSelected
                            ? 'border-violet-500/50 bg-violet-500/5' 
                            : 'border-white/5 hover:border-white/10 bg-transparent'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${isSelected ? 'bg-violet-500/10' : 'bg-white/5'}`}>
                            <Icon className={`w-4 h-4 ${isSelected ? 'text-violet-400' : 'text-white/40'}`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-baseline justify-between">
                              <p className="text-white font-light">{tier.description}</p>
                              <p className="text-white font-mono text-lg">{tier.name}</p>
                            </div>
                            <p className="text-white/40 text-xs mt-1 font-light">{tier.details}</p>
                            <p className="text-violet-400/70 text-[10px] mt-1.5 font-mono">
                              {tier.creditsRange} credits per card
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quantity Selection */}
              <div>
                <label className="text-white/30 text-[10px] uppercase tracking-widest mb-3 block font-light">
                  Quantity
                </label>
                <div className="flex gap-2">
                  {quantities.map((qty) => (
                    <button
                      key={qty}
                      onClick={() => setSelectedQuantity(qty)}
                      className={`flex-1 py-3 rounded-xl border transition-all font-mono ${
                        selectedQuantity === qty
                          ? 'border-violet-500/50 bg-violet-500/5 text-white'
                          : 'border-white/5 hover:border-white/10 text-white/40'
                      }`}
                    >
                      {qty}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Summary */}
              <div className="border-t border-white/5 pt-4 space-y-2">
                <div className="flex justify-between text-white/40 text-sm font-light">
                  <span>{selectedQuantity} × {selectedTierData.description}</span>
                  <span className="font-mono">${totalPrice}</span>
                </div>
                <div className="flex justify-between text-white pt-2">
                  <span className="font-light">Total</span>
                  <span className="font-mono text-xl">${totalPrice}</span>
                </div>
              </div>

              {/* Purchase Button */}
              <button
                onClick={handlePurchase}
                disabled={isLoading}
                className={`w-full py-4 rounded-xl font-light text-lg transition-all ${
                  isLoading
                    ? 'bg-white/5 text-white/30 cursor-not-allowed'
                    : 'bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:from-violet-600 hover:to-purple-700 active:scale-[0.99]'
                }`}
              >
                {isLoading ? 'Redirecting...' : user ? `Pay $${totalPrice}` : 'Sign in to purchase'}
              </button>

              {!user && (
                <p className="text-center text-white/30 text-xs font-light">
                  You'll be redirected to sign in
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

PurchaseModal.displayName = 'PurchaseModal';
