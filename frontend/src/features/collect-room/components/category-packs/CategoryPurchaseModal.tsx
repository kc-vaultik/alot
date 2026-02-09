/**
 * CategoryPurchaseModal Component
 * Modal for purchasing category-specific packs with dynamic pricing
 */

import { useState, memo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Zap, Crown, Star, Gem, Loader2 } from 'lucide-react';
import { useCategoryCheckout, useCategoryPricing } from '../../hooks/checkout';
import { useAuth } from '@/contexts/AuthContext';
import type { CategoryPackConfig } from '../../constants/categories';
import type { PricingTier } from '../../types';

interface CategoryPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: CategoryPackConfig | null;
  onPurchaseComplete?: () => void;
}

const tierIcons = {
  T5: Sparkles,
  T10: Zap,
  T20: Crown,
};

const tierDescriptions = {
  T5: { label: 'Starter Pack', details: 'Standard odds. Great for building your collection.' },
  T10: { label: 'Premium Pack', details: '2× rare odds. Higher credit rewards per card.' },
  T20: { label: 'Elite Pack', details: '5× rare odds. Best path to mythic pulls.' },
};

const quantities = [1, 3, 5, 10];

export const CategoryPurchaseModal = memo(({ 
  isOpen, 
  onClose, 
  category,
  onPurchaseComplete 
}: CategoryPurchaseModalProps) => {
  const [selectedTier, setSelectedTier] = useState<PricingTier>('T5');
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  
  const { createCategoryCheckout, isLoading } = useCategoryCheckout();
  const { prices, isLoading: pricesLoading } = useCategoryPricing(category?.id ?? null);
  const { user } = useAuth();

  // Reset selection when category changes
  useEffect(() => {
    if (category) {
      setSelectedTier('T5');
      setSelectedQuantity(1);
    }
  }, [category?.id]);

  if (!category) return null;

  const selectedPrice = prices.find(p => p.tier === selectedTier);
  const unitPriceCents = selectedPrice?.price_cents ?? 0;
  const unitPriceUsd = unitPriceCents / 100;
  const totalPrice = unitPriceUsd * selectedQuantity;

  const handlePurchase = async () => {
    if (!user) {
      window.location.href = `/auth?returnTo=/collect-room`;
      return;
    }
    await createCategoryCheckout(category.id, selectedTier, selectedQuantity, unitPriceCents);
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
            {/* Header with category gradient */}
            <div className={`relative px-6 pt-6 pb-4 bg-gradient-to-r ${category.gradient} bg-opacity-10`}>
              <div className={`absolute inset-0 bg-gradient-to-r ${category.gradient} opacity-5`} />
              
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4 text-white/40" />
              </button>

              <div className="flex items-center gap-3 relative">
                <span className="text-4xl">{category.icon}</span>
                <div>
                  <h2 className="text-2xl">
                    <span className={`font-serif italic text-transparent bg-clip-text bg-gradient-to-r ${category.gradient}`}>
                      {category.name}
                    </span>
                    {' '}
                    <span className="font-sans font-light text-white">Pack</span>
                  </h2>
                  <p className="text-white/50 text-sm font-light">
                    Guaranteed {category.name.toLowerCase()} in every card
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 pb-6 space-y-6">
              {/* Tier Brands Preview */}
              <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
                <p className="text-white/30 text-[10px] uppercase tracking-widest mb-3 font-light">
                  What you can pull
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Star className="w-3.5 h-3.5 text-white/40" />
                    <span className="text-white/40 text-xs">Icon:</span>
                    <span className="text-white/60 text-xs font-light">{category.brands.icon.join(', ')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-blue-400/70 text-xs">Rare:</span>
                    <span className="text-blue-400/60 text-xs font-light">{category.brands.rare.join(', ')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Gem className="w-3.5 h-3.5 text-violet-400" />
                    <span className="text-violet-400/70 text-xs">Grail:</span>
                    <span className="text-violet-400/60 text-xs font-light">{category.brands.grail.join(', ')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-amber-400/70 text-xs">Mythic:</span>
                    <span className="text-amber-400/60 text-xs font-light">{category.brands.mythic.join(', ')}</span>
                  </div>
                </div>
              </div>

              {/* Tier Selection */}
              <div>
                <label className="text-white/30 text-[10px] uppercase tracking-widest mb-3 block font-light">
                  Select Pack Tier
                </label>
                
                {pricesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {prices.map((price) => {
                      const Icon = tierIcons[price.tier as keyof typeof tierIcons] || Sparkles;
                      const desc = tierDescriptions[price.tier as keyof typeof tierDescriptions];
                      const isSelected = selectedTier === price.tier;
                      const priceUsd = price.price_cents / 100;
                      
                      return (
                        <button
                          key={price.tier}
                          onClick={() => setSelectedTier(price.tier as PricingTier)}
                          className={`relative w-full p-4 rounded-xl border transition-all text-left ${
                            isSelected
                              ? `border-white/20 bg-gradient-to-r ${category.gradient} bg-opacity-5` 
                              : 'border-white/5 hover:border-white/10 bg-transparent'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${isSelected ? `bg-gradient-to-br ${category.gradient} bg-opacity-20` : 'bg-white/5'}`}>
                              <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-white/40'}`} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-baseline justify-between">
                                <p className="text-white font-light">{desc?.label || price.display_name}</p>
                                <p className="text-white font-mono text-lg">${priceUsd}</p>
                              </div>
                              <p className="text-white/40 text-xs mt-1 font-light">
                                {desc?.details || price.description}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
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
                          ? `border-white/20 bg-gradient-to-r ${category.gradient} bg-opacity-10 text-white`
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
                  <span>{selectedQuantity} × {category.name} Pack</span>
                  <span className="font-mono">${totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-white pt-2">
                  <span className="font-light">Total</span>
                  <span className="font-mono text-xl">${totalPrice.toFixed(2)}</span>
                </div>
              </div>

              {/* Purchase Button */}
              <button
                onClick={handlePurchase}
                disabled={isLoading || pricesLoading || prices.length === 0}
                className={`w-full py-4 rounded-xl font-light text-lg transition-all ${
                  isLoading || pricesLoading
                    ? 'bg-white/5 text-white/30 cursor-not-allowed'
                    : `bg-gradient-to-r ${category.gradient} text-white hover:opacity-90 active:scale-[0.99]`
                }`}
              >
                {isLoading ? 'Redirecting...' : user ? `Pay $${totalPrice.toFixed(2)}` : 'Sign in to purchase'}
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

CategoryPurchaseModal.displayName = 'CategoryPurchaseModal';
