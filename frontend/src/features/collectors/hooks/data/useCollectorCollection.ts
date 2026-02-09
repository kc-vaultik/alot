import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CollectorCollection } from '../../types';
import { COLLECTOR_QUERY_KEYS } from './useCollectorProfile';

export function useCollectorCollection(userId: string | undefined) {
  return useQuery({
    queryKey: COLLECTOR_QUERY_KEYS.collection(userId || ''),
    queryFn: async (): Promise<CollectorCollection | null> => {
      if (!userId) return null;
      
      const { data, error } = await supabase.rpc('get_collector_collection', {
        p_user_id: userId,
      });
      
      if (error) throw error;
      
      const result = data as unknown as CollectorCollection & { error?: string };
      if (result?.error) throw new Error(result.error);
      
      return result;
    },
    enabled: !!userId,
    staleTime: 30_000,
  });
}
