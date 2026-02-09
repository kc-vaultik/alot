import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ADMIN_QUERY_KEYS } from "../../constants";
import { toast } from "sonner";

const FUNCTION_NAME = "admin-inventory-manage";

async function callInventoryFunction(action: string, params: Record<string, unknown> = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const response = await supabase.functions.invoke(FUNCTION_NAME, {
    body: { action, ...params },
  });

  if (response.error) throw new Error(response.error.message);
  return response.data;
}

// Products with inventory counts
export function useAdminProductsWithInventory() {
  return useQuery({
    queryKey: [...ADMIN_QUERY_KEYS.products, "with-inventory"],
    queryFn: () => callInventoryFunction("get-products-with-inventory"),
  });
}

// Create product
export function useAdminCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (product: Record<string, unknown>) =>
      callInventoryFunction("create-product", { product }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.products });
      toast.success("Product created successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create product: ${error.message}`);
    },
  });
}

// Update product
export function useAdminUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, product }: { productId: string; product: Record<string, unknown> }) =>
      callInventoryFunction("update-product", { productId, product }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.products });
      toast.success("Product updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update product: ${error.message}`);
    },
  });
}

// Delete product
export function useAdminDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) =>
      callInventoryFunction("delete-product", { productId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.products });
      toast.success("Product deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete product: ${error.message}`);
    },
  });
}

// Get inventory items
export function useAdminInventoryItems(filters?: {
  productClassId?: string;
  status?: string;
  supplierId?: string;
}) {
  return useQuery({
    queryKey: [...ADMIN_QUERY_KEYS.inventory, filters],
    queryFn: () => callInventoryFunction("get-inventory", filters),
  });
}

// Create single inventory item
export function useAdminCreateInventoryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (item: Record<string, unknown>) =>
      callInventoryFunction("create-inventory-item", { item }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.inventory });
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.products });
      toast.success("Inventory item created");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create inventory item: ${error.message}`);
    },
  });
}

// Create batch inventory items
export function useAdminCreateInventoryBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      productClassId: string;
      quantity: number;
      status?: string;
      supplierId?: string;
      costUsd?: number;
      notes?: string;
    }) => callInventoryFunction("create-inventory-batch", params),
    onSuccess: (data: { created: number }) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.inventory });
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.products });
      toast.success(`Created ${data.created} inventory items`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to create inventory batch: ${error.message}`);
    },
  });
}

// Update inventory item
export function useAdminUpdateInventoryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, item }: { itemId: string; item: Record<string, unknown> }) =>
      callInventoryFunction("update-inventory-item", { itemId, item }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.inventory });
      toast.success("Inventory item updated");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update inventory item: ${error.message}`);
    },
  });
}

// Delete inventory item
export function useAdminDeleteInventoryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) =>
      callInventoryFunction("delete-inventory-item", { itemId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.inventory });
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.products });
      toast.success("Inventory item deleted");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete inventory item: ${error.message}`);
    },
  });
}

// Suppliers
export function useAdminSuppliers() {
  return useQuery({
    queryKey: [...ADMIN_QUERY_KEYS.inventory, "suppliers"],
    queryFn: () => callInventoryFunction("get-suppliers"),
  });
}

export function useAdminCreateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (supplier: Record<string, unknown>) =>
      callInventoryFunction("create-supplier", { supplier }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...ADMIN_QUERY_KEYS.inventory, "suppliers"] });
      toast.success("Supplier created");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create supplier: ${error.message}`);
    },
  });
}

export function useAdminUpdateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ supplierId, supplier }: { supplierId: string; supplier: Record<string, unknown> }) =>
      callInventoryFunction("update-supplier", { supplierId, supplier }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...ADMIN_QUERY_KEYS.inventory, "suppliers"] });
      toast.success("Supplier updated");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update supplier: ${error.message}`);
    },
  });
}

export function useAdminDeleteSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (supplierId: string) =>
      callInventoryFunction("delete-supplier", { supplierId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...ADMIN_QUERY_KEYS.inventory, "suppliers"] });
      toast.success("Supplier deleted");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete supplier: ${error.message}`);
    },
  });
}

// Image upload
export function useProductImageUpload() {
  return useMutation({
    mutationFn: async (file: File) => {
      const fileExt = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      return publicUrl;
    },
    onError: (error: Error) => {
      toast.error(`Failed to upload image: ${error.message}`);
    },
  });
}
