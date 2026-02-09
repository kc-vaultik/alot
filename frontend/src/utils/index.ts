/**
 * Utility functions and helpers
 */

export { logger } from './logger';
export { audioManager } from './audioManager';

// Shared formatters
export {
  formatCents,
  formatCurrency,
  formatCompactNumber,
  formatTimeRemaining,
  formatTimeRemainingSimple,
  formatLockTime,
  formatCountdown,
} from './formatters';

// Shared tier utilities
export {
  getRarityTier,
  getRarityLabel,
  getTierGradientColors,
  getTierBorderClass,
  getTierTextColor,
  RARITY_THRESHOLDS,
  BAND_COLORS,
  RARITY_BAND_COLORS,
} from './styling';
