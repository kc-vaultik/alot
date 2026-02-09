import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    // Read limit from request body (POST) or URL params (GET)
    let limit = 20;
    if (req.method === "POST") {
      try {
        const body = await req.json();
        limit = parseInt(body.limit ?? "20", 10);
      } catch {
        // Use default if body parsing fails
      }
    } else {
      const url = new URL(req.url);
      limit = parseInt(url.searchParams.get("limit") ?? "20", 10);
    }

    console.log("Admin activity request from user:", user.id, "limit:", limit);

    // Fetch recent purchases
    const { data: recentPurchases } = await supabaseClient
      .from("purchases")
      .select("id, user_id, total_price_usd, tier, quantity, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    // Fetch recent reveals
    const { data: recentReveals } = await supabaseClient
      .from("reveals")
      .select("id, user_id, band, is_golden, revealed_at, product_class_id, product_classes(name)")
      .not("revealed_at", "is", null)
      .order("revealed_at", { ascending: false })
      .limit(limit);

    // Fetch recent room entries
    const { data: recentRoomEntries } = await supabaseClient
      .from("room_entries")
      .select("id, user_id, room_id, tickets, staked_at, rooms(tier, product_class_id, product_classes(name))")
      .order("staked_at", { ascending: false })
      .limit(limit);

    // Fetch recent awards
    const { data: recentAwards } = await supabaseClient
      .from("awards")
      .select("id, user_id, status, reserved_cost_usd, created_at, product_class_id, product_classes(name)")
      .order("created_at", { ascending: false })
      .limit(limit);

    // Fetch recent card transfers
    const { data: recentTransfers } = await supabaseClient
      .from("card_transfers")
      .select("id, from_user_id, to_user_id, transfer_type, status, created_at, reveal_id")
      .order("created_at", { ascending: false })
      .limit(limit);

    // Combine and sort all activities
    const activities: Array<{
      id: string;
      type: string;
      description: string;
      user_id: string;
      amount?: number;
      created_at: string;
      metadata?: Record<string, unknown>;
    }> = [];

    // Add purchases
    recentPurchases?.forEach((p) => {
      activities.push({
        id: p.id,
        type: "purchase",
        description: `${p.tier} pack purchase (${p.quantity}x)`,
        user_id: p.user_id,
        amount: Number(p.total_price_usd),
        created_at: p.created_at,
        metadata: { tier: p.tier, quantity: p.quantity },
      });
    });

    // Add reveals
    recentReveals?.forEach((r) => {
      const pc = r.product_classes as unknown as { name: string } | null;
      const productName = pc?.name ?? "Unknown";
      activities.push({
        id: r.id,
        type: "reveal",
        description: `${r.band}${r.is_golden ? " GOLDEN" : ""} card revealed: ${productName}`,
        user_id: r.user_id,
        created_at: r.revealed_at!,
        metadata: { band: r.band, is_golden: r.is_golden, product_class_id: r.product_class_id },
      });
    });

    // Add room entries
    recentRoomEntries?.forEach((e) => {
      const room = e.rooms as unknown as { tier: string; product_classes: { name: string } | null } | null;
      const productName = room?.product_classes?.name ?? "Unknown";
      activities.push({
        id: e.id,
        type: "room_entry",
        description: `Joined ${room?.tier ?? ""} room for ${productName} (${e.tickets} tickets)`,
        user_id: e.user_id,
        created_at: e.staked_at,
        metadata: { room_id: e.room_id, tickets: e.tickets },
      });
    });

    // Add awards
    recentAwards?.forEach((a) => {
      const apc = a.product_classes as unknown as { name: string } | null;
      const productName = apc?.name ?? "Unknown";
      activities.push({
        id: a.id,
        type: "award",
        description: `Award ${a.status.toLowerCase()}: ${productName}`,
        user_id: a.user_id,
        amount: Number(a.reserved_cost_usd),
        created_at: a.created_at,
        metadata: { status: a.status, product_class_id: a.product_class_id },
      });
    });

    // Add transfers
    recentTransfers?.forEach((t) => {
      activities.push({
        id: t.id,
        type: "transfer",
        description: `Card ${t.transfer_type.toLowerCase()} (${t.status.toLowerCase()})`,
        user_id: t.from_user_id,
        created_at: t.created_at,
        metadata: { transfer_type: t.transfer_type, to_user_id: t.to_user_id, reveal_id: t.reveal_id },
      });
    });

    // Sort by created_at descending
    activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Limit to requested amount
    const limitedActivities = activities.slice(0, limit);

    console.log("Activity data fetched successfully, count:", limitedActivities.length);

    return new Response(
      JSON.stringify({ activities: limitedActivities }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error fetching activity data:", error);
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
