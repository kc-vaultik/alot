/**
 * @fileoverview Tier Styling Utilities
 * 
 * Tier-related styling for product carousels and room displays.
 * Core rarity functions are in cardStyles.ts.
 * 
 * IMPORTANT: This module only imports types from @/types/shared.
 * It does NOT re-export types - import types directly from @/types/shared.
 */

import type { RarityBand, RarityTier, PercentileBand, RoomTier } from '@/types/shared';
import { bandToTier, tierToBand } from '@/types/shared';

// Re-export conversion functions for convenience
export { bandToTier, tierToBand };

/**
 * Get gradient colors for a tier (used in product carousel)
 * Accepts both RarityTier (lowercase) and RoomTier (uppercase)
 */
export function getTierGradientColors(tier: RoomTier | RarityTier): string {
  const normalized = tier.toUpperCase();
  switch (normalized) {
    case 'MYTHIC': return 'from-amber-500/40 to-yellow-500/20';
    case 'GRAIL': return 'from-violet-500/40 to-purple-500/20';
    case 'RARE': return 'from-blue-500/40 to-cyan-500/20';
    default: return 'from-zinc-400/40 to-zinc-500/20';
  }
}

/**
 * Get border class for a tier
 * Accepts both RarityTier (lowercase) and RoomTier (uppercase)
 */
export function getTierBorderClass(tier: RoomTier | RarityTier): string {
  const normalized = tier.toUpperCase();
  switch (normalized) {
    case 'MYTHIC': return 'border-amber-400/50';
    case 'GRAIL': return 'border-violet-400/50';
    case 'RARE': return 'border-blue-400/50';
    default: return 'border-zinc-400/30';
  }
}

/**
 * Get text color for a tier
 * Accepts both RarityTier (lowercase) and RoomTier (uppercase)
 */
export function getTierTextColor(tier: RoomTier | RarityTier): string {
  const normalized = tier.toUpperCase();
  switch (normalized) {
    case 'MYTHIC': return 'text-amber-400';
    case 'GRAIL': return 'text-violet-400';
    case 'RARE': return 'text-blue-400';
    default: return 'text-white/50';
  }
}

/**
 * Percentile band gradient colors
 */
export const BAND_COLORS: Record<PercentileBand, string> = {
  S: 'from-amber-500 to-yellow-400',
  A: 'from-violet-500 to-purple-400',
  B: 'from-blue-500 to-cyan-400',
  C: 'from-zinc-400 to-zinc-300',
};

/**
 * Rarity band colors (solid hex for badges)
 */
export const RARITY_BAND_COLORS: Record<RoomTier, string> = {
  MYTHIC: '#F59E0B',
  GRAIL: '#8B5CF6',
  RARE: '#3B82F6',
  ICON: '#71717A',
};
