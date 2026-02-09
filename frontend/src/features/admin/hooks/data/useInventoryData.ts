import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ADMIN_QUERY_KEYS } from "../../constants";
import type { ProductClass, InventoryItem, ProductWithInventory, ProductCategory, InventoryStatus } from "../../types";

export function useProducts(filters?: { category?: ProductCategory; is_active?: boolean }) {
  return useQuery({
    queryKey: [...ADMIN_QUERY_KEYS.products, filters],
    queryFn: async (): Promise<ProductClass[]> => {
      let query = supabase.from("product_classes").select("*");

      if (filters?.category) {
        query = query.eq("category", filters.category);
      }
      if (filters?.is_active !== undefined) {
        query = query.eq("is_active", filters.is_active);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useProductWithInventory(productId: string) {
  return useQuery({
    queryKey: [...ADMIN_QUERY_KEYS.products, productId, "with-inventory"],
    queryFn: async (): Promise<ProductWithInventory | null> => {
      const { data: product, error: productError } = await supabase
        .from("product_classes")
        .select("*")
        .eq("id", productId)
        .single();

      if (productError) throw productError;
      if (!product) return null;

      const { count: inventoryCount } = await supabase
        .from("inventory_items")
        .select("*", { count: "exact", head: true })
        .eq("product_class_id", productId);

      const { count: availableCount } = await supabase
        .from("inventory_items")
        .select("*", { count: "exact", head: true })
        .eq("product_class_id", productId)
        .is("reserved_for_award_id", null);

      return {
        ...product,
        inventory_count: inventoryCount ?? 0,
        available_count: availableCount ?? 0,
      };
    },
    enabled: !!productId,
  });
}

export function useInventoryItems(filters?: { product_class_id?: string; status?: InventoryStatus }) {
  return useQuery({
    queryKey: [...ADMIN_QUERY_KEYS.inventory, filters],
    queryFn: async (): Promise<InventoryItem[]> => {
      let query = supabase.from("inventory_items").select("*");

      if (filters?.product_class_id) {
        query = query.eq("product_class_id", filters.product_class_id);
      }
      if (filters?.status) {
        query = query.eq("status", filters.status);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useInventorySummary() {
  return useQuery({
    queryKey: [...ADMIN_QUERY_KEYS.inventory, "summary"],
    queryFn: async () => {
      const { data, error } = await supabase.from("inventory_items").select("status, reserved_for_award_id");

      if (error) throw error;

      const summary = {
        total: data?.length ?? 0,
        in_custody: 0,
        guaranteed_seller: 0,
        soft_listing_ok: 0,
        unavailable: 0,
        reserved: 0,
      };

      data?.forEach((item) => {
        if (item.reserved_for_award_id) {
          summary.reserved++;
        }
        switch (item.status) {
          case "IN_CUSTODY":
            summary.in_custody++;
            break;
          case "GUARANTEED_SELLER":
            summary.guaranteed_seller++;
            break;
          case "SOFT_LISTING_OK":
            summary.soft_listing_ok++;
            break;
          case "UNAVAILABLE":
            summary.unavailable++;
            break;
        }
      });

      return summary;
    },
  });
}
