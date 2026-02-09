/**
 * @fileoverview Collect Room Utilities barrel export.
 * Explicit named exports for predictable API surface.
 */

// ============= Formatters =============
export {
  formatCurrency,
  formatCompactNumber,
  formatCountdown,
} from '@/utils/formatters';
export { formatDigitalNumber, getExpireDate } from './formatters';

// ============= User Helpers =============
export { getUserDisplayName, getInitials, maskEmail } from './userHelpers';

// ============= Date Utilities =============
export { getNextMidnight, getTodayISODate, sleep } from './dateUtils';

// ============= Card Styles =============
export {
  getGradientColors,
  getBorderGlow,
  getGlowColor,
  getAuraColors,
  getAmbientBackground,
  getCardBorderColor,
  getLightRayGradient,
  getConfettiColor,
  getRarityTier,
  getRarityLabel,
  getCardBorderClass,
  RARITY_THRESHOLDS,
} from '@/utils/styling';
export type { AuraColors } from '@/utils/styling';

// ============= Card Mappers =============
export {
  bandToRarityScore,
  getDesignTraitsForBand,
  getRewardsForTier,
  calculateShards,
  isValidUUID,
  mapRevealToCollectCard,
  mapFreePullRevealToCard,
} from './cardMappers';
