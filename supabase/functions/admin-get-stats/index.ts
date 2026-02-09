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

    // Check admin role
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

    console.log("Admin stats request from user:", user.id);

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get revenue stats from purchases
    const { data: purchases } = await supabaseClient
      .from("purchases")
      .select("total_price_usd, created_at");

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

    // Get room entry revenue
    const { data: roomEntryPurchases } = await supabaseClient
      .from("room_entry_purchases")
      .select("amount_cents, created_at");

    const roomEntryRevenue = (roomEntryPurchases?.reduce((sum, p) => sum + Number(p.amount_cents), 0) ?? 0) / 100;
    const roomEntryRevenueToday = (roomEntryPurchases
      ?.filter((p) => new Date(p.created_at) >= todayStart)
      .reduce((sum, p) => sum + Number(p.amount_cents), 0) ?? 0) / 100;

    // Get room counts by status
    const { data: rooms } = await supabaseClient.from("rooms").select("status");
    const roomCounts = {
      open: rooms?.filter((r) => r.status === "OPEN").length ?? 0,
      locked: rooms?.filter((r) => r.status === "LOCKED").length ?? 0,
      settled: rooms?.filter((r) => r.status === "SETTLED").length ?? 0,
      cancelled: rooms?.filter((r) => r.status === "CANCELLED").length ?? 0,
    };
    const activeRooms = roomCounts.open + roomCounts.locked;

    // Get reveals count
    const { count: totalCards } = await supabaseClient
      .from("reveals")
      .select("*", { count: "exact", head: true });

    // Get pending awards
    const { count: pendingAwards } = await supabaseClient
      .from("awards")
      .select("*", { count: "exact", head: true })
      .eq("status", "RESERVED");

    // Get user count from auth.users (service role can access this)
    const { data: authUsers, error: usersError } = await supabaseClient.auth.admin.listUsers();
    const totalUsers = usersError ? 0 : (authUsers?.users?.length ?? 0);
    const newUsersToday = usersError ? 0 : (authUsers?.users?.filter(
      (u) => new Date(u.created_at) >= todayStart
    ).length ?? 0);

    // Get pool balances
    const { data: bucketBalances } = await supabaseClient
      .from("bucket_balances")
      .select("*")
      .order("bucket");

    const { data: tierEscrowPools } = await supabaseClient
      .from("tier_escrow_pools")
      .select("*")
      .order("tier");

    const stats = {
      totalRevenue: totalRevenue + roomEntryRevenue,
      revenueToday: revenueToday + roomEntryRevenueToday,
      revenueThisWeek,
      revenueThisMonth,
      activeRooms,
      roomCounts,
      totalUsers,
      newUsersToday,
      totalCards: totalCards ?? 0,
      pendingAwards: pendingAwards ?? 0,
      bucketBalances: bucketBalances ?? [],
      tierEscrowPools: tierEscrowPools ?? [],
    };

    console.log("Admin stats fetched successfully");

    return new Response(JSON.stringify(stats), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error fetching admin stats:", error);
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
