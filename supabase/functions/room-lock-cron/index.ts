/**
 * Room Lock Cron
 * Runs every minute to lock rooms when lock_at time has passed
 * Prevents late staking by transitioning OPEN → LOCKED
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('[room-lock-cron] Starting room lock check...');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date().toISOString();

    // Find rooms that need to be locked
    // Status = 'OPEN' and lock_at <= now
    const { data: roomsToLock, error: fetchError } = await supabase
      .from('rooms')
      .select('id, tier, status, lock_at, end_at')
      .eq('status', 'OPEN')
      .not('lock_at', 'is', null)
      .lte('lock_at', now);

    if (fetchError) {
      console.error('[room-lock-cron] Error fetching rooms:', fetchError);
      return new Response(
        JSON.stringify({ success: false, error: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!roomsToLock || roomsToLock.length === 0) {
      console.log('[room-lock-cron] No rooms to lock');
      return new Response(
        JSON.stringify({ success: true, message: 'No rooms to lock', locked: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[room-lock-cron] Found ${roomsToLock.length} rooms to lock:`, 
      roomsToLock.map(r => ({ id: r.id, tier: r.tier, lock_at: r.lock_at }))
    );

    // Lock each room by updating status
    const roomIds = roomsToLock.map(r => r.id);
    
    const { data: updatedRooms, error: updateError } = await supabase
      .from('rooms')
      .update({ status: 'LOCKED' })
      .in('id', roomIds)
      .select('id, tier, status');

    if (updateError) {
      console.error('[room-lock-cron] Error locking rooms:', updateError);
      return new Response(
        JSON.stringify({ success: false, error: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[room-lock-cron] Successfully locked ${updatedRooms?.length || 0} rooms:`, updatedRooms);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Locked ${updatedRooms?.length || 0} rooms`,
        locked: updatedRooms?.length || 0,
        rooms: updatedRooms,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    const error = err as Error;
    console.error('[room-lock-cron] Unexpected error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
