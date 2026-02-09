/**
 * @fileoverview Profile Box Component - "Digital Vandalism" Style
 * @description User profile display with sticker aesthetic
 */

import { useNavigate } from 'react-router-dom';
import { User, Settings, LogOut } from 'lucide-react';

interface ProfileBoxProps {
  displayName: string;
  email?: string | null;
  onLogout: () => void;
}

export function ProfileBox({ displayName, email, onLogout }: ProfileBoxProps) {
  const navigate = useNavigate();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 mb-4 sm:mb-6">
      {/* Sticker-style container with tilt */}
      <div className="rounded-2xl bg-card/90 backdrop-blur-sm p-3 sm:p-4 border-4 border-white shadow-sticker transform -rotate-[0.5deg]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            {/* Avatar with hype gradient */}
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-hype-pink to-hype-blue flex items-center justify-center flex-shrink-0 border-2 border-white shadow-md">
              <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <p className="text-foreground font-display text-base sm:text-lg truncate">{displayName}</p>
              <p className="text-muted-foreground text-[10px] sm:text-xs truncate font-medium">{email || 'No email'}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <button 
              onClick={() => navigate('/settings')}
              className="p-2 sm:p-2.5 rounded-xl bg-secondary border-2 border-border hover:bg-secondary/80 transition-colors"
            >
              <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" strokeWidth={2.5} />
            </button>
            <button 
              onClick={onLogout}
              className="p-2 sm:p-2.5 rounded-xl bg-secondary border-2 border-border hover:bg-destructive/20 hover:border-destructive/50 transition-colors"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
