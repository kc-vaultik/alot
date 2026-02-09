import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';

const THEME_OPTIONS = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
] as const;

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex gap-2">
      {THEME_OPTIONS.map((option) => {
        const Icon = option.icon;
        const isSelected = theme === option.value;
        
        return (
          <button
            key={option.value}
            onClick={() => setTheme(option.value)}
            className={cn(
              'relative flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border overflow-hidden',
              'transition-colors duration-200',
              isSelected
                ? 'border-cyan-500/50 text-white'
                : 'border-white/10 text-white/60 hover:text-white/80'
            )}
          >
            {/* Background layers with opacity transitions */}
            <span className={cn(
              'absolute inset-0 bg-white/5 transition-opacity duration-200',
              isSelected ? 'opacity-0' : 'opacity-100'
            )} />
            <span className={cn(
              'absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-violet-500/20 transition-opacity duration-200',
              isSelected ? 'opacity-100' : 'opacity-0'
            )} />
            {/* Hover overlay for non-selected */}
            <span className={cn(
              'absolute inset-0 bg-white/5 transition-opacity duration-200',
              !isSelected ? 'opacity-0 hover:opacity-100' : 'opacity-0'
            )} />
            {/* Content */}
            <span className="relative z-10 flex items-center gap-2">
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{option.label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
};
