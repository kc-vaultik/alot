import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!stripeSecretKey || !webhookSecret || !supabaseUrl || !supabaseServiceKey) {
    console.error('Missing required environment variables');
    return new Response(
      JSON.stringify({ error: 'Server configuration error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Read raw body ONCE (critical for signature verification)
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    console.error('No stripe-signature header');
    return new Response(
      JSON.stringify({ error: 'No signature' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Verify signature
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Webhook signature verification failed:', errMessage);
    return new Response(
      JSON.stringify({ error: 'Invalid signature' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  console.log(`[room-entry-webhook] Received event: ${event.type} (${event.id})`);

  // Idempotency check
  const { data: existingEvent } = await supabase
    .from('webhook_events')
    .select('id')
    .eq('event_id', event.id)
    .eq('provider', 'stripe_room_entry')
    .single();

  if (existingEvent) {
    console.log(`Event ${event.id} already processed, skipping`);
    return new Response(
      JSON.stringify({ received: true, status: 'already_processed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Insert webhook event for tracking
  await supabase.from('webhook_events').insert({
    event_id: event.id,
    provider: 'stripe_room_entry',
    event_type: event.type,
    payload: event,
    processed: false,
  });

  // Handle checkout.session.completed
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    // Only process room entry purchases
    if (session.metadata?.type !== 'room_entry') {
      console.log('Not a room entry purchase, skipping');
      await markEventProcessed(supabase, event.id);
      return new Response(
        JSON.stringify({ received: true, status: 'skipped' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { room_id, user_id, amount_cents } = session.metadata;
    
    console.log(`Processing room entry: room_id=${room_id}, user_id=${user_id}, amount=${amount_cents}`);

    try {
      // Call buy_room_entry RPC with service role (bypasses RLS)
      const { data, error: rpcError } = await supabase.rpc('buy_room_entry', {
        p_room_id: room_id,
        p_amount_cents: parseInt(amount_cents),
        p_stripe_session_id: session.id,
        p_stripe_payment_intent_id: session.payment_intent as string,
        p_user_id: user_id,
      });

      if (rpcError) {
        console.error('buy_room_entry RPC error:', rpcError);
        throw rpcError;
      }

      console.log('Room entry processed successfully:', data);

      // Mark webhook processed
      await markEventProcessed(supabase, event.id);

      return new Response(
        JSON.stringify({ 
          received: true, 
          status: 'processed',
          entry_id: data.entry_id,
          tickets_granted: data.tickets_granted,
          funding_progress: data.funding_progress,
          room_status: data.room_status,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Failed to process room entry:', err);
      return new Response(
        JSON.stringify({ error: 'Failed to process room entry', details: errMessage }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  // Handle refund events
  if (event.type === 'charge.refunded') {
    const charge = event.data.object as Stripe.Charge;
    console.log(`Refund processed for charge: ${charge.id}`);
    await markEventProcessed(supabase, event.id);
    return new Response(
      JSON.stringify({ received: true, status: 'refund_logged' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  await markEventProcessed(supabase, event.id);
  
  return new Response(
    JSON.stringify({ received: true, status: 'event_type_not_handled' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});

async function markEventProcessed(supabase: any, eventId: string) {
  const { error } = await supabase
    .from('webhook_events')
    .update({ processed: true, processed_at: new Date().toISOString() })
    .eq('event_id', eventId)
    .eq('provider', 'stripe_room_entry');
  
  if (error) {
    console.error('Failed to mark event as processed:', error);
  }
}
