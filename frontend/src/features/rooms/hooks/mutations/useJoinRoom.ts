/**
 * @fileoverview Hook for joining a room (staking a card).
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ROOM_QUERY_KEYS } from '../../constants';
import type { JoinRoomResponse } from '../../types';

interface JoinRoomParams {
  roomId: string;
  revealId: string;
}

/**
 * Mutation hook for joining a room by staking a card.
 */
export function useJoinRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roomId, revealId }: JoinRoomParams): Promise<JoinRoomResponse> => {
      const { data, error } = await supabase.rpc('join_room', {
        p_room_id: roomId,
        p_reveal_id: revealId,
      });

      if (error) throw error;
      return data as unknown as JoinRoomResponse;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [ROOM_QUERY_KEYS.ACTIVE_ROOMS] });
      queryClient.invalidateQueries({ queryKey: [ROOM_QUERY_KEYS.ROOM] });
      queryClient.invalidateQueries({ queryKey: [ROOM_QUERY_KEYS.ROOM_LEADERBOARD] });
      queryClient.invalidateQueries({ queryKey: [ROOM_QUERY_KEYS.MY_ELIGIBLE_CARDS] });
      
      toast.success('Card Staked!', {
        description: `You're now competing in the ${data.room.tier} Room`,
      });
    },
    onError: (error: Error) => {
      toast.error('Failed to stake card', { description: error.message });
    },
  });
}
