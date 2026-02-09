import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ADMIN_QUERY_KEYS } from "../../constants";
import type { AdminUser, KYCDocument, CollectorProfile, AppRole } from "../../types";

export function useAdminUsers(filters?: { status?: string; role?: string; search?: string }) {
  return useQuery({
    queryKey: [...ADMIN_QUERY_KEYS.users, filters],
    queryFn: async (): Promise<AdminUser[]> => {
      // Get all collector profiles
      let query = supabase.from("collector_profiles").select("*");

      if (filters?.search) {
        query = query.or(
          `username.ilike.%${filters.search}%,display_name.ilike.%${filters.search}%`
        );
      }

      const { data: profiles, error: profilesError } = await query.order("created_at", {
        ascending: false,
      });

      if (profilesError) throw profilesError;

      // Get roles for all users
      const userIds = profiles?.map((p) => p.user_id) ?? [];
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds);

      // Build user objects
      const users: AdminUser[] = (profiles ?? []).map((profile) => {
        const userRoles = roles
          ?.filter((r) => r.user_id === profile.user_id)
          .map((r) => r.role as AppRole) ?? [];

        return {
          id: profile.user_id,
          created_at: profile.created_at ?? new Date().toISOString(),
          profile,
          roles: userRoles,
          status: "active" as const, // Default, would need column on profile
          card_count: 0,
          total_spent_usd: 0,
        };
      });

      // Filter by role if specified
      if (filters?.role) {
        return users.filter((u) => u.roles.includes(filters.role as AppRole));
      }

      return users;
    },
  });
}

export function useUserDetail(userId: string) {
  return useQuery({
    queryKey: [...ADMIN_QUERY_KEYS.users, userId, "detail"],
    queryFn: async () => {
      // Get profile
      const { data: profile } = await supabase
        .from("collector_profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      // Get roles
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      // Get card count
      const { count: cardCount } = await supabase
        .from("reveals")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      // Get purchases total
      const { data: purchases } = await supabase
        .from("purchases")
        .select("total_price_usd")
        .eq("user_id", userId);

      const totalSpent = purchases?.reduce((sum, p) => sum + Number(p.total_price_usd), 0) ?? 0;

      // Get KYC documents
      const { data: kycDocs } = await supabase
        .from("kyc_documents")
        .select("*")
        .eq("user_id", userId)
        .order("submitted_at", { ascending: false });

      return {
        profile,
        roles: roles?.map((r) => r.role as AppRole) ?? [],
        cardCount: cardCount ?? 0,
        totalSpent,
        kycDocuments: kycDocs ?? [],
      };
    },
    enabled: !!userId,
  });
}

export function usePendingKYCDocuments() {
  return useQuery({
    queryKey: [...ADMIN_QUERY_KEYS.users, "kyc", "pending"],
    queryFn: async (): Promise<KYCDocument[]> => {
      const { data, error } = await supabase
        .from("kyc_documents")
        .select("*")
        .eq("status", "pending")
        .order("submitted_at", { ascending: true });

      if (error) throw error;
      return data ?? [];
    },
  });
}
