/**
 * @fileoverview Hook for fetching the current user's credits.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { QUERY_KEYS, STALE_TIMES } from '../../constants';
import type { CreditsData, ProductCredit } from '../../types';

/**
 * Fetches the current user's credits (universal and per-product).
 */
export function useMyCredits() {
  const { user, loading: authLoading } = useAuth();

  return useQuery({
    queryKey: [QUERY_KEYS.CREDITS, user?.id],
    queryFn: async (): Promise<CreditsData> => {
      if (!user) return { universal: 0, products: [] };

      const [universalResult, productResult] = await Promise.all([
        supabase
          .from('user_universal_credits')
          .select('credits')
          .eq('user_id', user.id)
          .single(),
        supabase
          .from('user_product_credits')
          .select(`product_class_id, credits, product_classes (*)`)
          .eq('user_id', user.id),
      ]);

      return {
        universal: universalResult.data?.credits ?? 0,
        products: (productResult.data as unknown as ProductCredit[]) ?? [],
      };
    },
    enabled: !authLoading && !!user,
    staleTime: STALE_TIMES.CREDITS,
  });
}

/**
 * Returns a function to invalidate credits queries.
 */
export function useInvalidateCredits() {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CREDITS] });
  };
}
