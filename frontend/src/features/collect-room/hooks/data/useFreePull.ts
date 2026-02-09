/**
 * @fileoverview Hooks for free pull status and claiming.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/utils/logger';
import { QUERY_KEYS, STALE_TIMES, POLLING } from '../../constants';
import { getNextMidnight, getTodayISODate } from '../../utils/dateUtils';
import type { FreePullStatus } from '../../types';

/**
 * Fetches the current user's free pull status.
 * Includes whether they can claim, and when the next pull is available.
 */
export function useFreePullStatus() {
  const { user, loading: authLoading } = useAuth();

  return useQuery({
    queryKey: [QUERY_KEYS.FREE_PULL, user?.id],
    queryFn: async (): Promise<FreePullStatus> => {
      if (!user) return { canClaim: false, isLoggedIn: false, nextAvailable: null };

      const today = getTodayISODate();
      const { data, error } = await supabase
        .from('daily_free_pulls')
        .select('*')
        .eq('user_id', user.id)
        .eq('pull_date', today)
        .maybeSingle();

      if (error) {
        logger.error('useFreePullStatus error:', error);
      }

      return {
        canClaim: !data,
        isLoggedIn: true,
        lastClaim: data?.created_at ?? null,
        nextAvailable: data ? getNextMidnight() : null,
      };
    },
    enabled: !authLoading && !!user,
    staleTime: STALE_TIMES.FREE_PULL,
    refetchInterval: POLLING.FREE_PULL_REFETCH_INTERVAL,
  });
}

/**
 * Mutation hook to claim the daily free pull.
 * Invokes the mystery-card-free-pull edge function.
 */
export function useClaimFreePull() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (): Promise<{ success: boolean; reveal: unknown }> => {
      const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();

      if (refreshError) {
        logger.error('Session refresh failed:', refreshError.message);
        throw new Error('Session expired. Please log in again.');
      }

      if (!session) {
        throw new Error('Must be logged in to claim free pull');
      }

      const response = await supabase.functions.invoke('mystery-card-free-pull');

      if (response.error) {
        logger.error('Edge function error:', response.error);
        throw new Error(response.error.message || 'Failed to claim free pull');
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.FREE_PULL] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.REVEALS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CREDITS] });
    },
    onError: (error: Error) => {
      logger.error('Free pull failed:', error);
      toast.error('Free pull failed', error.message);
    },
    retry: 1,
    retryDelay: 1000,
  });
}
