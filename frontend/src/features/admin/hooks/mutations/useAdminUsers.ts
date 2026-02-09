import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { AppRole } from "../../types";

const USERS_QUERY_KEY = ["admin", "users"];

async function callUsersApi(action: string, params: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke("admin-users-manage", {
    body: { action, ...params },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

export function useAdminUsersList(filters?: { search?: string; status?: string; role?: string }) {
  return useQuery({
    queryKey: [...USERS_QUERY_KEY, "list", filters],
    queryFn: () => callUsersApi("get_users", filters ?? {}),
  });
}

export function useAdminUserDetail(userId: string | null) {
  return useQuery({
    queryKey: [...USERS_QUERY_KEY, "detail", userId],
    queryFn: () => callUsersApi("get_user_detail", { userId }),
    enabled: !!userId,
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { userId: string; status: string; reason?: string }) =>
      callUsersApi("update_user_status", params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
      toast.success("User status updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useAddUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { userId: string; role: AppRole }) =>
      callUsersApi("add_role", params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
      toast.success("Role added");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useRemoveUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { userId: string; role: AppRole }) =>
      callUsersApi("remove_role", params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
      toast.success("Role removed");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useKYCDocuments(status?: string) {
  return useQuery({
    queryKey: [...USERS_QUERY_KEY, "kyc", status],
    queryFn: () => callUsersApi("get_kyc_documents", { status }),
  });
}

export function useReviewKYC() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { documentId: string; action: "approve" | "reject"; rejectionReason?: string }) =>
      callUsersApi("review_kyc", params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
      toast.success("KYC document reviewed");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useRevokeCards() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { userId: string; revealIds: string[]; reason: string }) =>
      callUsersApi("revoke_cards", params),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
      toast.success(`${data.count} cards revoked`);
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useAdjustCredits() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { userId: string; amount: number; reason: string }) =>
      callUsersApi("adjust_credits", params),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
      toast.success(`Credits adjusted. New total: ${data.newTotal}`);
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useSendNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { userId: string; title: string; message: string; type?: string }) =>
      callUsersApi("send_notification", params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
      toast.success("Notification sent");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useModerationLogs(userId?: string) {
  return useQuery({
    queryKey: [...USERS_QUERY_KEY, "logs", userId],
    queryFn: () => callUsersApi("get_moderation_logs", { userId }),
  });
}

// Support tools hooks
export function useSearchUser() {
  return useMutation({
    mutationFn: (query: string) => callUsersApi("search_user", { query }),
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useTransactionHistory(userId: string | null) {
  return useQuery({
    queryKey: [...USERS_QUERY_KEY, "transactions", userId],
    queryFn: () => callUsersApi("get_transaction_history", { userId }),
    enabled: !!userId,
  });
}

export function useAllUserData(userId: string | null) {
  return useQuery({
    queryKey: [...USERS_QUERY_KEY, "all-data", userId],
    queryFn: () => callUsersApi("get_all_user_data", { userId }),
    enabled: !!userId,
  });
}
