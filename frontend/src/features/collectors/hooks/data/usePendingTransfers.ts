/**
 * @fileoverview Hook for fetching pending transfers with a specific collector
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { COLLECTOR_QUERY_KEYS } from './useCollectorProfile';

interface PendingTransfersData {
  incoming_gifts: number;
  incoming_swaps: number;
  outgoing_gifts: number;
  outgoing_swaps: number;
  total_incoming: number;
  total_outgoing: number;
}

export function usePendingTransfers(collectorUserId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: [...COLLECTOR_QUERY_KEYS.profile(collectorUserId || ''), 'transfers'],
    queryFn: async (): Promise<PendingTransfersData> => {
      if (!collectorUserId) {
        return {
          incoming_gifts: 0,
          incoming_swaps: 0,
          outgoing_gifts: 0,
          outgoing_swaps: 0,
          total_incoming: 0,
          total_outgoing: 0,
        };
      }

      const { data, error } = await supabase.rpc('get_pending_transfers_with_collector', {
        p_collector_user_id: collectorUserId,
      });

      if (error) throw error;

      return (data as unknown as PendingTransfersData) || {
        incoming_gifts: 0,
        incoming_swaps: 0,
        outgoing_gifts: 0,
        outgoing_swaps: 0,
        total_incoming: 0,
        total_outgoing: 0,
      };
    },
    enabled: !!user && !!collectorUserId && collectorUserId !== user.id,
    staleTime: 30_000,
  });
}
