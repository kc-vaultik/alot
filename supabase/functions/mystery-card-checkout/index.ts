import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tier, quantity, user_id, success_url, cancel_url } = await req.json();

    // Validate tier
    const tierPrices: Record<string, { price: number; name: string }> = {
      'T5': { price: 500, name: 'Mystery Card - $5 Tier' },
      'T10': { price: 1000, name: 'Mystery Card - $10 Tier' },
      'T20': { price: 2000, name: 'Mystery Card - $20 Tier' },
    };

    if (!tierPrices[tier]) {
      return new Response(
        JSON.stringify({ error: 'Invalid tier. Must be T5, T10, or T20' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!quantity || quantity < 1 || quantity > 100) {
      return new Response(
        JSON.stringify({ error: 'Invalid quantity. Must be between 1 and 100' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
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

    const tierInfo = tierPrices[tier];
    
    console.log(`Creating checkout session: tier=${tier}, quantity=${quantity}, user_id=${user_id}`);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: tierInfo.name,
              description: `${quantity} Mystery Card${quantity > 1 ? 's' : ''} at $${tierInfo.price / 100} each`,
            },
            unit_amount: tierInfo.price,
          },
          quantity: quantity,
        },
      ],
      mode: 'payment',
      success_url: success_url || `${req.headers.get('origin')}/collect-room?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url || `${req.headers.get('origin')}/collect-room?canceled=true`,
      metadata: {
        type: 'mystery_card',
        tier: tier,
        quantity: quantity.toString(),
        user_id: user_id,
        unit_price_cents: tierInfo.price.toString(),
      },
    });

    console.log(`Checkout session created: ${session.id}`);

    return new Response(
      JSON.stringify({ 
        url: session.url, 
        sessionId: session.id 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error creating checkout session:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create checkout session';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
