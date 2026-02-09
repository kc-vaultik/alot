/**
 * @fileoverview User's entry card with score and improvement tips - "Digital Vandalism" style
 */

import { memo } from 'react';
import { Lightbulb, Zap } from 'lucide-react';
import { CompetitivenessBadge } from '../shared/CompetitivenessBadge';
import type { LeaderboardEntry, CompetitivenessBand } from '../../types';

interface MyEntryCardProps {
  entry: LeaderboardEntry;
  competitivenessBand?: CompetitivenessBand;
  improvementTips: string[];
}

export const MyEntryCard = memo(function MyEntryCard({
  entry,
  competitivenessBand,
  improvementTips,
}: MyEntryCardProps) {
  return (
    <div className="p-4 rounded-2xl bg-zinc-900/90 border-4 border-white shadow-sticker mb-4 transform rotate-1">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" strokeWidth={2.5} />
          <span className="font-display text-primary">YOUR SCORE</span>
        </div>
        {competitivenessBand && (
          <CompetitivenessBadge
            band={competitivenessBand}
            score={entry.priority_score || undefined}
          />
        )}
      </div>

      {/* Priority Score display */}
      <div className="flex items-center justify-between mb-3 p-3 rounded-xl bg-primary/10 border-2 border-primary/30">
        <span className="text-sm text-white/60">Your Priority Score</span>
        <span className="font-display text-3xl text-white">
          {entry.priority_score?.toFixed(1) || '—'}
        </span>
      </div>

      {/* Competitiveness display */}
      {competitivenessBand && (
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-white/10">
          <span className="text-sm text-white/60">Competitiveness</span>
          <span
            className={`font-display text-sm px-3 py-1 rounded-full border-2 ${
              competitivenessBand === 'High'
                ? 'bg-hype-green/20 text-hype-green border-hype-green/50'
                : competitivenessBand === 'Medium'
                ? 'bg-amber-500/20 text-amber-400 border-amber-400/50'
                : 'bg-red-500/20 text-red-400 border-red-400/50'
            }`}
          >
            {competitivenessBand.toUpperCase()}
          </span>
        </div>
      )}

      {/* Card info */}
      <div className="flex items-center gap-3 mb-3 p-3 rounded-xl bg-white/5 border-2 border-white/10">
        <div className="flex-1">
          <div className="text-white font-medium">
            {entry.stake_snapshot.product_name}
          </div>
          <div className="text-xs text-white/50 font-display">{entry.stake_snapshot.band}</div>
        </div>
      </div>

      {/* Improvement tips - sticker badges */}
      {improvementTips.length > 0 && (
        <div className="pt-3 border-t border-white/10">
          <div className="flex items-center gap-2 text-xs text-amber-400 mb-3">
            <Lightbulb className="w-4 h-4" strokeWidth={2.5} />
            <span className="font-display">BOOST IT BY:</span>
          </div>
          <ul className="space-y-2">
            {improvementTips.map((tip, i) => (
              <li
                key={i}
                className="text-xs text-white/80 px-3 py-2 rounded-xl bg-amber-500/10 border-2 border-amber-400/30"
              >
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
});
