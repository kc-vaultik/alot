import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ADMIN_QUERY_KEYS } from "../../constants";
import type { RoomFormData } from "../../types";
import { toast } from "sonner";

export function useCreateRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: RoomFormData) => {
      const { data: room, error } = await supabase
        .from("rooms")
        .insert({
          tier: data.tier,
          category: data.category,
          product_class_id: data.product_class_id,
          mystery_product_id: data.mystery_product_id,
          is_mystery: data.is_mystery,
          start_at: data.start_at,
          end_at: data.end_at,
          lock_at: data.lock_at,
          deadline_at: data.deadline_at,
          min_participants: data.min_participants,
          max_participants: data.max_participants,
          escrow_target_cents: data.escrow_target_cents,
          tier_cap_cents: data.tier_cap_cents,
          funding_target_cents: data.funding_target_cents,
          reward_budget_cents: data.reward_budget_cents,
          leaderboard_visibility: data.leaderboard_visibility,
          status: "OPEN",
        })
        .select()
        .single();

      if (error) throw error;
      return room;
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

export function useUpdateRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roomId, data }: { roomId: string; data: Partial<RoomFormData> }) => {
      const { data: room, error } = await supabase
        .from("rooms")
        .update(data)
        .eq("id", roomId)
        .select()
        .single();

      if (error) throw error;
      return room;
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

export function useCancelRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roomId: string) => {
      const { data: room, error } = await supabase
        .from("rooms")
        .update({ status: "CANCELLED" })
        .eq("id", roomId)
        .select()
        .single();

      if (error) throw error;
      return room;
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
