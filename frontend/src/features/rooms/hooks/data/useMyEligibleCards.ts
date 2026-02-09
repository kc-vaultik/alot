/**
 * @fileoverview Hook to fetch user's eligible cards for a room.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ROOM_QUERY_KEYS, STALE_TIME } from '../../constants';
import type { EligibleCardsResponse } from '../../types';

/**
 * Fetches the current user's cards eligible for staking in a room.
 * 
 * @param roomId - The room ID to check eligibility for
 */
export function useMyEligibleCards(roomId: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: [ROOM_QUERY_KEYS.MY_ELIGIBLE_CARDS, roomId, user?.id],
    queryFn: async (): Promise<EligibleCardsResponse | null> => {
      if (!roomId || !user) return null;

      const { data, error } = await supabase.rpc('get_my_eligible_cards', {
        p_room_id: roomId,
      });

      if (error) throw error;
      return data as unknown as EligibleCardsResponse;
    },
    enabled: !!roomId && !!user,
    staleTime: STALE_TIME.ELIGIBLE_CARDS,
  });
}
