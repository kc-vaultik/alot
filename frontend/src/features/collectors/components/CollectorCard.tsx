import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, UserMinus, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CollectorScoreBadge } from './CollectorScoreBadge';
import type { CollectorListItem } from '../types';

interface CollectorCardProps {
  collector: CollectorListItem;
  isFollowing?: boolean;
  isMutual?: boolean;
  onFollow?: (userId: string) => void;
  onUnfollow?: (userId: string) => void;
  isLoading?: boolean;
  className?: string;
}

export const CollectorCard = memo(function CollectorCard({
  collector,
  isFollowing = false,
  isMutual = false,
  onFollow,
  onUnfollow,
  isLoading = false,
  className,
}: CollectorCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/collector/${collector.user_id}`);
  };

  const handleFollowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFollowing && onUnfollow) {
      onUnfollow(collector.user_id);
    } else if (!isFollowing && onFollow) {
      onFollow(collector.user_id);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'flex items-center justify-between p-3 sm:p-4 rounded-xl',
        'bg-white/5 border border-white/5',
        'hover:bg-white/10 hover:border-white/10 transition-all cursor-pointer',
        'backdrop-blur-sm',
        className
      )}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Avatar with Score Badge */}
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-600/20 flex items-center justify-center overflow-hidden border border-white/10">
            {collector.avatar_url ? (
              <img
                src={collector.avatar_url}
                alt={collector.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white/80 font-light text-base sm:text-lg">
                {(collector.display_name || collector.username).charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          {/* Score badge overlay */}
          <div className="absolute -bottom-1 -right-1">
            <CollectorScoreBadge score={collector.score} size="sm" />
          </div>
        </div>

        {/* Info */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-white font-light text-sm sm:text-base truncate">
              {collector.display_name || collector.username}
            </p>
            {isMutual && (
              <Sparkles className="w-3 h-3 text-violet-400 flex-shrink-0" />
            )}
          </div>
          <p className="text-white/50 text-xs font-light">
            @{collector.username} · {collector.card_count} cards
          </p>
        </div>
      </div>

      {/* Follow/Unfollow Button */}
      {(onFollow || onUnfollow) && (
        <button
          onClick={handleFollowClick}
          disabled={isLoading}
          className={cn(
            'flex items-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full',
            'text-xs font-light flex-shrink-0 transition-all border',
            isFollowing
              ? 'bg-white/5 border-white/10 text-white/60 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400'
              : 'bg-gradient-to-r from-violet-500/20 to-purple-600/20 border-violet-500/30 text-violet-400 hover:from-violet-500/30 hover:to-purple-600/30',
            isLoading && 'opacity-50 cursor-not-allowed'
          )}
        >
          {isFollowing ? (
            <>
              <UserMinus className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Unfollow</span>
            </>
          ) : (
            <>
              <UserPlus className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Follow</span>
            </>
          )}
        </button>
      )}
    </div>
  );
});
