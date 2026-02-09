import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface UserNotificationSettings {
  id: string;
  user_id: string;
  email_enabled: boolean;
  push_enabled: boolean;
  in_app_enabled: boolean;
  notify_gifts: boolean;
  notify_swaps: boolean;
  notify_battles: boolean;
  notify_rooms: boolean;
  notify_rewards: boolean;
  notify_marketing: boolean;
  created_at: string;
  updated_at: string;
}

const DEFAULT_SETTINGS: Omit<UserNotificationSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  email_enabled: true,
  push_enabled: false,
  in_app_enabled: true,
  notify_gifts: true,
  notify_swaps: true,
  notify_battles: true,
  notify_rooms: true,
  notify_rewards: true,
  notify_marketing: false,
};

export const useUserSettings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['user-notification-settings', user?.id],
    queryFn: async (): Promise<UserNotificationSettings | null> => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('user_notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const updateSettings = useMutation({
    mutationFn: async (updates: Partial<Omit<UserNotificationSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      // Check if settings exist
      const { data: existing } = await supabase
        .from('user_notification_settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (existing) {
        // Update existing settings
        const { data, error } = await supabase
          .from('user_notification_settings')
          .update(updates)
          .eq('user_id', user.id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        // Insert new settings with defaults
        const { data, error } = await supabase
          .from('user_notification_settings')
          .insert({ 
            user_id: user.id, 
            ...DEFAULT_SETTINGS,
            ...updates 
          })
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onMutate: async (updates) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['user-notification-settings', user?.id] });
      
      // Snapshot the previous value
      const previousSettings = queryClient.getQueryData(['user-notification-settings', user?.id]);
      
      // Optimistically update to the new value
      queryClient.setQueryData(['user-notification-settings', user?.id], (old: UserNotificationSettings | null) => {
        if (old) {
          return { ...old, ...updates };
        }
        // If no previous data, create optimistic settings with defaults
        return {
          id: 'optimistic',
          user_id: user?.id || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...DEFAULT_SETTINGS,
          ...updates,
        } as UserNotificationSettings;
      });
      
      return { previousSettings };
    },
    onError: (error, _updates, context) => {
      // Rollback on error
      if (context?.previousSettings !== undefined) {
        queryClient.setQueryData(['user-notification-settings', user?.id], context.previousSettings);
      }
      toast.error('Failed to update settings');
      console.error('Settings update error:', error);
    },
    onSuccess: () => {
      toast.success('Settings updated');
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['user-notification-settings', user?.id] });
    },
  });

  // Get effective settings (defaults if none saved)
  const effectiveSettings: Omit<UserNotificationSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'> = 
    settings ?? DEFAULT_SETTINGS;

  return {
    settings: effectiveSettings,
    rawSettings: settings,
    isLoading,
    error,
    updateSettings: updateSettings.mutate,
    updateSettingsAsync: updateSettings.mutateAsync,
    isUpdating: updateSettings.isPending,
  };
};
