/**
 * @fileoverview Hook to fetch user's own room entry with competitiveness info.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ROOM_QUERY_KEYS, STALE_TIME } from '../../constants';
import type { MyRoomEntryResponse } from '../../types';

/**
 * Fetches the current user's entry in a room, including competitiveness band.
 * 
 * @param roomId - The room ID to fetch entry for
 */
export function useMyRoomEntry(roomId: string | null) {
  const { user, session, loading: authLoading } = useAuth();

  return useQuery({
    queryKey: [ROOM_QUERY_KEYS.MY_ROOM_ENTRY, roomId, user?.id],
    queryFn: async (): Promise<MyRoomEntryResponse | null> => {
      if (!roomId || !user || !session) return null;

      const { data, error } = await supabase.rpc('get_my_room_entry', {
        p_room_id: roomId,
      });

      if (error) throw error;
      return data as unknown as MyRoomEntryResponse;
    },
    enabled: !!roomId && !!user && !!session && !authLoading,
    staleTime: STALE_TIME.LEADERBOARD,
    refetchInterval: STALE_TIME.LEADERBOARD,
  });
}
