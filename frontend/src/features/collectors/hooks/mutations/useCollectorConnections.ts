import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { CollectorListItem, CollectorFilter } from '../../types';
import { COLLECTOR_QUERY_KEYS } from '../data/useCollectorProfile';
import { toast } from 'sonner';

interface FollowResponse {
  success?: boolean;
  status?: string;
  error?: string;
}

export function useCollectorConnections(filter: CollectorFilter = 'all') {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: COLLECTOR_QUERY_KEYS.list(filter),
    queryFn: async (): Promise<CollectorListItem[]> => {
      const { data, error } = await supabase.rpc('get_collectors_list', {
        p_filter: filter,
        p_limit: 50,
      });
      
      if (error) throw error;
      
      return (data as unknown as CollectorListItem[]) || [];
    },
    // Public collectors list should be browseable without login.
    enabled: true,
    staleTime: 30_000,
  });

  const followMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!user) throw new Error('Sign in to follow collectors');

      const { data, error } = await supabase.rpc('follow_collector', {
        p_target_user_id: targetUserId,
      });
      
      if (error) throw error;
      
      const result = data as unknown as FollowResponse;
      if (result?.error) throw new Error(result.error);
      
      return result;
    },
    onSuccess: (data) => {
      toast.success(data?.status === 'MUTUAL' ? 'You are now mutual friends!' : 'Now following');
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['collector'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to follow');
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!user) throw new Error('Sign in to unfollow collectors');

      const { data, error } = await supabase.rpc('unfollow_collector', {
        p_target_user_id: targetUserId,
      });
      
      if (error) throw error;
      
      const result = data as unknown as FollowResponse;
      if (result?.error) throw new Error(result.error);
      
      return result;
    },
    onSuccess: () => {
      toast.success('Unfollowed');
      queryClient.invalidateQueries({ queryKey: ['collector'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to unfollow');
    },
  });

  return {
    collectors: listQuery.data || [],
    isLoading: listQuery.isLoading,
    error: listQuery.error,
    follow: followMutation.mutate,
    unfollow: unfollowMutation.mutate,
    isFollowing: followMutation.isPending,
    isUnfollowing: unfollowMutation.isPending,
  };
}
