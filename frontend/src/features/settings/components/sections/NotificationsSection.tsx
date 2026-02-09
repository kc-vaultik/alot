import { useMemo } from 'react';
import { SettingsLayout } from '../SettingsLayout';
import { SettingsSection } from '../SettingsSection';
import { MasterToggle } from '../notifications/MasterToggle';
import { NotificationCategory } from '../notifications/NotificationCategory';
import { useUserSettings } from '../../hooks/useUserSettings';
import { 
  Mail, 
  Bell, 
  Smartphone,
  Gift,
  ArrowLeftRight,
  Swords,
  DoorOpen,
  Trophy,
  Megaphone,
  Loader2
} from 'lucide-react';

export const NotificationsSection = () => {
  const { settings, isLoading, updateSettings, isUpdating } = useUserSettings();

  // Stable toggle handlers using useMemo
  const toggleHandlers = useMemo(() => ({
    email_enabled: (enabled: boolean) => updateSettings({ email_enabled: enabled }),
    push_enabled: (enabled: boolean) => updateSettings({ push_enabled: enabled }),
    in_app_enabled: (enabled: boolean) => updateSettings({ in_app_enabled: enabled }),
    notify_gifts: (enabled: boolean) => updateSettings({ notify_gifts: enabled }),
    notify_swaps: (enabled: boolean) => updateSettings({ notify_swaps: enabled }),
    notify_battles: (enabled: boolean) => updateSettings({ notify_battles: enabled }),
    notify_rooms: (enabled: boolean) => updateSettings({ notify_rooms: enabled }),
    notify_rewards: (enabled: boolean) => updateSettings({ notify_rewards: enabled }),
    notify_marketing: (enabled: boolean) => updateSettings({ notify_marketing: enabled }),
  }), [updateSettings]);
  if (isLoading) {
    return (
      <SettingsLayout title="Notifications">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-white/50" />
        </div>
      </SettingsLayout>
    );
  }

  return (
    <SettingsLayout title="Notifications">
      <SettingsSection 
        title="Delivery Methods"
        description="Choose how you want to receive notifications"
      >
        <div className="space-y-3">
          <MasterToggle
            icon={Mail}
            title="Email Notifications"
            description="Receive updates via email"
            enabled={settings.email_enabled}
            onToggle={toggleHandlers.email_enabled}
            disabled={isUpdating}
          />
          <MasterToggle
            icon={Smartphone}
            title="Push Notifications"
            description="Get alerts on your device"
            enabled={settings.push_enabled}
            onToggle={toggleHandlers.push_enabled}
            disabled={isUpdating}
          />
          <MasterToggle
            icon={Bell}
            title="In-App Notifications"
            description="See notifications within the app"
            enabled={settings.in_app_enabled}
            onToggle={toggleHandlers.in_app_enabled}
            disabled={isUpdating}
          />
        </div>
      </SettingsSection>

      <SettingsSection 
        title="Notification Categories"
        description="Fine-tune which events trigger notifications"
      >
        <div className="space-y-1">
          <NotificationCategory
            icon={Gift}
            title="Gifts"
            description="When you receive or send gifts"
            enabled={settings.notify_gifts}
            onToggle={toggleHandlers.notify_gifts}
            disabled={isUpdating}
          />
          <NotificationCategory
            icon={ArrowLeftRight}
            title="Swaps"
            description="Swap offers and completions"
            enabled={settings.notify_swaps}
            onToggle={toggleHandlers.notify_swaps}
            disabled={isUpdating}
          />
          <NotificationCategory
            icon={Swords}
            title="Battles"
            description="Battle invites and results"
            enabled={settings.notify_battles}
            onToggle={toggleHandlers.notify_battles}
            disabled={isUpdating}
          />
          <NotificationCategory
            icon={DoorOpen}
            title="Rooms"
            description="Room events and draws"
            enabled={settings.notify_rooms}
            onToggle={toggleHandlers.notify_rooms}
            disabled={isUpdating}
          />
          <NotificationCategory
            icon={Trophy}
            title="Rewards"
            description="Earned rewards and achievements"
            enabled={settings.notify_rewards}
            onToggle={toggleHandlers.notify_rewards}
            disabled={isUpdating}
          />
          <NotificationCategory
            icon={Megaphone}
            title="Marketing"
            description="Promotions and announcements"
            enabled={settings.notify_marketing}
            onToggle={toggleHandlers.notify_marketing}
            disabled={isUpdating}
          />
        </div>
      </SettingsSection>
    </SettingsLayout>
  );
};
