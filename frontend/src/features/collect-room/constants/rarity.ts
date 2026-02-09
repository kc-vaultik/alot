/**
 * @fileoverview Rarity configuration constants for Collect Room feature.
 */

// ============= Rarity Bands =============
export const RARITY_BANDS = {
  MYTHIC: 'MYTHIC',
  GRAIL: 'GRAIL',
  RARE: 'RARE',
  ICON: 'ICON',
} as const;

export type RarityBandKey = keyof typeof RARITY_BANDS;

// ============= Rarity Scores =============
/** Base rarity scores for each band */
export const RARITY_SCORES = {
  [RARITY_BANDS.MYTHIC]: 97,
  [RARITY_BANDS.GRAIL]: 85,
  [RARITY_BANDS.RARE]: 65,
  [RARITY_BANDS.ICON]: 30,
} as const;

// ============= Rarity Thresholds =============
/** Score thresholds for determining rarity tier */
export const RARITY_THRESHOLDS = {
  MYTHIC: 95,
  GRAIL: 80,
  RARE: 50,
} as const;

// ============= Haptics =============
/** Haptic feedback patterns by intensity */
export const HAPTIC_PATTERNS = {
  light: [10],
  medium: [30],
  heavy: [50, 30, 50],
} as const;
