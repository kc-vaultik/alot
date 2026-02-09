/**
 * @fileoverview Unified Card Styling Hook
 * 
 * A React hook that provides all styling utilities for cards based on
 * rarity, golden status, and card state. Consolidates styling logic
 * into a single, memoized hook for optimal performance.
 * 
 * @module hooks/useCardStyles
 * 
 * @example
 * const { borderClass, gradientClass, auraColors, tier } = useCardStyles(card);
 * // Or with just a tier:
 * const { borderClass, gradientClass } = useCardStyles('mythic', true);
 */

import { useMemo } from 'react';
import type { RarityTier } from '@/types/shared';
import type { AuraColors } from '@/utils/styling/types';
import {
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
  getRarityTier,
} from '@/utils/styling';

/**
 * Card-like object with minimum required properties for styling.
 */
interface CardStyleInput {
  rarity_score: number;
  is_golden?: boolean;
}

/**
 * Complete styling configuration for a card.
 */
export interface CardStyles {
  /** The calculated rarity tier */
  tier: RarityTier;
  /** Whether this is a golden card */
  isGolden: boolean;
  /** Border classes (border + shadow) */
  borderClass: string;
  /** Gradient classes for backgrounds */
  gradientClass: string;
  /** Border glow gradient classes */
  borderGlow: string;
  /** RGBA glow color for box-shadow */
  glowColor: string;
  /** Complete aura configuration */
  auraColors: AuraColors;
  /** Ambient background class */
  ambientBackground: string;
  /** Simple border color class */
  borderColor: string;
  /** Light ray gradient classes */
  lightRayGradient: string;
  /** Rarity label (uppercase) */
  label: string;
  /** Get confetti color for an index */
  getConfettiColor: (index: number) => string;
}

/**
 * Hook to get all styling utilities for a card.
 * Accepts either a card object or a tier string.
 * 
 * @param cardOrTier - Card object with rarity_score or RarityTier string
 * @param isGolden - Optional golden status (only used with tier string)
 * @returns Complete CardStyles object with all styling utilities
 * 
 * @example
 * // With a card object
 * function CardDisplay({ card }) {
 *   const { borderClass, gradientClass, tier } = useCardStyles(card);
 *   return (
 *     <div className={`rounded-xl ${borderClass}`}>
 *       <div className={`bg-gradient-to-br ${gradientClass}`}>
 *         {tier.toUpperCase()}
 *       </div>
 *     </div>
 *   );
 * }
 * 
 * @example
 * // With a tier string
 * function TierBadge({ tier, isGolden }) {
 *   const { auraColors, label } = useCardStyles(tier, isGolden);
 *   return <span className={auraColors.text}>{label}</span>;
 * }
 */
export function useCardStyles(
  cardOrTier: CardStyleInput | RarityTier | null | undefined,
  isGolden?: boolean
): CardStyles {
  return useMemo(() => {
    // Calculate tier from input
    let tier: RarityTier;
    let golden: boolean;

    if (!cardOrTier) {
      tier = 'icon';
      golden = false;
    } else if (typeof cardOrTier === 'object') {
      tier = getRarityTier(cardOrTier.rarity_score);
      golden = cardOrTier.is_golden ?? false;
    } else {
      tier = cardOrTier;
      golden = isGolden ?? false;
    }

    return {
      tier,
      isGolden: golden,
      borderClass: getCardBorderClass(tier, golden),
      gradientClass: getGradientColors(tier),
      borderGlow: getBorderGlow(tier),
      glowColor: getGlowColor(tier),
      auraColors: getAuraColors(tier),
      ambientBackground: getAmbientBackground(tier),
      borderColor: getCardBorderColor(tier),
      lightRayGradient: getLightRayGradient(tier),
      label: getRarityLabel(tier),
      getConfettiColor: (index: number) => getConfettiColor(tier, index),
    };
  }, [cardOrTier, isGolden]);
}

export default useCardStyles;
