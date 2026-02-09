import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ADMIN_QUERY_KEYS } from "../../constants";

export interface BadgeCounts {
  pendingKyc: number;
  activeDrops: number;
  pendingAwards: number;
  recentUsers: number;
}

export function useAdminBadgeCounts() {
  return useQuery({
    queryKey: [...ADMIN_QUERY_KEYS.stats, "badge-counts"],
    queryFn: async (): Promise<BadgeCounts> => {
      const [kycResult, dropsResult, awardsResult, usersResult] = await Promise.all([
        supabase
          .from("kyc_documents")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),
        supabase
          .from("rooms")
          .select("id", { count: "exact", head: true })
          .eq("status", "open"),
        supabase
          .from("awards")
          .select("id", { count: "exact", head: true })
          .eq("status", "RESERVED"),
        supabase
          .from("collector_profiles")
          .select("user_id", { count: "exact", head: true })
          .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      ]);

      return {
        pendingKyc: kycResult.count ?? 0,
        activeDrops: dropsResult.count ?? 0,
        pendingAwards: awardsResult.count ?? 0,
        recentUsers: usersResult.count ?? 0,
      };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}
