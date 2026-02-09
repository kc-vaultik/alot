import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ADMIN_QUERY_KEYS } from "../../constants";
import type { EconomyConfig, CategoryPricing, PoolLedgerEntry, EscrowLedgerEntry } from "../../types";

export function useEconomyConfigs() {
  return useQuery({
    queryKey: [...ADMIN_QUERY_KEYS.economy, "configs"],
    queryFn: async (): Promise<EconomyConfig[]> => {
      const { data, error } = await supabase
        .from("economy_configs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useActiveEconomyConfig() {
  return useQuery({
    queryKey: [...ADMIN_QUERY_KEYS.economy, "active"],
    queryFn: async (): Promise<EconomyConfig | null> => {
      const { data, error } = await supabase
        .from("economy_configs")
        .select("*")
        .eq("is_active", true)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
  });
}

export function useCategoryPricing() {
  return useQuery({
    queryKey: [...ADMIN_QUERY_KEYS.economy, "pricing"],
    queryFn: async (): Promise<CategoryPricing[]> => {
      const { data, error } = await supabase
        .from("category_pricing")
        .select("*")
        .order("category")
        .order("tier");

      if (error) throw error;
      return data ?? [];
    },
  });
}

export function usePoolLedger(limit = 100) {
  return useQuery({
    queryKey: [...ADMIN_QUERY_KEYS.ledger, "pool", limit],
    queryFn: async (): Promise<PoolLedgerEntry[]> => {
      const { data, error } = await supabase
        .from("pool_ledger")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useEscrowLedger(limit = 100) {
  return useQuery({
    queryKey: [...ADMIN_QUERY_KEYS.ledger, "escrow", limit],
    queryFn: async (): Promise<EscrowLedgerEntry[]> => {
      const { data, error } = await supabase
        .from("escrow_ledger")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data ?? [];
    },
  });
}
