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

    // Read days from request body (POST) or URL params (GET)
    let days = 30;
    if (req.method === "POST") {
      try {
        const body = await req.json();
        days = parseInt(body.days ?? "30", 10);
      } catch {
        // Use default if body parsing fails
      }
    } else {
      const url = new URL(req.url);
      days = parseInt(url.searchParams.get("days") ?? "30", 10);
    }

    console.log("Admin revenue request from user:", user.id, "for", days, "days");

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get purchases for the period
    const { data: purchases } = await supabaseClient
      .from("purchases")
      .select("total_price_usd, created_at, tier, quantity")
      .gte("created_at", startDate.toISOString())
      .order("created_at");

    // Get room entry purchases
    const { data: roomEntries } = await supabaseClient
      .from("room_entry_purchases")
      .select("amount_cents, created_at, tickets_granted")
      .gte("created_at", startDate.toISOString())
      .order("created_at");

    // Aggregate by date
    const revenueByDate: Record<string, {
      date: string;
      packRevenue: number;
      roomEntryRevenue: number;
      totalRevenue: number;
      packPurchases: number;
      roomEntries: number;
    }> = {};

    // Initialize all dates
    for (let d = new Date(startDate); d <= new Date(); d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split("T")[0];
      revenueByDate[dateKey] = {
        date: dateKey,
        packRevenue: 0,
        roomEntryRevenue: 0,
        totalRevenue: 0,
        packPurchases: 0,
        roomEntries: 0,
      };
    }

    // Aggregate pack purchases
    purchases?.forEach((p) => {
      const dateKey = p.created_at.split("T")[0];
      if (revenueByDate[dateKey]) {
        revenueByDate[dateKey].packRevenue += Number(p.total_price_usd);
        revenueByDate[dateKey].totalRevenue += Number(p.total_price_usd);
        revenueByDate[dateKey].packPurchases += p.quantity;
      }
    });

    // Aggregate room entries
    roomEntries?.forEach((e) => {
      const dateKey = e.created_at.split("T")[0];
      if (revenueByDate[dateKey]) {
        const amount = Number(e.amount_cents) / 100;
        revenueByDate[dateKey].roomEntryRevenue += amount;
        revenueByDate[dateKey].totalRevenue += amount;
        revenueByDate[dateKey].roomEntries += 1;
      }
    });

    const revenueData = Object.values(revenueByDate).sort((a, b) => 
      a.date.localeCompare(b.date)
    );

    // Calculate totals
    const totals = {
      totalRevenue: revenueData.reduce((sum, d) => sum + d.totalRevenue, 0),
      packRevenue: revenueData.reduce((sum, d) => sum + d.packRevenue, 0),
      roomEntryRevenue: revenueData.reduce((sum, d) => sum + d.roomEntryRevenue, 0),
      packPurchases: revenueData.reduce((sum, d) => sum + d.packPurchases, 0),
      roomEntries: revenueData.reduce((sum, d) => sum + d.roomEntries, 0),
    };

    // Breakdown by tier
    const tierBreakdown: Record<string, { count: number; revenue: number }> = {};
    purchases?.forEach((p) => {
      if (!tierBreakdown[p.tier]) {
        tierBreakdown[p.tier] = { count: 0, revenue: 0 };
      }
      tierBreakdown[p.tier].count += p.quantity;
      tierBreakdown[p.tier].revenue += Number(p.total_price_usd);
    });

    console.log("Revenue data fetched successfully for", days, "days");

    return new Response(
      JSON.stringify({
        revenueData,
        totals,
        tierBreakdown,
        period: { days, startDate: startDate.toISOString() },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error fetching revenue data:", error);
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
