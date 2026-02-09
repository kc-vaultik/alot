/**
 * @fileoverview Hook to fetch single room details.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ROOM_QUERY_KEYS, STALE_TIME } from '../../constants';
import type { Room } from '../../types';

/**
 * Fetches a single room by ID.
 * 
 * @param roomId - The room ID to fetch
 */
export function useRoom(roomId: string | null) {
  return useQuery({
    queryKey: [ROOM_QUERY_KEYS.ROOM, roomId],
    queryFn: async (): Promise<Room | null> => {
      if (!roomId) return null;

      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (error) throw error;
      return data as Room;
    },
    enabled: !!roomId,
    staleTime: STALE_TIME.ROOMS,
  });
}
