import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ADMIN_QUERY_KEYS } from "../../constants";

export interface AdminStatsResponse {
  totalRevenue: number;
  revenueToday: number;
  revenueThisWeek: number;
  revenueThisMonth: number;
  activeRooms: number;
  roomCounts: {
    open: number;
    locked: number;
    settled: number;
    cancelled: number;
  };
  totalUsers: number;
  newUsersToday: number;
  totalCards: number;
  pendingAwards: number;
  bucketBalances: Array<{
    bucket: string;
    balance_usd: number;
    updated_at: string;
  }>;
  tierEscrowPools: Array<{
    tier: string;
    balance_cents: number;
    tier_cap_cents: number;
    updated_at: string;
  }>;
}

export function useAdminDashboardStats() {
  return useQuery({
    queryKey: [...ADMIN_QUERY_KEYS.stats, "dashboard"],
    queryFn: async (): Promise<AdminStatsResponse> => {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error("Not authenticated");
      }

      const { data, error } = await supabase.functions.invoke("admin-get-stats", {
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
      });

      if (error) throw error;
      return data;
    },
    staleTime: 60 * 1000, // 1 minute
  });
}

export interface RevenueDataPoint {
  date: string;
  packRevenue: number;
  roomEntryRevenue: number;
  totalRevenue: number;
  packPurchases: number;
  roomEntries: number;
}

export interface RevenueResponse {
  revenueData: RevenueDataPoint[];
  totals: {
    totalRevenue: number;
    packRevenue: number;
    roomEntryRevenue: number;
    packPurchases: number;
    roomEntries: number;
  };
  tierBreakdown: Record<string, { count: number; revenue: number }>;
  period: { days: number; startDate: string };
}

export function useAdminRevenue(days = 30) {
  return useQuery({
    queryKey: [...ADMIN_QUERY_KEYS.revenue, days],
    queryFn: async (): Promise<RevenueResponse> => {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error("Not authenticated");
      }

      const { data, error } = await supabase.functions.invoke("admin-get-revenue", {
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
        body: { days },
      });

      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export interface UserGrowthDataPoint {
  date: string;
  newUsers: number;
  cumulativeUsers: number;
}

export interface UserGrowthResponse {
  growthData: UserGrowthDataPoint[];
  summary: {
    totalUsers: number;
    newUsersInPeriod: number;
    avgDailySignups: number;
    conversionRate: number;
    purchasingUsers: number;
  };
  period: { days: number; startDate: string };
}

export function useAdminUserGrowth(days = 30) {
  return useQuery({
    queryKey: [...ADMIN_QUERY_KEYS.users, "growth", days],
    queryFn: async (): Promise<UserGrowthResponse> => {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error("Not authenticated");
      }

      const { data, error } = await supabase.functions.invoke("admin-get-user-growth", {
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
        body: { days },
      });

      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export interface ActivityItem {
  id: string;
  type: "purchase" | "reveal" | "room_entry" | "award" | "transfer";
  description: string;
  user_id: string;
  amount?: number;
  created_at: string;
  metadata?: Record<string, unknown>;
}

export interface ActivityResponse {
  activities: ActivityItem[];
}

export function useAdminRecentActivity(limit = 20) {
  return useQuery({
    queryKey: [...ADMIN_QUERY_KEYS.stats, "activity", limit],
    queryFn: async (): Promise<ActivityResponse> => {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error("Not authenticated");
      }

      const { data, error } = await supabase.functions.invoke("admin-get-activity", {
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
        body: { limit },
      });

      if (error) throw error;
      return data;
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}
