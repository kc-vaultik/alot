import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Entry tier pricing
const ENTRY_TIERS = {
  HIGH_VALUE: [
    { cents: 2500, label: '$25' },
    { cents: 5000, label: '$50' },
    { cents: 10000, label: '$100' },
    { cents: 20000, label: '$200' },
  ],
  LOW_VALUE: [
    { cents: 200, label: '$2' },
    { cents: 500, label: '$5' },
    { cents: 1000, label: '$10' },
    { cents: 2000, label: '$20' },
  ],
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { room_id, room_name, amount_cents, user_id, success_url, cancel_url } = await req.json();

    // Validate required fields
    if (!room_id) {
      return new Response(
        JSON.stringify({ error: 'Room ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate amount is in allowed tiers
    const allTiers = [...ENTRY_TIERS.HIGH_VALUE, ...ENTRY_TIERS.LOW_VALUE];
    const validTier = allTiers.find(t => t.cents === amount_cents);
    
    if (!validTier) {
      return new Response(
        JSON.stringify({ error: 'Invalid entry amount. Must be a valid tier price.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      console.error('STRIPE_SECRET_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Payment service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    const tickets = amount_cents / 100;
    const displayName = room_name || 'Lottery Room';
    
    console.log(`Creating room entry checkout: room_id=${room_id}, amount=${amount_cents}, user_id=${user_id}, tickets=${tickets}`);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${displayName} Entry`,
              description: `${tickets} ticket${tickets > 1 ? 's' : ''} for lottery room`,
            },
            unit_amount: amount_cents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: success_url || `${req.headers.get('origin')}/collect-room?room_success=true&room_id=${room_id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url || `${req.headers.get('origin')}/collect-room?room_canceled=true&room_id=${room_id}`,
      metadata: {
        type: 'room_entry',
        room_id: room_id,
        user_id: user_id,
        amount_cents: amount_cents.toString(),
        tickets: tickets.toString(),
      },
    });

    console.log(`Room entry checkout session created: ${session.id}`);

    return new Response(
      JSON.stringify({ 
        url: session.url, 
        sessionId: session.id,
        tickets: tickets,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error creating room entry checkout session:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create checkout session';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
