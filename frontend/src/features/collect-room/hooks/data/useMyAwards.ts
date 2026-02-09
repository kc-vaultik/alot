/**
 * @fileoverview Hook for fetching the current user's awards.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { QUERY_KEYS, STALE_TIMES } from '../../constants';
import type { Award } from '../../types';

/**
 * Fetches the current user's awards.
 * Awards are ordered by creation date, most recent first.
 */
export function useMyAwards() {
  const { user, loading: authLoading } = useAuth();

  return useQuery({
    queryKey: [QUERY_KEYS.AWARDS, user?.id],
    queryFn: async (): Promise<Award[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('awards')
        .select(`*, product_classes (*)`)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as Award[];
    },
    enabled: !authLoading && !!user,
    staleTime: STALE_TIMES.AWARDS,
  });
}

/**
 * Returns a function to invalidate awards queries.
 */
export function useInvalidateAwards() {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.AWARDS] });
  };
}
