/**
 * @fileoverview Embedded Perks Component
 * Displays the perks that come with every card
 */

import { memo } from 'react';
import { Sparkles, Shield, Gift, CheckCircle2, Store } from 'lucide-react';

const PERK_ICONS = {
  Shield,
  Gift,
  CheckCircle2,
  Store,
} as const;

const EMBEDDED_PERKS = [
  { icon: 'Shield' as const, label: 'Authentication Verified' },
  { icon: 'Gift' as const, label: 'Rewards Enabled' },
  { icon: 'CheckCircle2' as const, label: 'Insurance Protected' },
  { icon: 'Store' as const, label: 'Trusted Resale Ready' },
];

export const EmbeddedPerks = memo(() => {
  return (
    <div className="rounded-2xl p-4 border-4 border-white shadow-sticker bg-card/90 transform rotate-[0.5deg]">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-cyan-400" strokeWidth={2.5} />
        <span className="text-foreground font-display text-sm">PERKS INCLUDED</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {EMBEDDED_PERKS.map((perk, i) => {
          const IconComponent = PERK_ICONS[perk.icon];
          return (
            <div key={i} className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border-2 border-white/20">
              <IconComponent className="w-4 h-4 text-hype-green flex-shrink-0" strokeWidth={2.5} />
              <span className="text-foreground/80 text-xs font-medium">{perk.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
});

EmbeddedPerks.displayName = 'EmbeddedPerks';
