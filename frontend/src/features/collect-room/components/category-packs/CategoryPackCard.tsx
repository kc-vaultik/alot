/**
 * CategoryPackCard Component
 * Displays a category pack using the pack image
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import defaultPackImage from '@/assets/collect-room-pack.png';
import sportMemorabiliaPackImage from '@/assets/packs/sport-memorabilia-pack.png';
import handbagsPackImage from '@/assets/packs/handbags-pack.png';
import watchesPackImage from '@/assets/packs/watches-pack.png';
import sneakersPackImage from '@/assets/packs/sneakers-pack.png';
import tradingCardsPackImage from '@/assets/packs/trading-cards-pack.png';
import clothingPackImage from '@/assets/packs/clothing-pack.png';
import jewelleryPackImage from '@/assets/packs/jewellery-pack.png';
import artToysPackImage from '@/assets/packs/art-toys-pack.png';
import type { CategoryPackConfig } from '../../constants/categories';
import type { CategoryProduct } from '../../hooks/checkout';

// Category-specific pack images
const CATEGORY_PACK_IMAGES: Record<string, string> = {
  SPORT_MEMORABILIA: sportMemorabiliaPackImage,
  HANDBAGS: handbagsPackImage,
  WATCHES: watchesPackImage,
  SNEAKERS: sneakersPackImage,
  POKEMON: tradingCardsPackImage,
  CLOTHING: clothingPackImage,
  JEWELLERY: jewelleryPackImage,
  ART_TOYS: artToysPackImage,
};

const getPackImage = (categoryId: string): string => {
  return CATEGORY_PACK_IMAGES[categoryId] || defaultPackImage;
};

// Categories that need scale adjustment due to image padding
const CATEGORY_SCALE: Record<string, string> = {
  SNEAKERS: 'scale-110',
  POKEMON: 'scale-125',
};

// Categories with smaller images that need container sizing
const SMALL_IMAGE_CATEGORIES: string[] = [];

interface CategoryPackCardProps {
  category: CategoryPackConfig;
  products: CategoryProduct[];
  onSelect: (category: CategoryPackConfig) => void;
  index: number;
}

export const CategoryPackCard = memo(({ category, products, onSelect, index }: CategoryPackCardProps) => {
  const isSmallImage = SMALL_IMAGE_CATEGORIES.includes(category.id);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.03 }}
      className="relative group cursor-pointer"
      onClick={() => onSelect(category)}
    >
      {/* Pack image with hover animation */}
      <div className="group-hover:scale-105 transition-transform duration-300 aspect-[3/4.5] flex items-center justify-center">
        <img
          src={getPackImage(category.id)}
          alt={`${category.name} Pack`}
          className={`object-contain drop-shadow-2xl ${
            isSmallImage 
              ? 'w-full h-full scale-[1.6] origin-center' 
              : `w-full h-auto ${CATEGORY_SCALE[category.id] || ''}`
          }`}
          draggable={false}
        />
      </div>
      
      {/* Category label below pack */}
      <div className="mt-2 text-center">
        <span className={`text-xs font-medium bg-gradient-to-r ${category.gradient} bg-clip-text text-transparent`}>
          {category.name}
        </span>
        <p className="text-[10px] text-white/40 mt-0.5">
          {products.length} items
        </p>
      </div>
    </motion.div>
  );
});

CategoryPackCard.displayName = 'CategoryPackCard';
