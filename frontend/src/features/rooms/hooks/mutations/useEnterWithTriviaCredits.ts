/**
 * @fileoverview Mutation hook for entering a lot with Trivia Credits (free entry).
 * @module features/rooms/hooks/mutations/useEnterWithTriviaCredits
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ROOM_QUERY_KEYS } from '../../constants';
import { TRIVIA_CREDITS_QUERY_KEY, LOT_TRIVIA_STATS_QUERY_KEY } from '../data/useTriviaCredits';

interface EnterWithTriviaCreditsParams {
  roomId: string;
  ticketsToBuy?: number;
}

interface EnterWithTriviaCreditsResponse {
  success: boolean;
  error?: string;
  entry_id?: string;
  tickets_purchased: number;
  credits_spent: number;
  new_balance: number;
  total_trivia_tickets: number;
}

/**
 * Mutation hook for entering a lot using Trivia Credits (free entry).
 * Spends Trivia Credits to get Trivia Tickets (weighted lower than paid entries).
 */
export function useEnterWithTriviaCredits() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      roomId, 
      ticketsToBuy = 1 
    }: EnterWithTriviaCreditsParams): Promise<EnterWithTriviaCreditsResponse> => {
      const { data, error } = await supabase.rpc('enter_lot_with_trivia_credits', {
        p_room_id: roomId,
        p_tickets_to_buy: ticketsToBuy,
      });

      if (error) throw error;
      
      const result = data as unknown as EnterWithTriviaCreditsResponse;
      if (!result.success) {
        throw new Error(result.error || 'Failed to enter lot');
      }
      
      return result;
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [ROOM_QUERY_KEYS.ACTIVE_ROOMS] });
      queryClient.invalidateQueries({ queryKey: [ROOM_QUERY_KEYS.ROOM] });
      queryClient.invalidateQueries({ queryKey: [ROOM_QUERY_KEYS.MY_ROOM_ENTRY] });
      queryClient.invalidateQueries({ queryKey: [TRIVIA_CREDITS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [LOT_TRIVIA_STATS_QUERY_KEY, variables.roomId] });
      queryClient.invalidateQueries({ queryKey: ['my-trivia-entry', variables.roomId] });
      
      toast.success('Free Entry Added!', {
        description: `You now have ${data.total_trivia_tickets} free ticket${data.total_trivia_tickets > 1 ? 's' : ''} in this lot`,
      });
    },
    onError: (error: Error) => {
      toast.error('Failed to enter lot', { description: error.message });
    },
  });
}
