// Inventory and product types for admin panel

import type { Database } from "@/integrations/supabase/types";

export type ProductClass = Database["public"]["Tables"]["product_classes"]["Row"];
export type ProductClassInsert = Database["public"]["Tables"]["product_classes"]["Insert"];
export type ProductClassUpdate = Database["public"]["Tables"]["product_classes"]["Update"];

export type InventoryItem = Database["public"]["Tables"]["inventory_items"]["Row"];
export type InventoryStatus = Database["public"]["Enums"]["inventory_status"];

export type RarityBand = Database["public"]["Enums"]["rarity_band"];
export type AwardBucket = Database["public"]["Enums"]["award_bucket"];
export type ProductCategory = Database["public"]["Enums"]["product_category"];

export interface ProductWithInventory extends ProductClass {
  inventory_count: number;
  available_count: number;
}

export interface InventorySupplier {
  id: string;
  name: string;
  api_endpoint?: string;
  is_active: boolean;
  created_at: string;
}

export interface ProductFormData {
  name: string;
  brand: string;
  model: string;
  description?: string;
  image_url?: string;
  category: ProductCategory;
  band: RarityBand;
  bucket: AwardBucket;
  retail_value_usd: number;
  expected_fulfillment_cost_usd: number;
  is_active: boolean;
  is_jackpot: boolean;
  traits?: string[];
}
