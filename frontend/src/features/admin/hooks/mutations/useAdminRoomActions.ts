import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ADMIN_QUERY_KEYS } from "../../constants";
import { toast } from "sonner";

async function invokeAdminRoomManage(action: string, roomId?: string, data?: unknown) {
  const { data: session } = await supabase.auth.getSession();
  if (!session?.session?.access_token) {
    throw new Error("Not authenticated");
  }

  const { data: result, error } = await supabase.functions.invoke("admin-room-manage", {
    headers: {
      Authorization: `Bearer ${session.session.access_token}`,
    },
    body: { action, roomId, data },
  });

  if (error) throw error;
  if (result?.error) throw new Error(result.error);
  return result;
}

export function useAdminCreateRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
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
    }) => {
      return invokeAdminRoomManage("create", undefined, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.rooms });
      toast.success("Room created successfully");
    },
    onError: (error) => {
      toast.error(`Failed to create room: ${error.message}`);
    },
  });
}

export function useAdminUpdateRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roomId, data }: { roomId: string; data: Record<string, unknown> }) => {
      return invokeAdminRoomManage("update", roomId, data);
    },
    onSuccess: (_, { roomId }) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.rooms });
      queryClient.invalidateQueries({ queryKey: [...ADMIN_QUERY_KEYS.rooms, roomId] });
      toast.success("Room updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update room: ${error.message}`);
    },
  });
}

export function useAdminCancelRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roomId: string) => {
      return invokeAdminRoomManage("cancel", roomId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.rooms });
      toast.success("Room cancelled");
    },
    onError: (error) => {
      toast.error(`Failed to cancel room: ${error.message}`);
    },
  });
}

export function useAdminExtendDeadline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roomId, newDeadline }: { roomId: string; newDeadline: string }) => {
      return invokeAdminRoomManage("extend_deadline", roomId, { new_deadline: newDeadline });
    },
    onSuccess: (_, { roomId }) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.rooms });
      queryClient.invalidateQueries({ queryKey: [...ADMIN_QUERY_KEYS.rooms, roomId] });
      toast.success("Deadline extended");
    },
    onError: (error) => {
      toast.error(`Failed to extend deadline: ${error.message}`);
    },
  });
}

export function useAdminForceSettle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roomId: string) => {
      return invokeAdminRoomManage("force_settle", roomId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.rooms });
      toast.success("Room settled");
    },
    onError: (error) => {
      toast.error(`Failed to settle room: ${error.message}`);
    },
  });
}

export function useAdminSetWinner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roomId, winnerEntryId }: { roomId: string; winnerEntryId: string }) => {
      return invokeAdminRoomManage("set_winner", roomId, { winner_entry_id: winnerEntryId });
    },
    onSuccess: (_, { roomId }) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.rooms });
      queryClient.invalidateQueries({ queryKey: [...ADMIN_QUERY_KEYS.rooms, roomId] });
      toast.success("Winner set successfully");
    },
    onError: (error) => {
      toast.error(`Failed to set winner: ${error.message}`);
    },
  });
}

export function useAdminGetEntries(roomId: string) {
  return useQuery({
    queryKey: [...ADMIN_QUERY_KEYS.rooms, roomId, "entries"],
    queryFn: async () => {
      return invokeAdminRoomManage("get_entries", roomId);
    },
    enabled: !!roomId,
  });
}
