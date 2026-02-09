/**
 * @fileoverview Hook to fetch products by tier/band.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { RoomTier } from '../../types';
import { ROOM_QUERY_KEYS } from '../../constants';

interface TierProduct {
  id: string;
  name: string;
  brand: string;
  model: string;
  category: string;
  retail_value_usd: number;
  image_url: string | null;
  band: string;
}

/**
 * Fetches active products for a given tier/band.
 * 
 * @param tier - The tier to fetch products for
 */
export function useProductsByTier(tier: RoomTier) {
  return useQuery({
    queryKey: [ROOM_QUERY_KEYS.ROOM, 'products', tier],
    queryFn: async (): Promise<TierProduct[]> => {
      const { data, error } = await supabase
        .from('product_classes')
        .select('id, name, brand, model, category, retail_value_usd, image_url, band')
        .eq('band', tier)
        .eq('is_active', true)
        .limit(20);

      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
