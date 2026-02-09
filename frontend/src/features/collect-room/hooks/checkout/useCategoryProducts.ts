/**
 * @fileoverview Category Products Hook
 * Fetches sample products per category for display
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ProductCategory } from '../../constants/categories';
import { QUERY_KEYS } from '../../constants';

export interface CategoryProduct {
  id: string;
  name: string;
  brand: string;
  category: ProductCategory;
  band: 'ICON' | 'RARE' | 'GRAIL' | 'MYTHIC';
  image_url: string | null;
  retail_value_usd: number;
}

export function useCategoryProducts() {
  return useQuery({
    queryKey: [...QUERY_KEYS.REVEALS, 'category-products'],
    queryFn: async (): Promise<Record<ProductCategory, CategoryProduct[]>> => {
      const { data, error } = await supabase
        .from('product_classes')
        .select('id, name, brand, category, band, image_url, retail_value_usd')
        .eq('is_active', true)
        .order('retail_value_usd', { ascending: false });

      if (error) throw error;

      // Group products by category
      const grouped: Record<string, CategoryProduct[]> = {};
      
      for (const product of (data || [])) {
        const cat = product.category as ProductCategory;
        if (!grouped[cat]) {
          grouped[cat] = [];
        }
        // Keep up to 4 products per category (one per rarity band ideally)
        if (grouped[cat].length < 4) {
          grouped[cat].push(product as CategoryProduct);
        }
      }

      return grouped as Record<ProductCategory, CategoryProduct[]>;
    },
    staleTime: 60_000 * 5, // 5 minutes
  });
}
