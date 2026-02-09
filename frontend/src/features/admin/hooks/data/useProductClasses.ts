import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ADMIN_QUERY_KEYS } from "../../constants";

export interface ProductClass {
  id: string;
  name: string;
  brand: string;
  model: string;
  category: string;
  band: string;
  bucket: string;
  retail_value_usd: number;
  expected_fulfillment_cost_usd: number;
  image_url: string | null;
  description: string | null;
  is_active: boolean;
  is_jackpot: boolean;
  created_at: string;
}

export function useAdminProductClasses(filters?: { category?: string; is_active?: boolean }) {
  return useQuery({
    queryKey: [...ADMIN_QUERY_KEYS.products, filters],
    queryFn: async (): Promise<ProductClass[]> => {
      let query = supabase
        .from("product_classes")
        .select("*")
        .order("name");

      if (filters?.is_active !== undefined) {
        query = query.eq("is_active", filters.is_active);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Filter by category client-side to avoid type issues
      let result = data ?? [];
      if (filters?.category) {
        result = result.filter(p => p.category === filters.category);
      }
      return result;
    },
  });
}
