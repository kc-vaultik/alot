/**
 * @fileoverview Unified Card Styling Utilities
 * 
 * Centralized styling functions for all card components across the application.
 * Provides consistent rarity-based visual styling for:
 * - Card borders and gradients
 * - Glow effects and shadows
 * - Reveal animations (auras, light rays, confetti)
 * - Ambient backgrounds
 * 
 * Consolidates functionality from:
 * - features/collect-room/utils/cardStyles.ts
 * - features/collect-room/utils/rarity.ts
 * - features/marketplace/utils/cardDisplay.ts
 * - features/rooms/components/detail/StakedCardDisplay.tsx (inline functions)
 */

import type { RarityTier } from '@/types/shared';
import type { AuraColors } from './types';

// =============================================================================
// Rarity Tier Calculation (moved from utils/tiers.ts)
// =============================================================================

/**
 * Rarity score thresholds for tier calculation
 */
export const RARITY_THRESHOLDS = {
  MYTHIC: 95,
  GRAIL: 80,
  RARE: 50,
} as const;

/**
 * Get rarity tier from score
 * @param score - Rarity score (0-100)
 * @returns RarityTier
 */
export function getRarityTier(score: number): RarityTier {
  if (score >= RARITY_THRESHOLDS.MYTHIC) return 'mythic';
  if (score >= RARITY_THRESHOLDS.GRAIL) return 'grail';
  if (score >= RARITY_THRESHOLDS.RARE) return 'rare';
  return 'icon';
}

// =============================================================================
// Types
// =============================================================================

/**
 * Card-like object that has rarity_score and optionally is_golden.
 * Used for functions that can accept either a tier string or a card object.
 */
interface CardLike {
  rarity_score: number;
  is_golden?: boolean;
}

// =============================================================================
// Card Border Classes
// =============================================================================

/**
 * Get card border class based on a card object.
 * Accounts for golden status and rarity score.
 */
export function getCardBorderClass(card: CardLike): string;
/**
 * Get card border class based on rarity tier and optional golden status.
 */
export function getCardBorderClass(tier: RarityTier, isGolden?: boolean): string;
/**
 * Get card border class with null safety.
 */
export function getCardBorderClass(cardOrTier: CardLike | RarityTier | null | undefined, isGolden?: boolean): string;
export function getCardBorderClass(
  cardOrTier: CardLike | RarityTier | null | undefined,
  isGolden?: boolean
): string {
  // Defensive null check - return default styling if no card/tier provided
  if (!cardOrTier) return 'border-white/10 shadow-black/20';

  // Handle card object
  if (typeof cardOrTier === 'object') {
    if (cardOrTier.is_golden) return 'border-amber-400/60 shadow-amber-500/20';
    const tier = getRarityTier(cardOrTier.rarity_score);
    return getBorderClassForTier(tier, false);
  }

  // Handle tier string
  return getBorderClassForTier(cardOrTier, isGolden);
}

/**
 * Internal helper to get border class for a tier.
 */
function getBorderClassForTier(tier: RarityTier, isGolden?: boolean): string {
  if (isGolden) return 'border-amber-400/60 shadow-amber-500/20';
  switch (tier) {
    case 'mythic':
      return 'border-amber-400/40 shadow-amber-500/10';
    case 'grail':
      return 'border-violet-400/40 shadow-violet-500/10';
    case 'rare':
      return 'border-blue-400/30 shadow-blue-500/10';
    default:
      return 'border-white/10 shadow-black/20';
  }
}

// =============================================================================
// Gradient Colors
// =============================================================================

/**
 * Get gradient colors for a card object.
 */
export function getGradientColors(card: CardLike): string;
/**
 * Get gradient colors for a rarity tier.
 */
export function getGradientColors(tier: RarityTier): string;
/**
 * Get gradient colors with null safety.
 */
export function getGradientColors(cardOrTier: CardLike | RarityTier | null | undefined): string;
export function getGradientColors(cardOrTier: CardLike | RarityTier | null | undefined): string {
  // Defensive null check - return default gradient if no card/tier provided
  if (!cardOrTier) return 'from-purple-600/70 via-violet-500/50 to-purple-900/80';

  // Handle card object
  if (typeof cardOrTier === 'object') {
    if (cardOrTier.is_golden) {
      return 'from-amber-400/30 via-amber-300/20 to-transparent';
    }
    const tier = getRarityTier(cardOrTier.rarity_score);
    return getGradientForTier(tier);
  }

  // Handle tier string
  return getGradientForTier(cardOrTier);
}

/**
 * Internal helper to get gradient for a tier.
 */
function getGradientForTier(tier: RarityTier): string {
  switch (tier) {
    case 'mythic':
      return 'from-amber-500/80 via-yellow-400/60 to-orange-700/90';
    case 'grail':
      return 'from-violet-600/80 via-purple-500/60 to-violet-900/90';
    case 'rare':
      return 'from-blue-600/80 via-cyan-500/60 to-blue-900/90';
    default:
      return 'from-purple-600/70 via-violet-500/50 to-purple-900/80';
  }
}

// =============================================================================
// Border Glow (for reveal effects)
// =============================================================================

/**
 * Returns Tailwind gradient classes for card border glow effects.
 * Creates a luminous border effect based on rarity.
 * 
 * @param tier - The rarity tier of the card
 * @returns Tailwind gradient class string for border glow
 */
export function getBorderGlow(tier: RarityTier): string {
  switch (tier) {
    case 'mythic':
      return 'from-amber-400/60 via-yellow-500/60 to-amber-400/60';
    case 'grail':
      return 'from-violet-400/50 via-purple-500/50 to-violet-400/50';
    case 'rare':
      return 'from-blue-400/40 via-cyan-500/40 to-blue-400/40';
    default:
      return 'from-white/20 via-white/10 to-white/20';
  }
}

// =============================================================================
// Glow Color (RGBA for box-shadow/filters)
// =============================================================================

/**
 * Returns an RGBA color string for box-shadow and filter effects.
 * Used for dynamic glow effects on cards.
 * 
 * @param tier - The rarity tier of the card
 * @returns RGBA color string
 */
export function getGlowColor(tier: RarityTier): string {
  switch (tier) {
    case 'mythic':
      return 'rgba(251,191,36,0.4)';
    case 'grail':
      return 'rgba(139,92,246,0.4)';
    case 'rare':
      return 'rgba(59,130,246,0.3)';
    default:
      return 'rgba(255,255,255,0.2)';
  }
}

// =============================================================================
// Aura Colors (complete reveal configuration)
// =============================================================================

/**
 * Returns a complete aura color configuration for card reveal effects.
 * Provides all the color values needed for dramatic reveal animations.
 * 
 * @param tier - The rarity tier of the card
 * @returns Complete AuraColors configuration object
 */
export function getAuraColors(tier: RarityTier): AuraColors {
  switch (tier) {
    case 'mythic':
      return {
        primary: 'from-amber-400 via-yellow-300 to-amber-500',
        glow: 'bg-amber-400/30',
        particles: 'bg-amber-300',
        text: 'text-amber-300',
        gradient: 'from-amber-500/80 via-yellow-400/60 to-orange-700/90',
        glowColor: 'rgba(251,191,36,0.6)',
      };
    case 'grail':
      return {
        primary: 'from-violet-400 via-purple-300 to-violet-500',
        glow: 'bg-violet-400/25',
        particles: 'bg-violet-300',
        text: 'text-violet-300',
        gradient: 'from-violet-600/80 via-purple-500/60 to-violet-900/90',
        glowColor: 'rgba(139,92,246,0.5)',
      };
    case 'rare':
      return {
        primary: 'from-blue-400 via-cyan-300 to-blue-500',
        glow: 'bg-blue-400/20',
        particles: 'bg-blue-300',
        text: 'text-blue-300',
        gradient: 'from-blue-600/80 via-cyan-500/60 to-blue-900/90',
        glowColor: 'rgba(59,130,246,0.4)',
      };
    default:
      return {
        primary: 'from-white/60 via-white/40 to-white/60',
        glow: 'bg-white/10',
        particles: 'bg-white/60',
        text: 'text-white/80',
        gradient: 'from-purple-600/70 via-violet-500/50 to-purple-900/80',
        glowColor: 'rgba(255,255,255,0.2)',
      };
  }
}

// =============================================================================
// Ambient Background
// =============================================================================

/**
 * Returns Tailwind background classes for ambient glow based on rarity.
 * Used for screen-level background effects during reveals.
 * 
 * @param tier - The rarity tier of the card
 * @returns Tailwind background class string
 */
export function getAmbientBackground(tier: RarityTier): string {
  switch (tier) {
    case 'mythic':
      return 'bg-amber-500/20';
    case 'grail':
      return 'bg-violet-500/20';
    case 'rare':
      return 'bg-blue-500/15';
    default:
      return 'bg-white/5';
  }
}

// =============================================================================
// Card Border Color (simple border-only class)
// =============================================================================

/**
 * Returns Tailwind border classes for card borders based on rarity.
 * Used for card frame styling (border-only, no shadow).
 * 
 * @param tier - The rarity tier of the card
 * @returns Tailwind border class string
 */
export function getCardBorderColor(tier: RarityTier): string {
  switch (tier) {
    case 'mythic':
      return 'border-amber-400/50';
    case 'grail':
      return 'border-violet-400/50';
    case 'rare':
      return 'border-blue-400/40';
    default:
      return 'border-white/10';
  }
}

// =============================================================================
// Light Ray Gradient (reveal effects)
// =============================================================================

/**
 * Returns Tailwind gradient classes for light ray effects during reveals.
 * Used for dramatic reveal animations on high-rarity cards.
 * 
 * @param tier - The rarity tier of the card
 * @returns Tailwind gradient class string for light rays
 */
export function getLightRayGradient(tier: RarityTier): string {
  switch (tier) {
    case 'mythic':
      return 'bg-gradient-to-t from-amber-400/60 via-amber-300/30 to-transparent';
    case 'grail':
      return 'bg-gradient-to-t from-violet-400/50 via-violet-300/25 to-transparent';
    case 'rare':
      return 'bg-gradient-to-t from-blue-400/40 via-blue-300/20 to-transparent';
    default:
      return 'bg-gradient-to-t from-white/30 via-white/15 to-transparent';
  }
}

// =============================================================================
// Confetti Colors (celebration effects)
// =============================================================================

/**
 * Returns confetti particle class based on index and tier.
 * Creates varied confetti colors for celebration effects.
 * 
 * @param tier - The rarity tier of the card
 * @param index - The particle index for variation
 * @returns Tailwind background class for the confetti particle
 */
export function getConfettiColor(tier: RarityTier, index: number): string {
  const aura = getAuraColors(tier);
  const mod = index % 5;

  switch (mod) {
    case 0:
      return aura.particles;
    case 1:
      return 'bg-white/70';
    case 2:
      return tier === 'mythic'
        ? 'bg-yellow-200'
        : tier === 'grail'
          ? 'bg-purple-200'
          : 'bg-cyan-200';
    case 3:
      return aura.particles;
    default:
      return 'bg-white/50';
  }
}

// =============================================================================
// Rarity Label
// =============================================================================

/**
 * Returns human-readable label for a rarity tier (uppercase).
 * Used for displaying tier names in UI.
 * 
 * @param tier - The rarity tier
 * @returns Uppercase tier label
 */
export function getRarityLabel(tier: RarityTier): string {
  switch (tier) {
    case 'mythic':
      return 'MYTHIC';
    case 'grail':
      return 'GRAIL';
    case 'rare':
      return 'RARE';
    default:
      return 'ICON';
  }
}

// =============================================================================
// Band to Tier Conversion
// =============================================================================

/**
 * Converts an uppercase band string to a RarityTier.
 * Handles null/undefined safely.
 * 
 * @param band - The uppercase band string (e.g., 'MYTHIC')
 * @returns The lowercase rarity tier
 */
export function getBandTier(band: string | null | undefined): RarityTier {
  switch (band?.toUpperCase()) {
    case 'MYTHIC':
      return 'mythic';
    case 'GRAIL':
      return 'grail';
    case 'RARE':
      return 'rare';
    default:
      return 'icon';
  }
}
