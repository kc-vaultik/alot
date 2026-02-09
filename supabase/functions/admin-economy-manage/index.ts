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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify JWT and admin role
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, ...params } = await req.json();
    let result;

    switch (action) {
      // Pool Balances
      case "get-bucket-balances": {
        const { data, error } = await supabase
          .from("bucket_balances")
          .select("*")
          .order("bucket");
        if (error) throw error;
        result = data;
        break;
      }

      case "update-bucket-balance": {
        const { bucket, amount, reason } = params;
        
        // Get current balance
        const { data: current } = await supabase
          .from("bucket_balances")
          .select("balance_usd")
          .eq("bucket", bucket)
          .single();

        const newBalance = (current?.balance_usd ?? 0) + amount;
        
        // Update balance
        const { data, error } = await supabase
          .from("bucket_balances")
          .update({ balance_usd: newBalance, updated_at: new Date().toISOString() })
          .eq("bucket", bucket)
          .select()
          .single();
        if (error) throw error;

        // Log to pool_ledger
        await supabase.from("pool_ledger").insert({
          bucket,
          event_type: amount > 0 ? "ADD" : "RELEASE",
          amount_usd: Math.abs(amount),
          ref_type: "MANUAL_ADJUSTMENT",
          ref_id: `admin:${user.id}:${reason || "no reason"}`,
        });

        result = data;
        break;
      }

      case "get-tier-escrow-pools": {
        const { data, error } = await supabase
          .from("tier_escrow_pools")
          .select("*")
          .order("tier");
        if (error) throw error;
        result = data;
        break;
      }

      // Economy Configs
      case "get-economy-configs": {
        const { data, error } = await supabase
          .from("economy_configs")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        result = data;
        break;
      }

      case "create-economy-config": {
        const { data, error } = await supabase
          .from("economy_configs")
          .insert({
            version: params.version,
            config: params.config,
            is_active: false,
          })
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      case "activate-economy-config": {
        // Deactivate all other configs
        await supabase
          .from("economy_configs")
          .update({ is_active: false })
          .neq("id", params.configId);

        // Activate this config
        const { data, error } = await supabase
          .from("economy_configs")
          .update({ 
            is_active: true, 
            activated_at: new Date().toISOString() 
          })
          .eq("id", params.configId)
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      case "delete-economy-config": {
        // Can't delete active config
        const { data: config } = await supabase
          .from("economy_configs")
          .select("is_active")
          .eq("id", params.configId)
          .single();

        if (config?.is_active) {
          throw new Error("Cannot delete active config");
        }

        const { error } = await supabase
          .from("economy_configs")
          .delete()
          .eq("id", params.configId);
        if (error) throw error;
        result = { success: true };
        break;
      }

      // Ledgers
      case "get-pool-ledger": {
        let query = supabase
          .from("pool_ledger")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(params.limit || 100);

        if (params.bucket) {
          query = query.eq("bucket", params.bucket);
        }
        if (params.eventType) {
          query = query.eq("event_type", params.eventType);
        }

        const { data, error } = await query;
        if (error) throw error;
        result = data;
        break;
      }

      case "get-escrow-ledger": {
        let query = supabase
          .from("escrow_ledger")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(params.limit || 100);

        if (params.tier) {
          query = query.eq("tier", params.tier);
        }
        if (params.scope) {
          query = query.eq("scope", params.scope);
        }

        const { data, error } = await query;
        if (error) throw error;
        result = data;
        break;
      }

      case "get-category-pool-ledger": {
        let query = supabase
          .from("category_pool_ledger")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(params.limit || 100);

        if (params.category) {
          query = query.eq("category", params.category);
        }

        const { data, error } = await query;
        if (error) throw error;
        result = data;
        break;
      }

      // Category Pricing
      case "get-category-pricing": {
        const { data, error } = await supabase
          .from("category_pricing")
          .select("*")
          .order("category")
          .order("tier");
        if (error) throw error;
        result = data;
        break;
      }

      case "update-category-pricing": {
        const { data, error } = await supabase
          .from("category_pricing")
          .update({
            price_cents: params.priceCents,
            display_name: params.displayName,
            description: params.description,
            is_active: params.isActive,
            updated_at: new Date().toISOString(),
          })
          .eq("id", params.pricingId)
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      case "create-category-pricing": {
        const { data, error } = await supabase
          .from("category_pricing")
          .insert({
            category: params.category,
            tier: params.tier,
            price_cents: params.priceCents,
            display_name: params.displayName,
            description: params.description,
            is_active: params.isActive ?? true,
          })
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      // Promo Spend
      case "get-promo-spend": {
        const { data, error } = await supabase
          .from("promo_spend_daily")
          .select("*")
          .order("spend_date", { ascending: false })
          .limit(params.limit || 30);
        if (error) throw error;
        result = data;
        break;
      }

      // Category Pool Balances
      case "get-category-pool-balances": {
        const { data, error } = await supabase
          .from("category_pool_balances")
          .select("*")
          .order("category");
        if (error) throw error;
        result = data;
        break;
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Admin economy manage error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
