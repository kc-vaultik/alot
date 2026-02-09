import { memo } from 'react';
import { Monitor, Smartphone, Globe, Clock, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SessionInfo {
  id: string;
  device_type: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  browser?: string;
  os?: string;
  ip_address?: string;
  location?: string;
  last_active_at: string;
  created_at: string;
  is_current: boolean;
}

interface SessionCardProps {
  session: SessionInfo;
  onRevoke?: (id: string) => void;
  isRevoking?: boolean;
}

const deviceIcons = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Smartphone,
  unknown: Globe,
};

export const SessionCard = memo<SessionCardProps>(({ session, onRevoke, isRevoking }) => {
  const DeviceIcon = deviceIcons[session.device_type];

  return (
    <div
      className={cn(
        'relative rounded-xl border p-4',
        'bg-zinc-900/50',
        session.is_current 
          ? 'border-green-500/30 bg-green-500/5' 
          : 'border-white/10'
      )}
    >
      <div className="flex items-start gap-4">
        {/* Device Icon */}
        <div className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
          session.is_current ? 'bg-green-500/10' : 'bg-white/5'
        )}>
          <DeviceIcon className={cn(
            'w-6 h-6',
            session.is_current ? 'text-green-400' : 'text-white/50'
          )} />
        </div>

        {/* Session Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-white">
              {session.browser || 'Unknown Browser'}
              {session.os && ` on ${session.os}`}
            </h3>
            {session.is_current && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-xs">
                <CheckCircle className="w-3 h-3 text-green-400" />
                <span className="text-green-400">Current</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4 text-white/40 text-sm">
            {session.ip_address && (
              <span className="flex items-center gap-1">
                <Globe className="w-3 h-3" />
                {session.ip_address}
              </span>
            )}
            {session.location && (
              <span>{session.location}</span>
            )}
          </div>

          <div className="flex items-center gap-1 mt-2 text-white/30 text-xs">
            <Clock className="w-3 h-3" />
            <span>
              Last active {formatDistanceToNow(new Date(session.last_active_at), { addSuffix: true })}
            </span>
          </div>
        </div>

        {/* Revoke Button */}
        {!session.is_current && onRevoke && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRevoke(session.id)}
            disabled={isRevoking}
            className="text-white/40 hover:text-red-400 hover:bg-red-500/10 flex-shrink-0"
          >
            Revoke
          </Button>
        )}
      </div>
    </div>
  );
});

SessionCard.displayName = 'SessionCard';
