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
      // Product actions
      case "create-product": {
        const { data, error } = await supabase
          .from("product_classes")
          .insert(params.product)
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      case "update-product": {
        const { data, error } = await supabase
          .from("product_classes")
          .update(params.product)
          .eq("id", params.productId)
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      case "delete-product": {
        // Check if product has inventory or reveals
        const { count: inventoryCount } = await supabase
          .from("inventory_items")
          .select("*", { count: "exact", head: true })
          .eq("product_class_id", params.productId);

        const { count: revealCount } = await supabase
          .from("reveals")
          .select("*", { count: "exact", head: true })
          .eq("product_class_id", params.productId);

        if ((inventoryCount ?? 0) > 0 || (revealCount ?? 0) > 0) {
          throw new Error("Cannot delete product with existing inventory or reveals. Deactivate instead.");
        }

        const { error } = await supabase
          .from("product_classes")
          .delete()
          .eq("id", params.productId);
        if (error) throw error;
        result = { success: true };
        break;
      }

      case "get-products-with-inventory": {
        const { data: products, error } = await supabase
          .from("product_classes")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;

        // Get inventory counts for each product
        const productsWithCounts = await Promise.all(
          (products ?? []).map(async (product) => {
            const { count: total } = await supabase
              .from("inventory_items")
              .select("*", { count: "exact", head: true })
              .eq("product_class_id", product.id);

            const { count: available } = await supabase
              .from("inventory_items")
              .select("*", { count: "exact", head: true })
              .eq("product_class_id", product.id)
              .is("reserved_for_award_id", null)
              .neq("status", "UNAVAILABLE");

            return {
              ...product,
              inventory_count: total ?? 0,
              available_count: available ?? 0,
            };
          })
        );
        result = productsWithCounts;
        break;
      }

      // Inventory actions
      case "create-inventory-item": {
        const { data, error } = await supabase
          .from("inventory_items")
          .insert(params.item)
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      case "create-inventory-batch": {
        const items = Array.from({ length: params.quantity }, () => ({
          product_class_id: params.productClassId,
          status: params.status || "IN_CUSTODY",
          supplier_id: params.supplierId,
          cost_usd: params.costUsd,
          notes: params.notes,
        }));

        const { data, error } = await supabase
          .from("inventory_items")
          .insert(items)
          .select();
        if (error) throw error;
        result = { created: data?.length ?? 0, items: data };
        break;
      }

      case "update-inventory-item": {
        const { data, error } = await supabase
          .from("inventory_items")
          .update(params.item)
          .eq("id", params.itemId)
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      case "delete-inventory-item": {
        // Can only delete if not reserved
        const { data: item } = await supabase
          .from("inventory_items")
          .select("reserved_for_award_id")
          .eq("id", params.itemId)
          .single();

        if (item?.reserved_for_award_id) {
          throw new Error("Cannot delete reserved inventory item");
        }

        const { error } = await supabase
          .from("inventory_items")
          .delete()
          .eq("id", params.itemId);
        if (error) throw error;
        result = { success: true };
        break;
      }

      case "get-inventory": {
        let query = supabase
          .from("inventory_items")
          .select(`
            *,
            product_class:product_classes(id, name, brand, model, image_url, category),
            supplier:suppliers(id, name)
          `)
          .order("created_at", { ascending: false });

        if (params.productClassId) {
          query = query.eq("product_class_id", params.productClassId);
        }
        if (params.status) {
          query = query.eq("status", params.status);
        }
        if (params.supplierId) {
          query = query.eq("supplier_id", params.supplierId);
        }

        const { data, error } = await query;
        if (error) throw error;
        result = data;
        break;
      }

      // Supplier actions
      case "get-suppliers": {
        const { data, error } = await supabase
          .from("suppliers")
          .select("*")
          .order("name");
        if (error) throw error;
        result = data;
        break;
      }

      case "create-supplier": {
        const { data, error } = await supabase
          .from("suppliers")
          .insert(params.supplier)
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      case "update-supplier": {
        const { data, error } = await supabase
          .from("suppliers")
          .update(params.supplier)
          .eq("id", params.supplierId)
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      case "delete-supplier": {
        // Check if supplier has inventory items
        const { count } = await supabase
          .from("inventory_items")
          .select("*", { count: "exact", head: true })
          .eq("supplier_id", params.supplierId);

        if ((count ?? 0) > 0) {
          throw new Error("Cannot delete supplier with existing inventory items");
        }

        const { error } = await supabase
          .from("suppliers")
          .delete()
          .eq("id", params.supplierId);
        if (error) throw error;
        result = { success: true };
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
    console.error("Admin inventory manage error:", error);
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
