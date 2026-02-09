/**
 * @fileoverview Hook for leaving a room (unstaking a card).
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ROOM_QUERY_KEYS } from '../../constants';
import type { LeaveRoomResponse } from '../../types';

interface LeaveRoomParams {
  roomId: string;
  revealId: string;
}

/**
 * Mutation hook for leaving a room by unstaking a card.
 */
export function useLeaveRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roomId, revealId }: LeaveRoomParams): Promise<LeaveRoomResponse> => {
      const { data, error } = await supabase.rpc('leave_room', {
        p_room_id: roomId,
        p_reveal_id: revealId,
      });

      if (error) throw error;
      return data as unknown as LeaveRoomResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ROOM_QUERY_KEYS.ACTIVE_ROOMS] });
      queryClient.invalidateQueries({ queryKey: [ROOM_QUERY_KEYS.ROOM] });
      queryClient.invalidateQueries({ queryKey: [ROOM_QUERY_KEYS.ROOM_LEADERBOARD] });
      queryClient.invalidateQueries({ queryKey: [ROOM_QUERY_KEYS.MY_ELIGIBLE_CARDS] });
      
      toast.success('Card Unstaked', {
        description: 'Your card is back in your vault',
      });
    },
    onError: (error: Error) => {
      toast.error('Failed to unstake card', { description: error.message });
    },
  });
}
