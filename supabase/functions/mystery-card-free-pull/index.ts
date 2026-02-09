import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('Free pull request received');

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  
  // Get user from JWT - extract token directly
  const authHeader = req.headers.get('Authorization');
  console.log('Auth header present:', !!authHeader);
  
  if (!authHeader) {
    console.error('No authorization header provided');
    return new Response(
      JSON.stringify({ error: 'Authentication required' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  if (!authHeader.startsWith('Bearer ')) {
    console.error('Invalid authorization header format - must start with Bearer');
    return new Response(
      JSON.stringify({ error: 'Invalid authorization format' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  // Extract the JWT token and verify it directly with service role client
  const token = authHeader.replace('Bearer ', '');
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Use getUser with the token to verify it - this validates the JWT and returns user data
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);
  
  if (userError || !user) {
    console.error('User authentication failed:', userError?.message);
    console.error('Error code:', userError?.status);
    console.error('Token length:', token.length);
    return new Response(
      JSON.stringify({ error: 'Invalid authentication', details: userError?.message }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  console.log(`Processing free pull for user: ${user.id}`);
  
  // Service role client already created above, use it for RPC call
  const { data, error } = await supabase.rpc('process_daily_free_pull', {
    p_user_id: user.id
  });
  
  if (error) {
    console.error('Free pull RPC error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  if (data?.error) {
    console.log('Free pull returned error:', data.error);
    return new Response(
      JSON.stringify(data),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  console.log('Free pull successful:', data?.reveal?.id);
  
  return new Response(
    JSON.stringify(data),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
