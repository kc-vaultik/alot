/**
 * @fileoverview Hook for purchasing lot entries with Stash Credits.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ROOM_QUERY_KEYS } from '../../constants';
import { QUERY_KEYS } from '@/features/collect-room/constants';

interface BuyEntriesWithCreditsParams {
  roomId: string;
  creditsToSpend: number;
}

interface BuyEntriesWithCreditsResponse {
  success: boolean;
  error?: string;
  entry_id?: string;
  credits_spent?: number;
  entries_granted?: number;
  new_total_entries?: number;
  remaining_credits?: number;
}

/**
 * Mutation hook for buying lot entries with Stash Credits.
 * Conversion rate: 100 Credits = 1 Entry
 */
export function useBuyEntriesWithCredits() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roomId, creditsToSpend }: BuyEntriesWithCreditsParams): Promise<BuyEntriesWithCreditsResponse> => {
      const { data, error } = await supabase.rpc('buy_entries_with_credits', {
        p_room_id: roomId,
        p_credits_to_spend: creditsToSpend,
      });

      if (error) throw error;
      
      const result = data as unknown as BuyEntriesWithCreditsResponse;
      if (!result.success) {
        throw new Error(result.error || 'Failed to purchase entries');
      }
      
      return result;
    },
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [ROOM_QUERY_KEYS.ACTIVE_ROOMS] });
      queryClient.invalidateQueries({ queryKey: [ROOM_QUERY_KEYS.ROOM] });
      queryClient.invalidateQueries({ queryKey: [ROOM_QUERY_KEYS.MY_ROOM_ENTRY] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CREDITS] });
      
      toast.success('Entries Purchased!', {
        description: `You now have ${data.new_total_entries} entries in this room`,
      });
    },
    onError: (error: Error) => {
      toast.error('Failed to purchase entries', { description: error.message });
    },
  });
}
