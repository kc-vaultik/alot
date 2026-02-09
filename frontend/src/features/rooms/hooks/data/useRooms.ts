/**
 * @fileoverview Hook to fetch active rooms.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ROOM_QUERY_KEYS, STALE_TIME } from '../../constants';
import type { ActiveRoomsResponse, Room, RoomTier } from '../../types';

/**
 * Fetches active rooms, optionally filtered by tier.
 * 
 * @param tier - Optional tier filter
 */
export function useRooms(tier?: RoomTier) {
  return useQuery({
    queryKey: [ROOM_QUERY_KEYS.ACTIVE_ROOMS, tier],
    queryFn: async (): Promise<ActiveRoomsResponse> => {
      const { data, error } = await supabase.rpc('get_active_rooms', {
        p_tier: tier || null,
      });

      if (error) throw error;
      
      const response = data as unknown as { rooms: Room[] } | null;
      const rooms = response?.rooms || [];
      return { rooms };
    },
    staleTime: STALE_TIME.ROOMS,
    refetchInterval: STALE_TIME.ROOMS,
  });
}
