import { memo } from 'react';
import { cn } from '@/lib/utils';

interface CollectorScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

type ScoreTier = 'bronze' | 'silver' | 'gold' | 'platinum';

function getScoreTier(score: number): ScoreTier {
  if (score <= 25) return 'bronze';
  if (score <= 50) return 'silver';
  if (score <= 75) return 'gold';
  return 'platinum';
}

const tierStyles: Record<ScoreTier, { gradient: string; border: string; glow: string; label: string }> = {
  bronze: {
    gradient: 'from-amber-700 via-amber-600 to-amber-500',
    border: 'border-amber-600/50',
    glow: 'shadow-amber-600/30',
    label: 'Bronze',
  },
  silver: {
    gradient: 'from-slate-400 via-slate-300 to-slate-200',
    border: 'border-slate-400/50',
    glow: 'shadow-slate-400/30',
    label: 'Silver',
  },
  gold: {
    gradient: 'from-yellow-500 via-amber-400 to-yellow-300',
    border: 'border-yellow-500/50',
    glow: 'shadow-yellow-500/30',
    label: 'Gold',
  },
  platinum: {
    gradient: 'from-cyan-400 via-violet-400 to-purple-500',
    border: 'border-violet-500/50',
    glow: 'shadow-violet-500/30',
    label: 'Platinum',
  },
};

const sizeStyles = {
  sm: {
    container: 'w-8 h-8',
    text: 'text-xs font-semibold',
    label: 'text-[10px]',
  },
  md: {
    container: 'w-12 h-12',
    text: 'text-sm font-bold',
    label: 'text-xs',
  },
  lg: {
    container: 'w-16 h-16',
    text: 'text-lg font-bold',
    label: 'text-sm',
  },
};

export const CollectorScoreBadge = memo(function CollectorScoreBadge({
  score,
  size = 'md',
  showLabel = false,
  className,
}: CollectorScoreBadgeProps) {
  const tier = getScoreTier(score);
  const tierStyle = tierStyles[tier];
  const sizeStyle = sizeStyles[size];

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      <div
        className={cn(
          'relative rounded-full flex items-center justify-center',
          'bg-gradient-to-br',
          tierStyle.gradient,
          'border-2',
          tierStyle.border,
          'shadow-lg',
          tierStyle.glow,
          sizeStyle.container
        )}
      >
        {/* Inner ring for depth */}
        <div className="absolute inset-1 rounded-full bg-black/20" />
        
        {/* Score number */}
        <span className={cn('relative z-10 text-white drop-shadow-md font-light', sizeStyle.text)}>
          {score}
        </span>
      </div>
      
      {showLabel && (
        <span className={cn('text-white/50 font-light', sizeStyle.label)}>
          {tierStyle.label}
        </span>
      )}
    </div>
  );
});

export { getScoreTier, type ScoreTier };
