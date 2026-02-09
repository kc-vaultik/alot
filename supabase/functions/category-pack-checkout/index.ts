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
    const { category, tier, quantity, unit_price_cents, user_id, success_url, cancel_url } = await req.json();

    // Validate inputs
    const validCategories = [
      'POKEMON', 'SNEAKERS', 'WATCHES', 'HANDBAGS', 
      'WINE', 'CLOTHING', 'JEWELLERY', 'ART_TOYS', 'SPORT_MEMORABILIA'
    ];
    
    if (!validCategories.includes(category)) {
      return new Response(
        JSON.stringify({ error: `Invalid category. Must be one of: ${validCategories.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validTiers = ['T5', 'T10', 'T20'];
    if (!validTiers.includes(tier)) {
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

    if (!unit_price_cents || unit_price_cents < 100) {
      return new Response(
        JSON.stringify({ error: 'Invalid unit price' }),
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

    // Format category name for display
    const categoryDisplayName = category
      .replace('_', ' & ')
      .split(' ')
      .map((word: string) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');

    const tierLabel = tier === 'T5' ? 'Starter' : tier === 'T10' ? 'Premium' : 'Elite';
    const productName = `${categoryDisplayName} Pack - ${tierLabel}`;
    
    console.log(`Creating category checkout: category=${category}, tier=${tier}, quantity=${quantity}, price=${unit_price_cents}, user_id=${user_id}`);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: productName,
              description: `${quantity} ${categoryDisplayName} Card${quantity > 1 ? 's' : ''} at $${(unit_price_cents / 100).toFixed(2)} each`,
            },
            unit_amount: unit_price_cents,
          },
          quantity: quantity,
        },
      ],
      mode: 'payment',
      success_url: success_url || `${req.headers.get('origin')}/collect-room?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url || `${req.headers.get('origin')}/collect-room?canceled=true`,
      metadata: {
        type: 'category_pack',
        category: category,
        tier: tier,
        quantity: quantity.toString(),
        user_id: user_id,
        unit_price_cents: unit_price_cents.toString(),
      },
    });

    console.log(`Category checkout session created: ${session.id}`);

    return new Response(
      JSON.stringify({ 
        url: session.url, 
        sessionId: session.id 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error creating category checkout session:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create checkout session';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
