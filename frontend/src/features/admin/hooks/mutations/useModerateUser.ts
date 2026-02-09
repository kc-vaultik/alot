import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ADMIN_QUERY_KEYS } from "../../constants";
import type { AppRole, UserModerationAction, KYCReviewAction } from "../../types";
import { toast } from "sonner";

export function useAddUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { data, error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.users });
      queryClient.invalidateQueries({ queryKey: [...ADMIN_QUERY_KEYS.users, userId] });
      toast.success("Role added successfully");
    },
    onError: (error) => {
      toast.error(`Failed to add role: ${error.message}`);
    },
  });
}

export function useRemoveUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role);

      if (error) throw error;
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.users });
      queryClient.invalidateQueries({ queryKey: [...ADMIN_QUERY_KEYS.users, userId] });
      toast.success("Role removed successfully");
    },
    onError: (error) => {
      toast.error(`Failed to remove role: ${error.message}`);
    },
  });
}

export function useReviewKYCDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ document_id, action, rejection_reason }: KYCReviewAction) => {
      const updateData: Record<string, unknown> = {
        status: action === "approve" ? "approved" : "rejected",
        reviewed_at: new Date().toISOString(),
      };

      if (action === "reject" && rejection_reason) {
        updateData.rejection_reason = rejection_reason;
      }

      const { data, error } = await supabase
        .from("kyc_documents")
        .update(updateData)
        .eq("id", document_id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...ADMIN_QUERY_KEYS.users, "kyc"] });
      toast.success("KYC document reviewed");
    },
    onError: (error) => {
      toast.error(`Failed to review document: ${error.message}`);
    },
  });
}

export function useModerateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (action: UserModerationAction) => {
      // For now, moderation actions would need a status column on profiles
      // This is a placeholder for future implementation
      console.log("Moderation action:", action);
      throw new Error("User moderation requires status column on collector_profiles");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.users });
      toast.success("User moderated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to moderate user: ${error.message}`);
    },
  });
}
