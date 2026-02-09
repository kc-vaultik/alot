// Admin types barrel export

export * from "./dashboard";
export * from "./inventory";
export * from "./moderation";

// Room types (using existing database types)
import type { Database } from "@/integrations/supabase/types";

export type Room = Database["public"]["Tables"]["rooms"]["Row"];
export type RoomInsert = Database["public"]["Tables"]["rooms"]["Insert"];
export type RoomUpdate = Database["public"]["Tables"]["rooms"]["Update"];

export type RoomEntry = Database["public"]["Tables"]["room_entries"]["Row"];
export type LotteryDraw = Database["public"]["Tables"]["lottery_draws"]["Row"];

export type PricingTier = Database["public"]["Enums"]["pricing_tier"];

export interface RoomFormData {
  tier: string;
  category?: string;
  product_class_id?: string;
  mystery_product_id?: string;
  is_mystery: boolean;
  start_at: string;
  end_at: string;
  lock_at?: string;
  deadline_at?: string;
  min_participants: number;
  max_participants: number;
  escrow_target_cents: number;
  tier_cap_cents: number;
  funding_target_cents?: number;
  reward_budget_cents?: number;
  leaderboard_visibility?: string;
}

// Economy types
export type EconomyConfig = Database["public"]["Tables"]["economy_configs"]["Row"];
export type CategoryPricing = Database["public"]["Tables"]["category_pricing"]["Row"];
export type PoolLedgerEntry = Database["public"]["Tables"]["pool_ledger"]["Row"];
export type EscrowLedgerEntry = Database["public"]["Tables"]["escrow_ledger"]["Row"];

// Admin navigation
export interface AdminNavItem {
  label: string;
  href: string;
  icon: string;
  children?: AdminNavItem[];
}
