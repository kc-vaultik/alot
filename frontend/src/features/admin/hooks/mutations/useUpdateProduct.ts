import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ADMIN_QUERY_KEYS } from "../../constants";
import type { ProductFormData } from "../../types";
import { toast } from "sonner";

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ProductFormData) => {
      const { data: product, error } = await supabase
        .from("product_classes")
        .insert({
          name: data.name,
          brand: data.brand,
          model: data.model,
          description: data.description,
          image_url: data.image_url,
          category: data.category,
          band: data.band,
          bucket: data.bucket,
          retail_value_usd: data.retail_value_usd,
          expected_fulfillment_cost_usd: data.expected_fulfillment_cost_usd,
          is_active: data.is_active,
          is_jackpot: data.is_jackpot,
          traits: data.traits,
        })
        .select()
        .single();

      if (error) throw error;
      return product;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.products });
      toast.success("Product created successfully");
    },
    onError: (error) => {
      toast.error(`Failed to create product: ${error.message}`);
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      data,
    }: {
      productId: string;
      data: Partial<ProductFormData>;
    }) => {
      const { data: product, error } = await supabase
        .from("product_classes")
        .update(data)
        .eq("id", productId)
        .select()
        .single();

      if (error) throw error;
      return product;
    },
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.products });
      queryClient.invalidateQueries({ queryKey: [...ADMIN_QUERY_KEYS.products, productId] });
      toast.success("Product updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update product: ${error.message}`);
    },
  });
}

export function useToggleProductActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, isActive }: { productId: string; isActive: boolean }) => {
      const { data: product, error } = await supabase
        .from("product_classes")
        .update({ is_active: isActive })
        .eq("id", productId)
        .select()
        .single();

      if (error) throw error;
      return product;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.products });
      toast.success("Product status updated");
    },
    onError: (error) => {
      toast.error(`Failed to update product: ${error.message}`);
    },
  });
}
