/**
 * @fileoverview Hook for claiming room redemption.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ROOM_QUERY_KEYS } from '../../constants';
import type { ClaimRedemptionResponse } from '../../types';

/**
 * Mutation hook for claiming a room redemption (winner claims prize).
 */
export function useClaimRedemption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roomId: string): Promise<ClaimRedemptionResponse> => {
      const { data, error } = await supabase.rpc('claim_redemption', {
        p_room_id: roomId,
      });

      if (error) throw error;
      return data as unknown as ClaimRedemptionResponse;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [ROOM_QUERY_KEYS.ROOM] });
      queryClient.invalidateQueries({ queryKey: [ROOM_QUERY_KEYS.ROOM_LEADERBOARD] });
      
      if (data.redeemed) {
        toast.success('🎉 Redemption Complete!', {
          description: `You now own ${data.product?.name}`,
        });
      } else if (data.requires_payment) {
        toast.info('Payment Required', {
          description: `Pay $${((data.pay_cents || 0) / 100).toFixed(2)} to complete redemption`,
        });
      }
    },
    onError: (error: Error) => {
      toast.error('Failed to claim redemption', { description: error.message });
    },
  });
}
