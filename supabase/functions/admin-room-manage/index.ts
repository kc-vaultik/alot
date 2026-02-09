import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RoomData {
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
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify admin role
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: isAdmin } = await supabaseClient.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action, roomId, data } = body;

    console.log("Admin room manage:", action, roomId);

    switch (action) {
      case "create": {
        const roomData = data as RoomData;
        const { data: room, error } = await supabaseClient
          .from("rooms")
          .insert({
            tier: roomData.tier,
            category: roomData.category || null,
            product_class_id: roomData.product_class_id || null,
            mystery_product_id: roomData.mystery_product_id || null,
            is_mystery: roomData.is_mystery,
            start_at: roomData.start_at,
            end_at: roomData.end_at,
            lock_at: roomData.lock_at || null,
            deadline_at: roomData.deadline_at || null,
            min_participants: roomData.min_participants,
            max_participants: roomData.max_participants,
            escrow_target_cents: roomData.escrow_target_cents,
            tier_cap_cents: roomData.tier_cap_cents,
            funding_target_cents: roomData.funding_target_cents || null,
            reward_budget_cents: roomData.reward_budget_cents || 0,
            leaderboard_visibility: roomData.leaderboard_visibility || "after_close",
            status: "OPEN",
          })
          .select()
          .single();

        if (error) throw error;
        console.log("Room created:", room.id);
        return new Response(JSON.stringify({ room }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "update": {
        if (!roomId) throw new Error("roomId required");
        const { data: room, error } = await supabaseClient
          .from("rooms")
          .update(data)
          .eq("id", roomId)
          .select()
          .single();

        if (error) throw error;
        console.log("Room updated:", roomId);
        return new Response(JSON.stringify({ room }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "cancel": {
        if (!roomId) throw new Error("roomId required");
        
        // Get room to check status
        const { data: existingRoom } = await supabaseClient
          .from("rooms")
          .select("status")
          .eq("id", roomId)
          .single();

        if (existingRoom?.status === "SETTLED" || existingRoom?.status === "CANCELLED") {
          throw new Error("Cannot cancel a room that is already settled or cancelled");
        }

        const { data: room, error } = await supabaseClient
          .from("rooms")
          .update({ status: "CANCELLED" })
          .eq("id", roomId)
          .select()
          .single();

        if (error) throw error;
        console.log("Room cancelled:", roomId);
        return new Response(JSON.stringify({ room }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "force_settle": {
        if (!roomId) throw new Error("roomId required");
        
        // Get room details
        const { data: room } = await supabaseClient
          .from("rooms")
          .select("*")
          .eq("id", roomId)
          .single();

        if (!room) throw new Error("Room not found");
        if (room.status === "SETTLED") throw new Error("Room already settled");
        if (room.status === "CANCELLED") throw new Error("Cannot settle cancelled room");

        // Call the settle_room function
        const { data: settleResult, error: settleError } = await supabaseClient
          .rpc("settle_room", { p_room_id: roomId });

        if (settleError) throw settleError;
        console.log("Room force-settled:", roomId, settleResult);
        return new Response(JSON.stringify({ result: settleResult }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "extend_deadline": {
        if (!roomId || !data?.new_deadline) throw new Error("roomId and new_deadline required");
        
        const { data: room, error } = await supabaseClient
          .from("rooms")
          .update({ 
            deadline_at: data.new_deadline,
            end_at: data.new_end_at || data.new_deadline,
          })
          .eq("id", roomId)
          .select()
          .single();

        if (error) throw error;
        console.log("Room deadline extended:", roomId);
        return new Response(JSON.stringify({ room }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "set_winner": {
        if (!roomId || !data?.winner_entry_id) throw new Error("roomId and winner_entry_id required");
        
        // Get entry to get user_id
        const { data: entry } = await supabaseClient
          .from("room_entries")
          .select("user_id")
          .eq("id", data.winner_entry_id)
          .single();

        if (!entry) throw new Error("Entry not found");

        const { data: room, error } = await supabaseClient
          .from("rooms")
          .update({ 
            winner_entry_id: data.winner_entry_id,
            winner_user_id: entry.user_id,
            status: "SETTLED",
          })
          .eq("id", roomId)
          .select()
          .single();

        if (error) throw error;
        console.log("Room winner set manually:", roomId, data.winner_entry_id);
        return new Response(JSON.stringify({ room }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_entries": {
        if (!roomId) throw new Error("roomId required");
        
        const { data: entries, error } = await supabaseClient
          .from("room_entries")
          .select(`
            *,
            reveals:reveal_id (
              id,
              band,
              is_golden,
              serial_number,
              product_classes:product_class_id (name, brand, image_url)
            )
          `)
          .eq("room_id", roomId)
          .order("priority_score", { ascending: false, nullsFirst: false });

        if (error) throw error;
        return new Response(JSON.stringify({ entries }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Admin room manage error:", error);
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
