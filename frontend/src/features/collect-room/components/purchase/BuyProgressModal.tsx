import { memo, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Coins, Target, Sparkles, ArrowRight } from 'lucide-react';
import { getRarityTier } from '@/utils/styling';
import type { RarityTier } from '@/features/collect-room/types';

interface ProductProgress {
  productKey: string;
  brand: string;
  model: string;
  productImage: string;
  productValue: number;
  totalShards: number;
  cardCount: number;
  isRedeemable: boolean;
}

interface BuyProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductProgress;
  availablePoints: number;
  onPurchase: (points: number, progressGained: number) => void;
  rarityScore: number;
}

// Points to progress conversion rates based on rarity
// Higher rarity = more points needed per 1% progress
const getConversionRate = (rarityScore: number): { pointsPerPercent: number; tier: RarityTier; tierLabel: string } => {
  const tier = getRarityTier(rarityScore);
  switch (tier) {
    case 'mythic':
      return { pointsPerPercent: 100, tier, tierLabel: 'Mythic' }; // 100 points = 1%
    case 'grail':
      return { pointsPerPercent: 50, tier, tierLabel: 'Grail' }; // 50 points = 1%
    case 'rare':
      return { pointsPerPercent: 25, tier, tierLabel: 'Rare' }; // 25 points = 1%
    default:
      return { pointsPerPercent: 10, tier, tierLabel: 'Icon' }; // 10 points = 1%
  }
};

const PRESET_AMOUNTS = [10, 25, 50, 100];

export const BuyProgressModal = memo(({
  isOpen,
  onClose,
  product,
  availablePoints,
  onPurchase,
  rarityScore,
}: BuyProgressModalProps) => {
  const [selectedPoints, setSelectedPoints] = useState(10);
  const [customPoints, setCustomPoints] = useState('');

  const { pointsPerPercent, tier, tierLabel } = useMemo(() => getConversionRate(rarityScore), [rarityScore]);

  const pointsToSpend = customPoints ? parseInt(customPoints) || 0 : selectedPoints;
  const progressGained = pointsToSpend / pointsPerPercent;
  const newTotalProgress = Math.min(product.totalShards + progressGained, 100);
  const remainingToRedeem = Math.max(0, 100 - product.totalShards);
  const pointsForFullRedeem = Math.ceil(remainingToRedeem * pointsPerPercent);
  const canAfford = pointsToSpend <= availablePoints && pointsToSpend > 0;

  const handlePurchase = () => {
    if (canAfford) {
      onPurchase(pointsToSpend, progressGained);
      onClose();
    }
  };

  const getTierColor = (t: RarityTier) => {
    switch (t) {
      case 'mythic': return 'text-amber-400';
      case 'grail': return 'text-violet-400';
      case 'rare': return 'text-blue-400';
      default: return 'text-white/60';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-md bg-zinc-900 rounded-2xl border border-white/10 overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-violet-400" />
              <h3 className="text-white font-medium">Buy Progress</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Product Info */}
            <div className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="w-14 h-14 rounded-lg bg-black/30 flex items-center justify-center">
                <img 
                  src={product.productImage} 
                  alt={product.model}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white/50 text-xs">{product.brand}</p>
                <p className="text-white font-medium truncate">{product.model}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Sparkles className={`w-3 h-3 ${getTierColor(tier)}`} />
                  <span className={`text-xs ${getTierColor(tier)}`}>{tierLabel}</span>
                  <span className="text-white/40 text-xs">•</span>
                  <span className="text-violet-400 text-xs">${product.productValue.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Conversion Rate Info */}
            <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">Conversion Rate:</span>
                <span className={getTierColor(tier)}>
                  {pointsPerPercent} pts = 1% progress
                </span>
              </div>
              <p className="text-white/40 text-xs mt-1">
                Higher rarity items require more points per percent
              </p>
            </div>

            {/* Your Points */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
              <span className="text-white/60 text-sm">Your Points</span>
              <div className="flex items-center gap-1.5 text-amber-400">
                <Coins className="w-4 h-4" />
                <span className="font-medium">{availablePoints.toLocaleString()}</span>
              </div>
            </div>

            {/* Amount Selection */}
            <div className="space-y-2">
              <label className="text-white/60 text-sm">Points to spend</label>
              <div className="grid grid-cols-4 gap-2">
                {PRESET_AMOUNTS.map(amount => (
                  <button
                    key={amount}
                    onClick={() => {
                      setSelectedPoints(amount);
                      setCustomPoints('');
                    }}
                    disabled={amount > availablePoints}
                    className={`py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedPoints === amount && !customPoints
                        ? 'bg-violet-500 text-white'
                        : amount > availablePoints
                        ? 'bg-white/5 text-white/20 cursor-not-allowed'
                        : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                    }`}
                  >
                    {amount}
                  </button>
                ))}
              </div>
              <div className="relative">
                <input
                  type="number"
                  placeholder="Custom amount"
                  value={customPoints}
                  onChange={e => setCustomPoints(e.target.value)}
                  max={availablePoints}
                  min={1}
                  className="w-full py-2.5 px-4 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/50 text-sm"
                />
                {pointsForFullRedeem > 0 && (
                  <button
                    onClick={() => setCustomPoints(Math.min(pointsForFullRedeem, availablePoints).toString())}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded text-[10px] bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 transition-colors"
                  >
                    MAX ({Math.min(pointsForFullRedeem, availablePoints)})
                  </button>
                )}
              </div>
            </div>

            {/* Progress Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">Progress after purchase</span>
                <span className="text-white">
                  {product.totalShards.toFixed(1)}% 
                  <ArrowRight className="w-3 h-3 inline mx-1 text-violet-400" />
                  <span className={newTotalProgress >= 100 ? 'text-green-400' : 'text-violet-400'}>
                    {newTotalProgress.toFixed(1)}%
                  </span>
                </span>
              </div>
              <div className="h-3 bg-white/10 rounded-full overflow-hidden relative">
                {/* Current progress */}
                <div
                  className="absolute h-full bg-violet-400/50 rounded-full"
                  style={{ width: `${Math.min(product.totalShards, 100)}%` }}
                />
                {/* New progress */}
                <motion.div
                  className={`absolute h-full rounded-full ${
                    newTotalProgress >= 100 ? 'bg-green-400' : 'bg-violet-400'
                  }`}
                  initial={{ width: `${Math.min(product.totalShards, 100)}%` }}
                  animate={{ width: `${Math.min(newTotalProgress, 100)}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              {progressGained > 0 && (
                <p className="text-violet-400 text-xs text-right">
                  +{progressGained.toFixed(2)}% progress
                </p>
              )}
            </div>

            {/* Points to full redemption */}
            {!product.isRedeemable && (
              <p className="text-white/40 text-xs text-center">
                {pointsForFullRedeem.toLocaleString()} points needed for full redemption
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/10">
            <button
              onClick={handlePurchase}
              disabled={!canAfford}
              className={`w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                canAfford
                  ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:from-violet-600 hover:to-purple-700'
                  : 'bg-white/10 text-white/30 cursor-not-allowed'
              }`}
            >
              <Coins className="w-4 h-4" />
              <span>
                Spend {pointsToSpend.toLocaleString()} Points
              </span>
            </button>
            {!canAfford && pointsToSpend > availablePoints && (
              <p className="text-red-400 text-xs text-center mt-2">
                Not enough points
              </p>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
});

BuyProgressModal.displayName = 'BuyProgressModal';
