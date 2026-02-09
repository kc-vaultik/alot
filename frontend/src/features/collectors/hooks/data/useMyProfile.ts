import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { CollectorProfile } from '../../types';
import { COLLECTOR_QUERY_KEYS } from './useCollectorProfile';
import { toast } from 'sonner';

interface UpdateProfileData {
  username?: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  is_public?: boolean;
}

export function useMyProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: COLLECTOR_QUERY_KEYS.myProfile,
    queryFn: async (): Promise<CollectorProfile | null> => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase.rpc('get_collector_profile', {
        p_user_id: user.id,
      });
      
      if (error) throw error;
      
      const result = data as unknown as CollectorProfile & { error?: string };
      if (result?.error) {
        // Profile doesn't exist yet
        if (result.error === 'Profile not found') {
          return null;
        }
        throw new Error(result.error);
      }
      
      return result;
    },
    enabled: !!user?.id,
    staleTime: 30_000,
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: UpdateProfileData) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('collector_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onMutate: async (updates) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: COLLECTOR_QUERY_KEYS.myProfile });
      await queryClient.cancelQueries({ queryKey: ['collector', 'profile', user?.id] });
      
      // Snapshot the previous value
      const previousProfile = queryClient.getQueryData<CollectorProfile | null>(COLLECTOR_QUERY_KEYS.myProfile);
      
      // Optimistically update to the new value
      if (previousProfile) {
        const optimisticProfile: CollectorProfile = {
          ...previousProfile,
          ...updates,
        };
        queryClient.setQueryData<CollectorProfile>(COLLECTOR_QUERY_KEYS.myProfile, optimisticProfile);
      }
      
      return { previousProfile };
    },
    onError: (error: Error, _updates, context) => {
      // Rollback on error
      if (context?.previousProfile !== undefined) {
        queryClient.setQueryData(COLLECTOR_QUERY_KEYS.myProfile, context.previousProfile);
      }
      toast.error(error.message || 'Failed to update profile');
    },
    onSuccess: () => {
      toast.success('Profile updated');
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: COLLECTOR_QUERY_KEYS.myProfile });
      queryClient.invalidateQueries({ queryKey: ['collector', 'profile', user?.id] });
    },
  });

  const createProfileMutation = useMutation({
    mutationFn: async (profileData: { username: string; display_name?: string }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('collector_profiles')
        .insert({
          user_id: user.id,
          username: profileData.username,
          display_name: profileData.display_name || profileData.username,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Profile created');
      queryClient.invalidateQueries({ queryKey: COLLECTOR_QUERY_KEYS.myProfile });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create profile');
    },
  });

  return {
    profile: profileQuery.data,
    isLoading: profileQuery.isLoading,
    error: profileQuery.error,
    updateProfile: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    createProfile: createProfileMutation.mutate,
    isCreating: createProfileMutation.isPending,
  };
}
