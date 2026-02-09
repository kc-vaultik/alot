/**
 * @fileoverview Card Styling Utilities Tests
 * Tests for the unified styling module.
 */

import { describe, it, expect } from 'vitest';
import {
  getGradientColors,
  getBorderGlow,
  getGlowColor,
  getAuraColors,
  getAmbientBackground,
  getCardBorderColor,
  getLightRayGradient,
  getConfettiColor,
  getCardBorderClass,
  getRarityLabel,
  getBandTier,
} from './cardStyles';
import type { RarityTier } from '@/types/shared';

describe('getGradientColors', () => {
  it('returns mythic gradient colors', () => {
    expect(getGradientColors('mythic')).toContain('amber');
  });

  it('returns grail gradient colors', () => {
    expect(getGradientColors('grail')).toContain('violet');
  });

  it('returns rare gradient colors', () => {
    expect(getGradientColors('rare')).toContain('blue');
  });

  it('returns icon (default) gradient colors', () => {
    expect(getGradientColors('icon')).toContain('purple');
  });

  it('handles null input', () => {
    expect(getGradientColors(null)).toContain('purple');
  });

  it('handles card object', () => {
    expect(getGradientColors({ rarity_score: 96 })).toContain('amber');
    expect(getGradientColors({ rarity_score: 85 })).toContain('violet');
    expect(getGradientColors({ rarity_score: 60 })).toContain('blue');
    expect(getGradientColors({ rarity_score: 30 })).toContain('purple');
  });

  it('handles golden card', () => {
    expect(getGradientColors({ rarity_score: 30, is_golden: true })).toContain('amber');
  });
});

describe('getBorderGlow', () => {
  it('returns mythic border glow', () => {
    expect(getBorderGlow('mythic')).toContain('amber');
  });

  it('returns grail border glow', () => {
    expect(getBorderGlow('grail')).toContain('violet');
  });

  it('returns rare border glow', () => {
    expect(getBorderGlow('rare')).toContain('blue');
  });

  it('returns icon (default) border glow', () => {
    expect(getBorderGlow('icon')).toContain('white');
  });
});

describe('getGlowColor', () => {
  it('returns mythic glow color', () => {
    expect(getGlowColor('mythic')).toBe('rgba(251,191,36,0.4)');
  });

  it('returns grail glow color', () => {
    expect(getGlowColor('grail')).toBe('rgba(139,92,246,0.4)');
  });

  it('returns rare glow color', () => {
    expect(getGlowColor('rare')).toBe('rgba(59,130,246,0.3)');
  });

  it('returns icon glow color', () => {
    expect(getGlowColor('icon')).toBe('rgba(255,255,255,0.2)');
  });
});

describe('getAuraColors', () => {
  const tiers: RarityTier[] = ['mythic', 'grail', 'rare', 'icon'];

  tiers.forEach((tier) => {
    it(`returns valid aura colors for ${tier}`, () => {
      const aura = getAuraColors(tier);
      expect(aura).toHaveProperty('primary');
      expect(aura).toHaveProperty('glow');
      expect(aura).toHaveProperty('particles');
      expect(aura).toHaveProperty('text');
      expect(aura).toHaveProperty('gradient');
      expect(aura).toHaveProperty('glowColor');
    });
  });

  it('mythic aura has amber colors', () => {
    const aura = getAuraColors('mythic');
    expect(aura.primary).toContain('amber');
    expect(aura.text).toContain('amber');
  });

  it('grail aura has violet colors', () => {
    const aura = getAuraColors('grail');
    expect(aura.primary).toContain('violet');
    expect(aura.text).toContain('violet');
  });
});

describe('getAmbientBackground', () => {
  it('returns mythic ambient background', () => {
    expect(getAmbientBackground('mythic')).toBe('bg-amber-500/20');
  });

  it('returns grail ambient background', () => {
    expect(getAmbientBackground('grail')).toBe('bg-violet-500/20');
  });

  it('returns rare ambient background', () => {
    expect(getAmbientBackground('rare')).toBe('bg-blue-500/15');
  });

  it('returns icon ambient background', () => {
    expect(getAmbientBackground('icon')).toBe('bg-white/5');
  });
});

describe('getCardBorderColor', () => {
  it('returns mythic border color', () => {
    expect(getCardBorderColor('mythic')).toBe('border-amber-400/50');
  });

  it('returns grail border color', () => {
    expect(getCardBorderColor('grail')).toBe('border-violet-400/50');
  });

  it('returns rare border color', () => {
    expect(getCardBorderColor('rare')).toBe('border-blue-400/40');
  });

  it('returns icon border color', () => {
    expect(getCardBorderColor('icon')).toBe('border-white/10');
  });
});

describe('getLightRayGradient', () => {
  it('returns mythic light ray gradient', () => {
    expect(getLightRayGradient('mythic')).toContain('amber');
  });

  it('returns grail light ray gradient', () => {
    expect(getLightRayGradient('grail')).toContain('violet');
  });

  it('returns rare light ray gradient', () => {
    expect(getLightRayGradient('rare')).toContain('blue');
  });

  it('returns icon light ray gradient', () => {
    expect(getLightRayGradient('icon')).toContain('white');
  });
});

describe('getConfettiColor', () => {
  it('returns particle color for index 0', () => {
    expect(getConfettiColor('mythic', 0)).toBe('bg-amber-300');
  });

  it('returns white for index 1', () => {
    expect(getConfettiColor('mythic', 1)).toBe('bg-white/70');
  });

  it('returns tier-specific color for index 2', () => {
    expect(getConfettiColor('mythic', 2)).toBe('bg-yellow-200');
    expect(getConfettiColor('grail', 2)).toBe('bg-purple-200');
    expect(getConfettiColor('rare', 2)).toBe('bg-cyan-200');
  });

  it('cycles through colors', () => {
    expect(getConfettiColor('mythic', 5)).toBe('bg-amber-300'); // Same as index 0
    expect(getConfettiColor('mythic', 6)).toBe('bg-white/70'); // Same as index 1
  });
});

describe('getCardBorderClass', () => {
  it('handles null input', () => {
    expect(getCardBorderClass(null)).toBe('border-white/10 shadow-black/20');
  });

  it('handles undefined input', () => {
    expect(getCardBorderClass(undefined)).toBe('border-white/10 shadow-black/20');
  });

  it('handles tier string', () => {
    expect(getCardBorderClass('mythic')).toContain('amber');
    expect(getCardBorderClass('grail')).toContain('violet');
    expect(getCardBorderClass('rare')).toContain('blue');
    expect(getCardBorderClass('icon')).toContain('white');
  });

  it('handles tier with golden flag', () => {
    expect(getCardBorderClass('icon', true)).toContain('amber-400/60');
  });

  it('handles card object', () => {
    expect(getCardBorderClass({ rarity_score: 96 })).toContain('amber');
    expect(getCardBorderClass({ rarity_score: 30, is_golden: true })).toContain('amber-400/60');
  });
});

describe('getRarityLabel', () => {
  it('returns uppercase labels', () => {
    expect(getRarityLabel('mythic')).toBe('MYTHIC');
    expect(getRarityLabel('grail')).toBe('GRAIL');
    expect(getRarityLabel('rare')).toBe('RARE');
    expect(getRarityLabel('icon')).toBe('ICON');
  });
});

describe('getBandTier', () => {
  it('converts band to tier', () => {
    expect(getBandTier('MYTHIC')).toBe('mythic');
    expect(getBandTier('GRAIL')).toBe('grail');
    expect(getBandTier('RARE')).toBe('rare');
    expect(getBandTier('ICON')).toBe('icon');
  });

  it('handles lowercase input', () => {
    expect(getBandTier('mythic')).toBe('mythic');
  });

  it('handles null/undefined', () => {
    expect(getBandTier(null)).toBe('icon');
    expect(getBandTier(undefined)).toBe('icon');
  });

  it('handles unknown input', () => {
    expect(getBandTier('UNKNOWN')).toBe('icon');
  });
});
