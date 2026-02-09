/**
 * @fileoverview Score calculation utilities for Collect Room
 * 
 * User-facing terms:
 * - Power: The single score shown for competition (card-level)
 * - Redeem Progress: Percentage toward redeeming a product
 * - Credits: Dollar value toward redemption (1 Credit = $0.01)
 * - Collector Level: User's tier badge (Bronze/Silver/Gold/Platinum)
 * 
 * Internal terms (not shown to users):
 * - rarityScore: Numeric value from rarity band
 * - priorityPoints: Internal calculation factor
 * - collectorScore: Numeric score that maps to Collector Level
 * - redeem_credits_cents: Raw cent value stored in DB (1 cent = 1 Credit = $0.01)
 */

import type { RarityBand } from '../types';

// Rarity score mapping for calculations (internal)
const BAND_RARITY_SCORES: Record<RarityBand, number> = {
  ICON: 25,
  RARE: 50,
  GRAIL: 75,
  MYTHIC: 100,
};

// Normalization constants (internal)
const PP_MAX = 200;
const RS_MAX = 100;

// Collector Level tiers (user-facing labels: Bronze, Silver, Gold, Platinum)
export const COLLECTOR_TIERS = {
  BRONZE: { min: 0, max: 25, bonus: 0, label: 'Bronze' },
  SILVER: { min: 26, max: 50, bonus: 0.03, label: 'Silver' },
  GOLD: { min: 51, max: 75, bonus: 0.06, label: 'Gold' },
  PLATINUM: { min: 76, max: 100, bonus: 0.10, label: 'Platinum' },
} as const;

export type CollectorTier = keyof typeof COLLECTOR_TIERS;

/**
 * Format credits (cents) as a dollar string for display
 * @param cents - Credit value in cents (1 cent = 1 Credit = $0.01)
 * @returns Formatted string like "$12.34"
 */
export function formatCredits(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

// Alias for backward compatibility
export const formatVaultCredits = formatCredits;

/**
 * Get rarity score from band
 */
export function getRarityScore(band: RarityBand): number {
  return BAND_RARITY_SCORES[band] || 25;
}

/**
 * Calculate Redeem Progress percentage (user-facing: "Redeem Progress")
 * 
 * Credits are stored as cents in the database (redeem_credits_cents).
 * 1 cent = 1 Credit = $0.01 toward redemption.
 * When Credits reach product value, Progress = 100% and product can be redeemed.
 * 
 * @param redeemCreditsCents - Credits earned toward product (in cents, 1 cent = 1 Credit)
 * @param productValueCents - Product value (in cents)
 * @returns Progress percentage (0-100)
 */
export function calculateProgress(
  redeemCreditsCents: number,
  productValueCents: number
): number {
  if (productValueCents <= 0) return 0;
  return Math.min(100, (redeemCreditsCents / productValueCents) * 100);
}

/**
 * Calculate Power (user-facing: "Power")
 * This is the single card-level score shown to users.
 * Based on Progress and Rarity, with a small boost from Collector Level.
 */
export function calculatePower(
  progress: number,
  priorityPoints: number,
  rarityScore: number
): number {
  const ppNorm = Math.min(100, (priorityPoints / PP_MAX) * 100);
  const rsNorm = (rarityScore / RS_MAX) * 100;
  
  return Math.min(100, 
    0.50 * progress + 
    0.30 * ppNorm + 
    0.20 * rsNorm
  );
}

// Backwards compatibility alias
export const calculateCollectScore = calculatePower;
export const calculateUnlockProgress = calculateProgress;

/**
 * Get Collector Level tier from score (internal)
 */
export function getCollectorTier(collectorScore: number): CollectorTier {
  if (collectorScore >= COLLECTOR_TIERS.PLATINUM.min) return 'PLATINUM';
  if (collectorScore >= COLLECTOR_TIERS.GOLD.min) return 'GOLD';
  if (collectorScore >= COLLECTOR_TIERS.SILVER.min) return 'SILVER';
  return 'BRONZE';
}

/**
 * Get Collector bonus multiplier from tier
 */
export function getCollectorBonus(collectorScore: number): number {
  const tier = getCollectorTier(collectorScore);
  return COLLECTOR_TIERS[tier].bonus;
}

/**
 * Calculate final Power with Collector Level bonus
 * This is Power × (1 + level bonus)
 */
export function calculateFinalPower(
  basePower: number,
  collectorScore: number = 0
): number {
  const collectorBonus = getCollectorBonus(collectorScore);
  return basePower * (1 + collectorBonus);
}

// Backwards compatibility alias
export const calculateClaimPower = calculateFinalPower;

/**
 * Calculate all scores for a card
 * Returns both internal values and user-facing values
 */
export function calculateCardScores(
  redeemCreditsCents: number,
  productValueCents: number,
  priorityPoints: number,
  band: RarityBand,
  collectorScore: number = 0
) {
  const progress = calculateProgress(redeemCreditsCents, productValueCents);
  const rarityScore = getRarityScore(band);
  const basePower = calculatePower(progress, priorityPoints, rarityScore);
  const power = calculateFinalPower(basePower, collectorScore);
  const collectorTier = getCollectorTier(collectorScore);
  const collectorBonus = getCollectorBonus(collectorScore);

  return {
    // User-facing
    progress,
    power,
    // Internal (for calculations)
    rarityScore,
    priorityPoints,
    collectorTier,
    collectorBonus,
    // Backwards compatibility aliases
    unlockProgress: progress,
    collectScore: basePower,
    claimPower: power,
  };
}
