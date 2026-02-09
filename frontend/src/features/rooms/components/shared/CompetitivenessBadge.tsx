/**
 * @fileoverview Badge showing competitiveness band (Low/Medium/High)
 */

import { memo } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { CompetitivenessBand } from '../../types';

interface CompetitivenessBadgeProps {
  band: CompetitivenessBand;
  score?: number;
  showScore?: boolean;
}

const BAND_CONFIG = {
  High: {
    color: 'bg-green-500/20 text-green-400 border-green-400/30',
    icon: TrendingUp,
    description: 'Your score is competitive! You have a good chance of ranking well.',
  },
  Medium: {
    color: 'bg-amber-500/20 text-amber-400 border-amber-400/30',
    icon: Minus,
    description: 'Your score is average. Consider boosting your credits or points.',
  },
  Low: {
    color: 'bg-red-500/20 text-red-400 border-red-400/30',
    icon: TrendingDown,
    description: 'Your score needs improvement. Earn more credits or use a higher-value card.',
  },
};

export const CompetitivenessBadge = memo(function CompetitivenessBadge({
  band,
  score,
  showScore = false,
}: CompetitivenessBadgeProps) {
  const config = BAND_CONFIG[band];
  const Icon = config.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`
              inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
              border cursor-help transition-all hover:scale-105
              ${config.color}
            `}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{band}</span>
            {showScore && score !== undefined && (
              <span className="text-white/60">({score.toFixed(1)})</span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-xs">{config.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});
