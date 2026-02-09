
import { Switch } from '@/components/ui/switch';
import { LucideIcon } from 'lucide-react';

interface MasterToggleProps {
  icon: LucideIcon;
  title: string;
  description: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  disabled?: boolean;
}

export const MasterToggle = ({ 
  icon: Icon, 
  title, 
  description, 
  enabled, 
  onToggle,
  disabled 
}: MasterToggleProps) => {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center">
          <Icon className="w-5 h-5 text-white/70" />
        </div>
        <div>
          <p className="text-sm font-medium text-white">{title}</p>
          <p className="text-xs text-white/50">{description}</p>
        </div>
      </div>
      <Switch 
        checked={enabled} 
        onCheckedChange={onToggle}
        disabled={disabled}
      />
    </div>
  );
};
