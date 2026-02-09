/**
 * CategoryPacksGrid Component
 * Grid display of all category packs with marketplace-style design
 */

import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { CATEGORY_PACKS, type CategoryPackConfig } from '../../constants/categories';
import { CategoryPackCard } from './CategoryPackCard';
import { CategoryPurchaseModal } from './CategoryPurchaseModal';
import { useCategoryProducts } from '../../hooks/checkout';

interface CategoryPacksGridProps {
  onPurchaseComplete?: () => void;
}

export const CategoryPacksGrid = memo(({ onPurchaseComplete }: CategoryPacksGridProps) => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryPackConfig | null>(null);
  const { data: productsByCategory, isLoading } = useCategoryProducts();

  const handleCategorySelect = (category: CategoryPackConfig) => {
    setSelectedCategory(category);
  };

  const handleCloseModal = () => {
    setSelectedCategory(null);
  };

  // Filter categories that have products
  const categoriesWithProducts = CATEGORY_PACKS.filter(
    cat => productsByCategory?.[cat.id]?.length > 0
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="mb-6">
          <div className="h-7 w-40 bg-white/5 rounded animate-pulse" />
          <div className="h-4 w-64 bg-white/5 rounded animate-pulse mt-2" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-[3/4.5] bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (categoriesWithProducts.length === 0) {
    return null;
  }

  return (
    <>
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h2 className="text-xl sm:text-2xl">
          <span className="font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-500">
            Category
          </span>
          {' '}
          <span className="font-sans font-light text-white">Packs</span>
        </h2>
        <p className="text-white/40 text-sm mt-1 font-light">
          Focus your collection. Better odds for specific categories.
        </p>
      </motion.div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
        {categoriesWithProducts.map((category, index) => (
          <CategoryPackCard
            key={category.id}
            category={category}
            products={productsByCategory?.[category.id] || []}
            onSelect={handleCategorySelect}
            index={index}
          />
        ))}
      </div>

      {/* Purchase Modal */}
      <CategoryPurchaseModal
        isOpen={!!selectedCategory}
        onClose={handleCloseModal}
        category={selectedCategory}
        onPurchaseComplete={onPurchaseComplete}
      />
    </>
  );
});

CategoryPacksGrid.displayName = 'CategoryPacksGrid';
