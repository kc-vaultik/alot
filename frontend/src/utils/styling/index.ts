/**
 * @fileoverview Unified Styling Utilities
 * 
 * Central export point for all card and tier styling functions.
 * Import from here for consistent styling across the application.
 * 
 * @example
 * import { getCardBorderClass, getGradientColors, getAuraColors, getRarityTier } from '@/utils/styling';
 */

// Card styling exports (includes getRarityTier and RARITY_THRESHOLDS)
export {
  getCardBorderClass,
  getGradientColors,
  getBorderGlow,
  getGlowColor,
  getAuraColors,
  getAmbientBackground,
  getCardBorderColor,
  getLightRayGradient,
  getConfettiColor,
  getRarityLabel,
  getBandTier,
  getRarityTier,
  RARITY_THRESHOLDS,
} from './cardStyles';

// Tier styling exports (product carousel styling, band colors)
export {
  getTierGradientColors,
  getTierBorderClass,
  getTierTextColor,
  BAND_COLORS,
  RARITY_BAND_COLORS,
  bandToTier,
  tierToBand,
} from './tierStyles';

// Type exports
export type { AuraColors } from './types';
