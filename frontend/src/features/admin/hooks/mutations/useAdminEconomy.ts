import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ADMIN_QUERY_KEYS } from "../../constants";
import { toast } from "sonner";

const FUNCTION_NAME = "admin-economy-manage";

async function callEconomyFunction(action: string, params: Record<string, unknown> = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const response = await supabase.functions.invoke(FUNCTION_NAME, {
    body: { action, ...params },
  });

  if (response.error) throw new Error(response.error.message);
  return response.data;
}

// Bucket Balances
export function useAdminBucketBalances() {
  return useQuery({
    queryKey: ADMIN_QUERY_KEYS.poolBalances,
    queryFn: () => callEconomyFunction("get-bucket-balances"),
  });
}

export function useAdminUpdateBucketBalance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { bucket: string; amount: number; reason?: string }) =>
      callEconomyFunction("update-bucket-balance", params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.poolBalances });
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.ledger });
      toast.success("Pool balance updated");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update balance: ${error.message}`);
    },
  });
}

// Tier Escrow Pools
export function useAdminTierEscrowPools() {
  return useQuery({
    queryKey: ADMIN_QUERY_KEYS.escrowPools,
    queryFn: () => callEconomyFunction("get-tier-escrow-pools"),
  });
}

// Category Pool Balances
export function useAdminCategoryPoolBalances() {
  return useQuery({
    queryKey: [...ADMIN_QUERY_KEYS.poolBalances, "category"],
    queryFn: () => callEconomyFunction("get-category-pool-balances"),
  });
}

// Economy Configs
export function useAdminEconomyConfigs() {
  return useQuery({
    queryKey: ADMIN_QUERY_KEYS.economy,
    queryFn: () => callEconomyFunction("get-economy-configs"),
  });
}

export function useAdminCreateEconomyConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { version: string; config: Record<string, unknown> }) =>
      callEconomyFunction("create-economy-config", params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.economy });
      toast.success("Economy config created");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create config: ${error.message}`);
    },
  });
}

export function useAdminActivateEconomyConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (configId: string) =>
      callEconomyFunction("activate-economy-config", { configId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.economy });
      toast.success("Economy config activated");
    },
    onError: (error: Error) => {
      toast.error(`Failed to activate config: ${error.message}`);
    },
  });
}

export function useAdminDeleteEconomyConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (configId: string) =>
      callEconomyFunction("delete-economy-config", { configId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.economy });
      toast.success("Economy config deleted");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete config: ${error.message}`);
    },
  });
}

// Ledgers
export function useAdminPoolLedger(filters?: { bucket?: string; eventType?: string; limit?: number }) {
  return useQuery({
    queryKey: [...ADMIN_QUERY_KEYS.ledger, "pool", filters],
    queryFn: () => callEconomyFunction("get-pool-ledger", filters),
  });
}

export function useAdminEscrowLedger(filters?: { tier?: string; scope?: string; limit?: number }) {
  return useQuery({
    queryKey: [...ADMIN_QUERY_KEYS.ledger, "escrow", filters],
    queryFn: () => callEconomyFunction("get-escrow-ledger", filters),
  });
}

export function useAdminCategoryPoolLedger(filters?: { category?: string; limit?: number }) {
  return useQuery({
    queryKey: [...ADMIN_QUERY_KEYS.ledger, "category", filters],
    queryFn: () => callEconomyFunction("get-category-pool-ledger", filters),
  });
}

// Category Pricing
export function useAdminCategoryPricing() {
  return useQuery({
    queryKey: [...ADMIN_QUERY_KEYS.economy, "pricing"],
    queryFn: () => callEconomyFunction("get-category-pricing"),
  });
}

export function useAdminUpdateCategoryPricing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      pricingId: string;
      priceCents?: number;
      displayName?: string;
      description?: string;
      isActive?: boolean;
    }) => callEconomyFunction("update-category-pricing", params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...ADMIN_QUERY_KEYS.economy, "pricing"] });
      toast.success("Pricing updated");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update pricing: ${error.message}`);
    },
  });
}

export function useAdminCreateCategoryPricing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      category: string;
      tier: string;
      priceCents: number;
      displayName: string;
      description?: string;
      isActive?: boolean;
    }) => callEconomyFunction("create-category-pricing", params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...ADMIN_QUERY_KEYS.economy, "pricing"] });
      toast.success("Pricing created");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create pricing: ${error.message}`);
    },
  });
}

// Promo Spend
export function useAdminPromoSpend(limit?: number) {
  return useQuery({
    queryKey: [...ADMIN_QUERY_KEYS.economy, "promo-spend", limit],
    queryFn: () => callEconomyFunction("get-promo-spend", { limit }),
  });
}
