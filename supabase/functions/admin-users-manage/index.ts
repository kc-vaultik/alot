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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } }
    );

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: isAdmin } = await supabaseAdmin.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, ...params } = await req.json();
    console.log(`[admin-users-manage] Action: ${action}`, params);

    let result;
    switch (action) {
      case "get_users": {
        let query = supabaseAdmin.from("collector_profiles").select("*");
        if (params.search) query = query.or(`username.ilike.%${params.search}%,display_name.ilike.%${params.search}%`);
        if (params.status) query = query.eq("status", params.status);
        const { data: profiles, error } = await query.order("created_at", { ascending: false }).range(params.offset || 0, (params.offset || 0) + (params.limit || 50) - 1);
        if (error) throw error;
        const userIds = profiles?.map((p: any) => p.user_id) ?? [];
        if (userIds.length === 0) { result = []; break; }
        const { data: roles } = await supabaseAdmin.from("user_roles").select("user_id, role").in("user_id", userIds);
        const { data: cardCounts } = await supabaseAdmin.from("reveals").select("user_id").in("user_id", userIds);
        const { data: purchases } = await supabaseAdmin.from("purchases").select("user_id, total_price_usd").in("user_id", userIds);
        result = profiles?.map((profile: any) => ({
          id: profile.user_id,
          created_at: profile.created_at,
          profile,
          roles: roles?.filter((r: any) => r.user_id === profile.user_id).map((r: any) => r.role) ?? [],
          status: profile.status || "active",
          card_count: cardCounts?.filter((c: any) => c.user_id === profile.user_id).length ?? 0,
          total_spent_usd: purchases?.filter((p: any) => p.user_id === profile.user_id).reduce((sum: number, p: any) => sum + Number(p.total_price_usd), 0) ?? 0,
        }));
        if (params.role) result = result?.filter((u: any) => u.roles.includes(params.role)) ?? [];
        break;
      }
      case "get_user_detail": {
        const { userId } = params;
        const { data: profile } = await supabaseAdmin.from("collector_profiles").select("*").eq("user_id", userId).single();
        const { data: roles } = await supabaseAdmin.from("user_roles").select("role, created_at").eq("user_id", userId);
        const { data: cards } = await supabaseAdmin.from("reveals").select("*, product_classes(*)").eq("user_id", userId).order("created_at", { ascending: false }).limit(100);
        const { data: purchases } = await supabaseAdmin.from("purchases").select("*").eq("user_id", userId).order("created_at", { ascending: false });
        const { data: universalCredits } = await supabaseAdmin.from("user_universal_credits").select("credits").eq("user_id", userId).single();
        const { data: productCredits } = await supabaseAdmin.from("user_product_credits").select("*, product_classes(name)").eq("user_id", userId);
        const { data: kycDocs } = await supabaseAdmin.from("kyc_documents").select("*").eq("user_id", userId).order("submitted_at", { ascending: false });
        const { data: moderationLogs } = await supabaseAdmin.from("moderation_logs").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(20);
        const { data: awards } = await supabaseAdmin.from("awards").select("*, product_classes(name)").eq("user_id", userId).order("created_at", { ascending: false });
        const { data: roomEntries } = await supabaseAdmin.from("room_entries").select("*, rooms(tier, status, product_class_id)").eq("user_id", userId).order("staked_at", { ascending: false }).limit(50);
        const { data: roomPurchases } = await supabaseAdmin.from("room_entry_purchases").select("*").eq("user_id", userId).order("created_at", { ascending: false });
        result = {
          profile, roles: roles ?? [], cards: cards ?? [], purchases: purchases ?? [],
          universalCredits: universalCredits?.credits ?? 0, productCredits: productCredits ?? [],
          kycDocuments: kycDocs ?? [], moderationLogs: moderationLogs ?? [], awards: awards ?? [],
          roomEntries: roomEntries ?? [], roomPurchases: roomPurchases ?? [],
          totalSpent: purchases?.reduce((sum: number, p: any) => sum + Number(p.total_price_usd), 0) ?? 0,
        };
        break;
      }
      case "update_user_status": {
        const { userId, status, reason } = params;
        const { error } = await supabaseAdmin.from("collector_profiles").update({ status }).eq("user_id", userId);
        if (error) throw error;
        await supabaseAdmin.from("moderation_logs").insert({ user_id: userId, action: `status_changed_to_${status}`, reason, performed_by: user.id });
        result = { success: true };
        break;
      }
      case "add_role": {
        const { userId, role } = params;
        const { error } = await supabaseAdmin.from("user_roles").insert({ user_id: userId, role });
        if (error) { if (error.code === "23505") throw new Error("User already has this role"); throw error; }
        await supabaseAdmin.from("moderation_logs").insert({ user_id: userId, action: `role_added_${role}`, performed_by: user.id });
        result = { success: true };
        break;
      }
      case "remove_role": {
        const { userId, role } = params;
        const { error } = await supabaseAdmin.from("user_roles").delete().eq("user_id", userId).eq("role", role);
        if (error) throw error;
        await supabaseAdmin.from("moderation_logs").insert({ user_id: userId, action: `role_removed_${role}`, performed_by: user.id });
        result = { success: true };
        break;
      }
      case "get_kyc_documents": {
        let query = supabaseAdmin.from("kyc_documents").select("*, collector_profiles!inner(username, display_name)").order("submitted_at", { ascending: true });
        if (params.status) query = query.eq("status", params.status);
        const { data, error } = await query;
        if (error) throw error;
        result = data;
        break;
      }
      case "review_kyc": {
        const { documentId, action: kycAction, rejectionReason } = params;
        const updateData: any = { status: kycAction === "approve" ? "approved" : "rejected", reviewed_at: new Date().toISOString() };
        if (kycAction === "reject" && rejectionReason) updateData.rejection_reason = rejectionReason;
        const { data, error } = await supabaseAdmin.from("kyc_documents").update(updateData).eq("id", documentId).select().single();
        if (error) throw error;
        await supabaseAdmin.from("moderation_logs").insert({ user_id: data.user_id, action: `kyc_${kycAction}`, reason: rejectionReason, details: { document_id: documentId, document_type: data.document_type }, performed_by: user.id });
        result = { success: true };
        break;
      }
      case "revoke_cards": {
        const { userId, revealIds, reason } = params;
        const { error } = await supabaseAdmin.from("reveals").update({ card_state: "revoked" }).in("id", revealIds).eq("user_id", userId);
        if (error) throw error;
        await supabaseAdmin.from("moderation_logs").insert({ user_id: userId, action: "cards_revoked", reason, details: { reveal_ids: revealIds, count: revealIds.length }, performed_by: user.id });
        result = { success: true, count: revealIds.length };
        break;
      }
      case "adjust_credits": {
        const { userId, amount, reason } = params;
        const { data: current } = await supabaseAdmin.from("user_universal_credits").select("credits").eq("user_id", userId).single();
        const newAmount = (current?.credits ?? 0) + amount;
        if (newAmount < 0) throw new Error("Cannot reduce credits below zero");
        const { error } = await supabaseAdmin.from("user_universal_credits").upsert({ user_id: userId, credits: newAmount, updated_at: new Date().toISOString() });
        if (error) throw error;
        await supabaseAdmin.from("moderation_logs").insert({ user_id: userId, action: amount > 0 ? "credits_added" : "credits_removed", reason, details: { amount, new_total: newAmount }, performed_by: user.id });
        result = { success: true, newTotal: newAmount };
        break;
      }
      case "send_notification": {
        const { userId, title, message, type = "admin" } = params;
        const { error } = await supabaseAdmin.from("notifications").insert({ user_id: userId, title, message, type });
        if (error) throw error;
        await supabaseAdmin.from("moderation_logs").insert({ user_id: userId, action: "notification_sent", details: { title, type }, performed_by: user.id });
        result = { success: true };
        break;
      }
      case "get_moderation_logs": {
        let query = supabaseAdmin.from("moderation_logs").select("*").order("created_at", { ascending: false });
        if (params.userId) query = query.eq("user_id", params.userId);
        const { data, error } = await query.range(params.offset || 0, (params.offset || 0) + (params.limit || 50) - 1);
        if (error) throw error;
        result = data;
        break;
      }
      case "search_user": {
        const { query: searchQuery } = params;
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(searchQuery);
        const isEmail = searchQuery.includes("@");
        let searchResult = null;
        if (isUUID) {
          const { data } = await supabaseAdmin.from("collector_profiles").select("*").eq("user_id", searchQuery).single();
          searchResult = data;
        } else if (isEmail) {
          const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
          const authUser = authUsers?.users?.find((u: any) => u.email?.toLowerCase() === searchQuery.toLowerCase());
          if (authUser) {
            const { data } = await supabaseAdmin.from("collector_profiles").select("*").eq("user_id", authUser.id).single();
            searchResult = data ? { ...data, email: authUser.email } : null;
          }
        } else {
          const { data } = await supabaseAdmin.from("collector_profiles").select("*").ilike("username", `%${searchQuery}%`).limit(10);
          searchResult = data;
        }
        result = searchResult;
        break;
      }
      case "get_transaction_history": {
        const { userId } = params;
        const { data: purchases } = await supabaseAdmin.from("purchases").select("*").eq("user_id", userId).order("created_at", { ascending: false });
        const { data: roomPurchases } = await supabaseAdmin.from("room_entry_purchases").select("*, rooms(tier, product_class_id)").eq("user_id", userId).order("created_at", { ascending: false });
        const { data: creditPurchases } = await supabaseAdmin.from("room_entry_credit_purchases").select("*, rooms(tier)").eq("user_id", userId).order("created_at", { ascending: false });
        result = { purchases: purchases ?? [], roomPurchases: roomPurchases ?? [], creditPurchases: creditPurchases ?? [] };
        break;
      }
      case "get_all_user_data": {
        const { userId } = params;
        const { data: profile } = await supabaseAdmin.from("collector_profiles").select("*").eq("user_id", userId).single();
        const { data: reveals } = await supabaseAdmin.from("reveals").select("*, product_classes(name, category, band)").eq("user_id", userId).order("created_at", { ascending: false });
        const { data: roomEntries } = await supabaseAdmin.from("room_entries").select("*, rooms(tier, status, end_at, product_class_id, product_classes(name))").eq("user_id", userId).order("staked_at", { ascending: false });
        const { data: awards } = await supabaseAdmin.from("awards").select("*, product_classes(name, retail_value_usd)").eq("user_id", userId).order("created_at", { ascending: false });
        const { data: battleSets } = await supabaseAdmin.from("battle_sets").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(20);
        const { data: battles } = await supabaseAdmin.from("battles").select("*").or(`user_a.eq.${userId},user_b.eq.${userId}`).order("created_at", { ascending: false }).limit(20);
        const { data: transfers } = await supabaseAdmin.from("card_transfers").select("*, reveals(product_class_id, product_classes(name))").or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`).order("created_at", { ascending: false }).limit(20);
        result = { profile, reveals: reveals ?? [], roomEntries: roomEntries ?? [], awards: awards ?? [], battleSets: battleSets ?? [], battles: battles ?? [], transfers: transfers ?? [] };
        break;
      }
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[admin-users-manage] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
