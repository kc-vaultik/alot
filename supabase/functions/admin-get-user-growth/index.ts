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

    console.log("Admin user growth request from user:", user.id, "for", days, "days");

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get all users
    const { data: authData, error: usersError } = await supabaseClient.auth.admin.listUsers();

    if (usersError) {
      console.error("Error fetching users:", usersError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch users" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const users = authData?.users ?? [];

    // Aggregate users by date
    const usersByDate: Record<string, { date: string; newUsers: number; cumulativeUsers: number }> = {};

    // Initialize all dates
    for (let d = new Date(startDate); d <= new Date(); d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split("T")[0];
      usersByDate[dateKey] = {
        date: dateKey,
        newUsers: 0,
        cumulativeUsers: 0,
      };
    }

    // Count new users per day
    users.forEach((u) => {
      const createdAt = new Date(u.created_at);
      const dateKey = createdAt.toISOString().split("T")[0];
      if (usersByDate[dateKey]) {
        usersByDate[dateKey].newUsers += 1;
      }
    });

    // Calculate cumulative users
    let cumulative = users.filter((u) => new Date(u.created_at) < startDate).length;
    const sortedDates = Object.keys(usersByDate).sort();
    sortedDates.forEach((dateKey) => {
      cumulative += usersByDate[dateKey].newUsers;
      usersByDate[dateKey].cumulativeUsers = cumulative;
    });

    const growthData = Object.values(usersByDate).sort((a, b) => 
      a.date.localeCompare(b.date)
    );

    // Calculate summary stats
    const totalUsers = users.length;
    const newUsersInPeriod = growthData.reduce((sum, d) => sum + d.newUsers, 0);
    const avgDailySignups = newUsersInPeriod / days;

    // Get users with purchases
    const { data: purchasingUsers } = await supabaseClient
      .from("purchases")
      .select("user_id")
      .gte("created_at", startDate.toISOString());

    const uniquePurchasers = new Set(purchasingUsers?.map((p) => p.user_id) ?? []);
    const conversionRate = newUsersInPeriod > 0 
      ? (uniquePurchasers.size / newUsersInPeriod) * 100 
      : 0;

    console.log("User growth data fetched successfully for", days, "days");

    return new Response(
      JSON.stringify({
        growthData,
        summary: {
          totalUsers,
          newUsersInPeriod,
          avgDailySignups: Math.round(avgDailySignups * 100) / 100,
          conversionRate: Math.round(conversionRate * 100) / 100,
          purchasingUsers: uniquePurchasers.size,
        },
        period: { days, startDate: startDate.toISOString() },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error fetching user growth data:", error);
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
