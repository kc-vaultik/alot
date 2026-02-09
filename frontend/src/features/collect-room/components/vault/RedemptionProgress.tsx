import { memo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Trophy } from 'lucide-react';
import { ProductProgress } from './types';

interface RedemptionProgressProps {
  productProgress: ProductProgress[];
  onUnboxAnother: () => void;
  onBuyProgress: (product: ProductProgress) => void;
}

export const RedemptionProgress = memo(({ 
  productProgress, 
  onUnboxAnother,
  onBuyProgress 
}: RedemptionProgressProps) => {
  if (productProgress.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-white/40 mb-6">No cards yet. Start collecting to build Progress!</p>
        <button
          onClick={onUnboxAnother}
          className="px-8 py-3 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:from-violet-600 hover:to-purple-700 transition-all text-sm font-medium"
        >
          Open Your First Pack
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5 text-cyan-400" />
        <h2 className="text-white font-medium">Redeem Progress</h2>
        <span className="text-white/40 text-sm">({productProgress.length} products)</span>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {productProgress.map((product, index) => (
          <motion.div
            key={product.productKey}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`relative rounded-2xl overflow-hidden border ${
              product.isRedeemable 
                ? 'bg-green-500/10 border-green-400/30' 
                : 'bg-white/5 border-white/10'
            } p-4`}
          >
            {/* Product Image & Info */}
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-xl bg-black/30 flex items-center justify-center overflow-hidden">
                <img 
                  src={product.productImage} 
                  alt={product.model}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white/50 text-xs">{product.brand}</p>
                <p className="text-white font-medium truncate">{product.model}</p>
                <div className="flex items-center gap-2">
                  <p className="text-violet-400 text-sm font-medium">${product.productValue.toLocaleString()}</p>
                  <p className="text-white/40 text-xs">• {product.cardCount} card{product.cardCount !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="relative mb-2">
              <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${
                    product.isRedeemable 
                      ? 'bg-gradient-to-r from-green-400 to-emerald-300' 
                      : 'bg-gradient-to-r from-cyan-500 via-violet-500 to-purple-500'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(product.totalShards, 100)}%` }}
                  transition={{ delay: 0.3 + index * 0.05, duration: 0.8, ease: 'easeOut' }}
                />
              </div>
              {/* Glow effect */}
              <motion.div
                className={`absolute inset-0 h-3 rounded-full blur-sm ${
                  product.isRedeemable ? 'bg-green-400/40' : 'bg-cyan-400/30'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(product.totalShards, 100)}%` }}
                transition={{ delay: 0.3 + index * 0.05, duration: 0.8, ease: 'easeOut' }}
              />
            </div>

            {/* Progress Text */}
            <div className="flex items-center justify-between text-xs">
              <span className={product.isRedeemable ? 'text-green-400 font-medium' : 'text-white/60'}>
                {product.totalShards.toFixed(1)}% Progress
              </span>
              <span className="text-white/40">
                {product.isRedeemable 
                  ? 'Ready to redeem!' 
                  : `${(100 - product.totalShards).toFixed(1)}% to redeem`
                }
              </span>
            </div>

            {/* Credits display */}
            <div className="mt-2 flex items-center justify-between text-xs bg-white/5 rounded-lg px-2 py-1.5">
              <span className="text-white/50">Credits</span>
              <span className="text-green-400 font-medium">
                ${((product.totalShards / 100) * product.productValue).toFixed(2)}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="mt-4 flex gap-2">
              {/* Boost with Credits Button */}
              {!product.isRedeemable && (
                <button 
                  onClick={() => onBuyProgress(product)}
                  className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-cyan-400 text-sm font-medium hover:from-cyan-500/30 hover:to-violet-500/30 transition-colors flex items-center justify-center gap-2 border border-cyan-500/20"
                >
                  <TrendingUp className="w-4 h-4" />
                  Boost with Credits
                </button>
              )}
              
              {/* Redeem Button */}
              {product.isRedeemable && (
                <button className="flex-1 py-2.5 rounded-lg bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2">
                  <Trophy className="w-4 h-4" />
                  Redeem Product
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </>
  );
});

RedemptionProgress.displayName = 'RedemptionProgress';
