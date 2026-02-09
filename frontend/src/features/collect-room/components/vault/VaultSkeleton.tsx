// Vault Loading Skeletons
// Provides visual loading states for vault components

import { memo } from 'react';
import { motion } from 'framer-motion';

// Shimmer animation for skeleton elements
const shimmer = {
  animate: {
    backgroundPosition: ['200% 0', '-200% 0'],
  },
  transition: {
    duration: 1.5,
    repeat: Infinity,
    ease: 'linear',
  },
};

const SkeletonBox = memo(({ className }: { className?: string }) => (
  <motion.div
    className={`bg-gradient-to-r from-white/5 via-white/10 to-white/5 bg-[length:200%_100%] rounded ${className}`}
    animate={shimmer.animate}
    transition={shimmer.transition}
  />
));

SkeletonBox.displayName = 'SkeletonBox';

// Card Skeleton - Single card placeholder
export const CardSkeleton = memo(() => (
  <div className="aspect-[3/4] rounded-xl overflow-hidden bg-white/5 border border-white/10">
    <div className="p-4 h-full flex flex-col">
      {/* Image area */}
      <SkeletonBox className="flex-1 mb-3" />
      
      {/* Title */}
      <SkeletonBox className="h-4 w-3/4 mb-2" />
      
      {/* Subtitle */}
      <SkeletonBox className="h-3 w-1/2" />
    </div>
  </div>
));

CardSkeleton.displayName = 'CardSkeleton';

// Cards Grid Skeleton - Multiple cards loading
export const CardGridSkeleton = memo(({ count = 6 }: { count?: number }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
));

CardGridSkeleton.displayName = 'CardGridSkeleton';

// Progress Bar Skeleton - Redemption progress loading
export const ProgressSkeleton = memo(() => (
  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
    <div className="flex items-center gap-4">
      {/* Product image */}
      <SkeletonBox className="w-16 h-16 rounded-lg flex-shrink-0" />
      
      <div className="flex-1 space-y-2">
        {/* Product name */}
        <SkeletonBox className="h-4 w-1/2" />
        
        {/* Progress bar */}
        <SkeletonBox className="h-2 w-full rounded-full" />
        
        {/* Stats */}
        <div className="flex gap-4">
          <SkeletonBox className="h-3 w-16" />
          <SkeletonBox className="h-3 w-20" />
        </div>
      </div>
    </div>
  </div>
));

ProgressSkeleton.displayName = 'ProgressSkeleton';

// Redemption Progress Skeleton - Multiple progress items
export const RedemptionSkeleton = memo(({ count = 4 }: { count?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <ProgressSkeleton key={i} />
    ))}
  </div>
));

RedemptionSkeleton.displayName = 'RedemptionSkeleton';

// Header Skeleton - Vault header loading
export const HeaderSkeleton = memo(() => (
  <div className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-md border-b border-white/10">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
      {/* Back button */}
      <SkeletonBox className="h-10 w-10 rounded-full" />
      
      {/* Stats */}
      <div className="flex gap-4">
        <SkeletonBox className="h-8 w-24 rounded-lg" />
        <SkeletonBox className="h-8 w-20 rounded-lg" />
      </div>
      
      {/* Action button */}
      <SkeletonBox className="h-10 w-28 rounded-lg" />
    </div>
  </div>
));

HeaderSkeleton.displayName = 'HeaderSkeleton';

// Tabs Skeleton - Tab navigation loading
export const TabsSkeleton = memo(() => (
  <div className="sticky top-[73px] z-30 bg-zinc-950/80 backdrop-blur-md border-b border-white/10">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2 flex gap-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonBox key={i} className="h-10 w-24 rounded-lg" />
      ))}
    </div>
  </div>
));

TabsSkeleton.displayName = 'TabsSkeleton';

// Full Vault Skeleton - Complete loading state
export const VaultSkeleton = memo(() => (
  <div className="min-h-screen pb-8 overflow-x-hidden animate-fade-in">
    <HeaderSkeleton />
    
    {/* Title */}
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-2">
      <SkeletonBox className="h-8 w-32 mb-2" />
      <SkeletonBox className="h-4 w-24" />
    </div>
    
    <TabsSkeleton />
    
    {/* Content */}
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      <CardGridSkeleton count={8} />
    </div>
  </div>
));

VaultSkeleton.displayName = 'VaultSkeleton';

// Battle Skeleton - Battle lobby loading
export const BattleSkeleton = memo(() => (
  <div className="space-y-6 animate-fade-in">
    {/* Stats bar */}
    <div className="flex justify-center gap-4">
      <SkeletonBox className="h-16 w-32 rounded-xl" />
      <SkeletonBox className="h-16 w-32 rounded-xl" />
      <SkeletonBox className="h-16 w-32 rounded-xl" />
    </div>
    
    {/* Action area */}
    <div className="flex flex-col items-center gap-4">
      <SkeletonBox className="h-12 w-48 rounded-lg" />
      <SkeletonBox className="h-4 w-64" />
    </div>
    
    {/* Recent battles */}
    <div className="space-y-3 mt-8">
      <SkeletonBox className="h-6 w-32 mb-4" />
      {Array.from({ length: 3 }).map((_, i) => (
        <SkeletonBox key={i} className="h-20 w-full rounded-xl" />
      ))}
    </div>
  </div>
));

BattleSkeleton.displayName = 'BattleSkeleton';
