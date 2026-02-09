/**
 * @fileoverview Hook to fetch room leaderboard with realtime updates.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ROOM_QUERY_KEYS, STALE_TIME } from '../../constants';
import type { RoomLeaderboardResponse } from '../../types';

/**
 * Fetches room leaderboard and subscribes to realtime updates.
 * 
 * @param roomId - The room ID to fetch leaderboard for
 */
export function useRoomLeaderboard(roomId: string | null) {
  const queryClient = useQueryClient();
  const { session, loading: authLoading } = useAuth();

  const query = useQuery({
    queryKey: [ROOM_QUERY_KEYS.ROOM_LEADERBOARD, roomId],
    queryFn: async (): Promise<RoomLeaderboardResponse | null> => {
      if (!roomId || !session) return null;

      const { data, error } = await supabase.rpc('get_room_leaderboard', {
        p_room_id: roomId,
      });

      if (error) throw error;
      return data as unknown as RoomLeaderboardResponse;
    },
    enabled: !!roomId && !!session && !authLoading,
    staleTime: STALE_TIME.LEADERBOARD,
    refetchInterval: STALE_TIME.LEADERBOARD,
  });

  // Subscribe to realtime updates on room_entries
  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`room-leaderboard-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_entries',
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: [ROOM_QUERY_KEYS.ROOM_LEADERBOARD, roomId],
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${roomId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: [ROOM_QUERY_KEYS.ROOM_LEADERBOARD, roomId],
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, queryClient]);

  return query;
}
