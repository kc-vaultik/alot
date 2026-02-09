/**
 * Room Entry Refund
 * Processes refunds for expired/unfunded lottery rooms
 * 
 * Economy Model v2:
 * - 98% cash refund to user
 * - 2% platform fee retained
 * - No Vault Credits minted for expired rooms
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Platform fee percentage for expired room refunds
const PLATFORM_FEE_PERCENT = 0.02; // 2%

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!stripeSecretKey || !supabaseUrl || !supabaseServiceKey) {
    console.error('[room-entry-refund] Missing required environment variables');
    return new Response(
      JSON.stringify({ error: 'Server configuration error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { room_id, entry_id, user_id } = await req.json();

    if (!room_id || !entry_id || !user_id) {
      return new Response(
        JSON.stringify({ error: 'room_id, entry_id, and user_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[room-entry-refund] Processing refund: room_id=${room_id}, entry_id=${entry_id}, user_id=${user_id}`);

    // Verify room is in refundable state
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', room_id)
      .single();

    if (roomError || !room) {
      console.error('[room-entry-refund] Room not found:', roomError);
      return new Response(
        JSON.stringify({ error: 'Room not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!['EXPIRED', 'REFUNDING'].includes(room.status)) {
      console.log(`[room-entry-refund] Room ${room_id} not eligible for refunds (status: ${room.status})`);
      return new Response(
        JSON.stringify({ error: 'Room is not eligible for refunds' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's purchases for this room
    const { data: purchases, error: purchasesError } = await supabase
      .from('room_entry_purchases')
      .select('*')
      .eq('room_id', room_id)
      .eq('user_id', user_id)
      .not('stripe_payment_intent_id', 'is', null);

    if (purchasesError || !purchases || purchases.length === 0) {
      console.log('[room-entry-refund] No refundable purchases found');
      return new Response(
        JSON.stringify({ error: 'No refundable purchases found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process refunds for each purchase
    const refundResults = [];
    let totalOriginalCents = 0;
    let totalRefundedCents = 0;
    let totalPlatformFeeCents = 0;

    for (const purchase of purchases) {
      try {
        // Calculate 98% refund (2% platform fee)
        const platformFeeCents = Math.floor(purchase.amount_cents * PLATFORM_FEE_PERCENT);
        const refundAmountCents = purchase.amount_cents - platformFeeCents;

        console.log(`[room-entry-refund] Processing purchase ${purchase.id}: original=${purchase.amount_cents}, refund=${refundAmountCents}, fee=${platformFeeCents}`);

        // Create partial refund via Stripe
        const refund = await stripe.refunds.create({
          payment_intent: purchase.stripe_payment_intent_id,
          amount: refundAmountCents, // Partial refund - 98%
          reason: 'requested_by_customer',
          metadata: {
            room_id: room_id,
            entry_id: entry_id,
            user_id: user_id,
            original_purchase_id: purchase.id,
            original_amount_cents: purchase.amount_cents,
            platform_fee_cents: platformFeeCents,
            refund_percent: 98,
          },
        });

        refundResults.push({
          purchase_id: purchase.id,
          refund_id: refund.id,
          original_amount_cents: purchase.amount_cents,
          refund_amount_cents: refundAmountCents,
          platform_fee_cents: platformFeeCents,
          status: refund.status,
        });

        totalOriginalCents += purchase.amount_cents;
        totalRefundedCents += refundAmountCents;
        totalPlatformFeeCents += platformFeeCents;

        console.log(`[room-entry-refund] Refund created: ${refund.id} for ${refundAmountCents} cents (98% of ${purchase.amount_cents})`);
      } catch (refundError: unknown) {
        const errMessage = refundError instanceof Error ? refundError.message : 'Unknown error';
        console.error(`[room-entry-refund] Failed to refund purchase ${purchase.id}:`, errMessage);
        refundResults.push({
          purchase_id: purchase.id,
          original_amount_cents: purchase.amount_cents,
          error: errMessage,
        });
      }
    }

    // Update entry status to REFUNDED via RPC
    const { error: updateError } = await supabase.rpc('request_room_refund', {
      p_room_id: room_id,
    });

    if (updateError) {
      console.error('[room-entry-refund] Failed to update entry status:', updateError);
    }

    console.log(`[room-entry-refund] Refund complete: original=${totalOriginalCents}, refunded=${totalRefundedCents}, fee=${totalPlatformFeeCents}`);

    return new Response(
      JSON.stringify({
        success: true,
        original_amount_cents: totalOriginalCents,
        total_refunded_cents: totalRefundedCents,
        platform_fee_cents: totalPlatformFeeCents,
        platform_fee_percent: PLATFORM_FEE_PERCENT * 100,
        refunds: refundResults,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('[room-entry-refund] Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to process refund';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
