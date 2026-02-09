import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ADMIN_QUERY_KEYS } from "../../constants";
import type { DashboardStats, RoomStatusCounts, PoolBalance, TierEscrowBalance } from "../../types";

export function useAdminStats() {
  return useQuery({
    queryKey: ADMIN_QUERY_KEYS.stats,
    queryFn: async (): Promise<DashboardStats> => {
      // Get revenue stats
      const { data: purchases } = await supabase
        .from("purchases")
        .select("total_price_usd, created_at");

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(todayStart);
      weekStart.setDate(weekStart.getDate() - 7);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const totalRevenue = purchases?.reduce((sum, p) => sum + Number(p.total_price_usd), 0) ?? 0;
      const revenueToday = purchases
        ?.filter((p) => new Date(p.created_at) >= todayStart)
        .reduce((sum, p) => sum + Number(p.total_price_usd), 0) ?? 0;
      const revenueThisWeek = purchases
        ?.filter((p) => new Date(p.created_at) >= weekStart)
        .reduce((sum, p) => sum + Number(p.total_price_usd), 0) ?? 0;
      const revenueThisMonth = purchases
        ?.filter((p) => new Date(p.created_at) >= monthStart)
        .reduce((sum, p) => sum + Number(p.total_price_usd), 0) ?? 0;

      // Get room counts
      const { count: activeRooms } = await supabase
        .from("rooms")
        .select("*", { count: "exact", head: true })
        .in("status", ["OPEN", "LOCKED"]);

      // Get reveals count
      const { count: totalCards } = await supabase
        .from("reveals")
        .select("*", { count: "exact", head: true });

      // Get pending awards
      const { count: pendingAwards } = await supabase
        .from("awards")
        .select("*", { count: "exact", head: true })
        .eq("status", "RESERVED");

      return {
        totalRevenue,
        revenueToday,
        revenueThisWeek,
        revenueThisMonth,
        activeRooms: activeRooms ?? 0,
        totalUsers: 0, // Would need edge function to query auth.users
        newUsersToday: 0,
        totalCards: totalCards ?? 0,
        pendingAwards: pendingAwards ?? 0,
      };
    },
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useRoomStatusCounts() {
  return useQuery({
    queryKey: [...ADMIN_QUERY_KEYS.rooms, "counts"],
    queryFn: async (): Promise<RoomStatusCounts> => {
      const { data: rooms } = await supabase.from("rooms").select("status");

      const counts: RoomStatusCounts = {
        open: 0,
        locked: 0,
        settled: 0,
        cancelled: 0,
      };

      rooms?.forEach((room) => {
        const status = room.status.toLowerCase() as keyof RoomStatusCounts;
        if (status in counts) {
          counts[status]++;
        }
      });

      return counts;
    },
  });
}

export function usePoolBalances() {
  return useQuery({
    queryKey: ADMIN_QUERY_KEYS.poolBalances,
    queryFn: async (): Promise<PoolBalance[]> => {
      const { data, error } = await supabase
        .from("bucket_balances")
        .select("*")
        .order("bucket");

      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useTierEscrowPools() {
  return useQuery({
    queryKey: ADMIN_QUERY_KEYS.escrowPools,
    queryFn: async (): Promise<TierEscrowBalance[]> => {
      const { data, error } = await supabase
        .from("tier_escrow_pools")
        .select("*")
        .order("tier");

      if (error) throw error;
      return data ?? [];
    },
  });
}
