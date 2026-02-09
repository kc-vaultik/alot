
import { Switch } from '@/components/ui/switch';
import { LucideIcon } from 'lucide-react';

interface NotificationCategoryProps {
  icon: LucideIcon;
  title: string;
  description: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  disabled?: boolean;
}

export const NotificationCategory = ({ 
  icon: Icon, 
  title, 
  description, 
  enabled, 
  onToggle,
  disabled 
}: NotificationCategoryProps) => {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-3">
        <Icon className="w-4 h-4 text-white/40" />
        <div>
          <p className="text-sm text-white/90">{title}</p>
          <p className="text-xs text-white/40">{description}</p>
        </div>
      </div>
      <Switch 
        checked={enabled} 
        onCheckedChange={onToggle}
        disabled={disabled}
        className="scale-90"
      />
    </div>
  );
};
