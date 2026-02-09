/**
 * @fileoverview Hook for fetching the current user's revealed cards.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { QUERY_KEYS } from '../../constants';
import { mapRevealToCollectCard } from '../../utils/cardMappers';
import type { CollectCard, RevealRow } from '../../types';

/**
 * Fetches the current user's revealed cards.
 * Cards are ordered by creation date, most recent first.
 */
export function useMyReveals() {
  const { user, loading: authLoading, session } = useAuth();

  return useQuery({
    queryKey: [QUERY_KEYS.REVEALS, user?.id],
    queryFn: async (): Promise<CollectCard[]> => {
      if (!user || !session) {
        return [];
      }

      const { data, error } = await supabase
        .from('reveals')
        .select(`*, product_classes (*)`)
        .eq('user_id', user.id)
        .not('revealed_at', 'is', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[useMyReveals] Query error:', error);
        throw error;
      }

      const mapped = (data as unknown as RevealRow[])
        .map(mapRevealToCollectCard)
        .filter((card): card is CollectCard => card !== null);
      
      return mapped;
    },
    enabled: !authLoading && !!user && !!session,
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

/**
 * Fetches the current user's unrevealed cards (for queue on page load).
 * Cards are ordered by creation date, oldest first.
 */
export function useUnrevealedCards() {
  const { user, loading: authLoading, session } = useAuth();

  return useQuery({
    queryKey: [QUERY_KEYS.UNREVEALED, user?.id],
    queryFn: async (): Promise<CollectCard[]> => {
      if (!user || !session) return [];

      const { data, error } = await supabase
        .from('reveals')
        .select(`*, product_classes (*)`)
        .eq('user_id', user.id)
        .is('revealed_at', null)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      return (data as unknown as RevealRow[])
        .map(mapRevealToCollectCard)
        .filter((card): card is CollectCard => card !== null);
    },
    enabled: !authLoading && !!user && !!session,
    staleTime: 30000,
  });
}

/**
 * Returns a function to invalidate reveals queries.
 */
export function useInvalidateReveals() {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.REVEALS] });
  };
}
