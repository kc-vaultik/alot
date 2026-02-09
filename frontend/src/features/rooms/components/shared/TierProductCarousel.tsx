/**
 * @fileoverview Carousel showing products from a specific tier with infinite scroll
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useProductsByTier } from '../../hooks';
import { ROOM_TIERS } from '../../constants';
import { getTierGradientColors, getTierBorderClass, getTierTextColor } from '../../utils';
import type { RoomTier } from '../../types';
import alotLogo from '@/assets/alot-logo.png';

interface TierProductCarouselProps {
  tier: RoomTier;
}

export const TierProductCarousel = memo(function TierProductCarousel({
  tier,
}: TierProductCarouselProps) {
  const { data: products, isLoading } = useProductsByTier(tier);
  const tierConfig = ROOM_TIERS[tier];

  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-hidden py-1">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="flex-shrink-0 w-28 aspect-[3/4.5] rounded-xl bg-white/5 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!products?.length) return null;

  // Duplicate products for seamless infinite loop
  const duplicatedProducts = [...products, ...products];

  return (
    <div className="relative overflow-hidden">
      <motion.div
        className="flex gap-3"
        animate={{
          x: [0, -((products.length * 124))], // 112px width + 12px gap
        }}
        transition={{
          x: {
            duration: products.length * 3,
            repeat: Infinity,
            ease: "linear",
          },
        }}
      >
        {duplicatedProducts.map((product, index) => (
          <div
            key={`${product.id}-${index}`}
            className="flex-shrink-0 w-28"
          >
            {/* Mini Card matching MyCardsGrid design */}
            <div className={`relative aspect-[3/4.5] rounded-2xl overflow-hidden border-4 border-white shadow-sticker ${getTierBorderClass(tier)} bg-[#0a0a0f]`}>
              {/* Gradient accent */}
              <div className={`absolute bottom-0 right-0 w-3/4 h-1/2 bg-gradient-to-tl ${getTierGradientColors(tier)} blur-2xl opacity-60`} />
              
              {/* Logo */}
              <div className="absolute top-2 left-2 z-10">
                <img 
                  src={alotLogo} 
                  alt="Alot!" 
                  className="h-5 object-contain"
                  draggable={false} 
                />
              </div>

              {/* Product image */}
              <div className="absolute inset-0 flex items-center justify-center p-3 pt-8">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-auto max-h-16 object-contain opacity-90"
                  />
                ) : (
                  <div className="text-white/20 text-[8px] text-center">
                    {product.brand}
                  </div>
                )}
              </div>

              {/* Bottom info */}
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-amber-200/60 text-[8px] uppercase tracking-wider truncate">
                  {product.brand}
                </p>
                <p className="text-amber-200/90 text-[10px] font-light truncate">
                  {product.name}
                </p>
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center gap-1">
                    <Sparkles className={`w-2.5 h-2.5 ${getTierTextColor(tier)}`} />
                    <span className={`text-[8px] ${getTierTextColor(tier)}`}>
                      {tierConfig.name}
                    </span>
                  </div>
                  <span className="text-violet-400 text-[10px] font-medium">
                    ${product.retail_value_usd.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none rounded-xl" />
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
});
