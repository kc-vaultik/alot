
import { Switch } from '@/components/ui/switch';
import { 
  Sparkles, 
  Volume2, 
  Vibrate, 
  Zap,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface PreferenceItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

const PreferenceItem = ({ icon, title, description, enabled, onToggle }: PreferenceItemProps) => (
  <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-sm text-white/90">{title}</p>
        <p className="text-xs text-white/40">{description}</p>
      </div>
    </div>
    <Switch checked={enabled} onCheckedChange={onToggle} />
  </div>
);

const DEFAULT_PREFERENCES = {
  animations: true,
  sounds: true,
  haptics: false,
  autoReveal: false,
  reducedMotion: false,
};

export const AppPreferences = () => {
  const [preferences, setPreferences] = useLocalStorage('app-preferences', DEFAULT_PREFERENCES);

  const handleToggle = (key: keyof typeof DEFAULT_PREFERENCES) => (enabled: boolean) => {
    setPreferences(prev => ({ ...prev, [key]: enabled }));
    toast.success('Preference updated');
  };

  return (
    <div className="space-y-1">
      <PreferenceItem
        icon={<Sparkles className="w-4 h-4 text-cyan-400" />}
        title="Animations"
        description="Enable card and UI animations"
        enabled={preferences.animations}
        onToggle={handleToggle('animations')}
      />
      <PreferenceItem
        icon={<Volume2 className="w-4 h-4 text-violet-400" />}
        title="Sound Effects"
        description="Play sounds for reveals and wins"
        enabled={preferences.sounds}
        onToggle={handleToggle('sounds')}
      />
      <PreferenceItem
        icon={<Vibrate className="w-4 h-4 text-orange-400" />}
        title="Haptic Feedback"
        description="Vibration on mobile devices"
        enabled={preferences.haptics}
        onToggle={handleToggle('haptics')}
      />
      <PreferenceItem
        icon={<Zap className="w-4 h-4 text-yellow-400" />}
        title="Auto-Reveal Cards"
        description="Automatically reveal new cards"
        enabled={preferences.autoReveal}
        onToggle={handleToggle('autoReveal')}
      />
      <PreferenceItem
        icon={<Eye className="w-4 h-4 text-green-400" />}
        title="Reduced Motion"
        description="Minimize animations for accessibility"
        enabled={preferences.reducedMotion}
        onToggle={handleToggle('reducedMotion')}
      />
    </div>
  );
};
