/**
 * @fileoverview Category Pricing Hook
 * Fetches category-specific pricing from the database
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ProductCategory } from '../../constants/categories';
import type { PricingTier } from '../../types';

interface CategoryPrice {
  tier: PricingTier;
  price_cents: number;
  display_name: string;
  description: string | null;
}

interface UseCategoryPricingResult {
  prices: CategoryPrice[];
  isLoading: boolean;
  error: Error | null;
}

export function useCategoryPricing(category: ProductCategory | null): UseCategoryPricingResult {
  const { data, isLoading, error } = useQuery({
    queryKey: ['category-pricing', category],
    queryFn: async () => {
      if (!category) return [];
      
      const { data, error } = await supabase
        .from('category_pricing')
        .select('tier, price_cents, display_name, description')
        .eq('category', category)
        .eq('is_active', true)
        .order('price_cents', { ascending: true });

      if (error) throw error;
      return data as CategoryPrice[];
    },
    enabled: !!category,
    staleTime: 60_000, // Cache for 1 minute
  });

  return {
    prices: data ?? [],
    isLoading,
    error: error as Error | null,
  };
}
