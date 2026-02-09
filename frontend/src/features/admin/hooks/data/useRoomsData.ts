import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ADMIN_QUERY_KEYS } from "../../constants";
import type { Room } from "../../types";

export function useAdminRooms(filters?: { status?: string; tier?: string; category?: string }) {
  return useQuery({
    queryKey: [...ADMIN_QUERY_KEYS.rooms, filters],
    queryFn: async (): Promise<Room[]> => {
      let query = supabase.from("rooms").select("*");

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }
      if (filters?.tier) {
        query = query.eq("tier", filters.tier);
      }
      if (filters?.category) {
        query = query.eq("category", filters.category);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useRoomDetail(roomId: string) {
  return useQuery({
    queryKey: [...ADMIN_QUERY_KEYS.rooms, roomId, "detail"],
    queryFn: async () => {
      // Get room data
      const { data: room, error: roomError } = await supabase
        .from("rooms")
        .select("*")
        .eq("id", roomId)
        .single();

      if (roomError) throw roomError;

      // Get entries count
      const { count: entriesCount } = await supabase
        .from("room_entries")
        .select("*", { count: "exact", head: true })
        .eq("room_id", roomId);

      // Get product class if set
      let productClass = null;
      if (room.product_class_id) {
        const { data } = await supabase
          .from("product_classes")
          .select("*")
          .eq("id", room.product_class_id)
          .single();
        productClass = data;
      }

      // Get lottery draw if exists
      const { data: lotteryDraw } = await supabase
        .from("lottery_draws")
        .select("*")
        .eq("room_id", roomId)
        .single();

      return {
        room,
        entriesCount: entriesCount ?? 0,
        productClass,
        lotteryDraw,
      };
    },
    enabled: !!roomId,
  });
}
