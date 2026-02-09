import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CollectorProfile } from '../../types';

export const COLLECTOR_QUERY_KEYS = {
  profile: (userId: string) => ['collector', 'profile', userId] as const,
  search: (query: string) => ['collector', 'search', query] as const,
  list: (filter: string) => ['collector', 'list', filter] as const,
  collection: (userId: string) => ['collector', 'collection', userId] as const,
  myProfile: ['collector', 'my-profile'] as const,
};

export function useCollectorProfile(userId: string | undefined) {
  return useQuery({
    queryKey: COLLECTOR_QUERY_KEYS.profile(userId || ''),
    queryFn: async (): Promise<CollectorProfile | null> => {
      if (!userId) return null;
      
      const { data, error } = await supabase.rpc('get_collector_profile', {
        p_user_id: userId,
      });
      
      if (error) throw error;
      
      const result = data as unknown as CollectorProfile & { error?: string };
      if (result?.error) throw new Error(result.error);
      
      return result;
    },
    enabled: !!userId,
    staleTime: 30_000,
  });
}
