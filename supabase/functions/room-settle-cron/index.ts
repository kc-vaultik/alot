/**
 * Room Settle Cron
 * Runs every minute to:
 * 1. Draw winners for FUNDED lottery rooms (using draw_room_winner)
 * 2. Mark rooms as EXPIRED if past deadline and not funded
 * 3. Transition OPEN rooms to FUNDED when funding target met
 * 
 * Settlement Flow:
 * - OPEN + funded → FUNDED (auto-transition)
 * - FUNDED + end_at passed → draw_room_winner → SETTLED
 * - OPEN/LOCKED + deadline passed + not funded → EXPIRED (triggers refunds)
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

  console.log('[room-settle-cron] Starting room settlement check...');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const results: Array<{ room_id: string; action: string; success: boolean; error?: string; data?: unknown }> = [];
    const now = new Date().toISOString();

    // ========================================
    // STEP 1: Check for OPEN rooms that have met funding target
    // Transition them to FUNDED status
    // ========================================
    const { data: roomsToFund, error: fundError } = await supabase
      .from('rooms')
      .select('id, tier, escrow_balance_cents, funding_target_cents, escrow_target_cents')
      .eq('status', 'OPEN')
      .not('funding_target_cents', 'is', null);

    if (fundError) {
      console.error('[room-settle-cron] Error fetching rooms to fund:', fundError);
    } else if (roomsToFund && roomsToFund.length > 0) {
      for (const room of roomsToFund) {
        const target = room.funding_target_cents || room.escrow_target_cents;
        if (room.escrow_balance_cents >= target) {
          console.log(`[room-settle-cron] Room ${room.id} met funding target, transitioning to FUNDED`);
          
          const { error: updateError } = await supabase
            .from('rooms')
            .update({ status: 'FUNDED' })
            .eq('id', room.id);

          if (updateError) {
            console.error(`[room-settle-cron] Error transitioning room ${room.id} to FUNDED:`, updateError);
            results.push({ room_id: room.id, action: 'fund', success: false, error: updateError.message });
          } else {
            console.log(`[room-settle-cron] Room ${room.id} is now FUNDED`);
            results.push({ room_id: room.id, action: 'fund', success: true });
          }
        }
      }
    }

    // ========================================
    // STEP 2: Draw winners for FUNDED rooms where end_at has passed
    // Uses draw_room_winner for lottery-style weighted random draw
    // ========================================
    const { data: roomsToDraw, error: drawFetchError } = await supabase
      .from('rooms')
      .select('id, tier, status, end_at')
      .eq('status', 'FUNDED')
      .lte('end_at', now);

    if (drawFetchError) {
      console.error('[room-settle-cron] Error fetching rooms to draw:', drawFetchError);
    } else if (roomsToDraw && roomsToDraw.length > 0) {
      console.log(`[room-settle-cron] Found ${roomsToDraw.length} FUNDED rooms ready for winner draw`);

      for (const room of roomsToDraw) {
        console.log(`[room-settle-cron] Drawing winner for room ${room.id} (${room.tier})`);

        // Use draw_room_winner for lottery rooms (entries-based weighted random)
        const { data, error } = await supabase.rpc('draw_room_winner', {
          p_room_id: room.id,
        });

        if (error) {
          console.error(`[room-settle-cron] Error drawing winner for room ${room.id}:`, error);
          results.push({ room_id: room.id, action: 'draw_winner', success: false, error: error.message });
        } else {
          console.log(`[room-settle-cron] Room ${room.id} winner drawn:`, data);
          results.push({ room_id: room.id, action: 'draw_winner', success: true, data });
        }
      }
    } else {
      console.log('[room-settle-cron] No FUNDED rooms ready for winner draw');
    }

    // ========================================
    // STEP 3: Handle rooms that expired (deadline passed, not funded)
    // Mark as EXPIRED, which triggers refund processing
    // ========================================
    const { data: roomsToExpire, error: expireFetchError } = await supabase
      .from('rooms')
      .select('id, tier, status, deadline_at, escrow_balance_cents, funding_target_cents, escrow_target_cents')
      .in('status', ['OPEN', 'LOCKED'])
      .not('deadline_at', 'is', null)
      .lte('deadline_at', now);

    if (expireFetchError) {
      console.error('[room-settle-cron] Error fetching rooms to expire:', expireFetchError);
    } else if (roomsToExpire && roomsToExpire.length > 0) {
      console.log(`[room-settle-cron] Found ${roomsToExpire.length} rooms past deadline`);

      for (const room of roomsToExpire) {
        const target = room.funding_target_cents || room.escrow_target_cents;
        
        // Only expire if not funded
        if (room.escrow_balance_cents < target) {
          console.log(`[room-settle-cron] Room ${room.id} expired (not funded). Balance: ${room.escrow_balance_cents}, Target: ${target}`);
          
          const { error: updateError } = await supabase
            .from('rooms')
            .update({ status: 'EXPIRED' })
            .eq('id', room.id);

          if (updateError) {
            console.error(`[room-settle-cron] Error expiring room ${room.id}:`, updateError);
            results.push({ room_id: room.id, action: 'expire', success: false, error: updateError.message });
          } else {
            console.log(`[room-settle-cron] Room ${room.id} marked as EXPIRED`);
            results.push({ room_id: room.id, action: 'expire', success: true });
            
            // Trigger refund processing for expired room
            const { data: refundData, error: refundError } = await supabase.rpc('request_room_refund', {
              p_room_id: room.id,
            });

            if (refundError) {
              console.error(`[room-settle-cron] Error processing refunds for room ${room.id}:`, refundError);
            } else {
              console.log(`[room-settle-cron] Refunds initiated for room ${room.id}:`, refundData);
            }
          }
        } else {
          // Room is funded but past deadline - transition to FUNDED
          console.log(`[room-settle-cron] Room ${room.id} is funded but past deadline, transitioning to FUNDED`);
          
          const { error: updateError } = await supabase
            .from('rooms')
            .update({ status: 'FUNDED' })
            .eq('id', room.id);

          if (!updateError) {
            results.push({ room_id: room.id, action: 'fund', success: true });
          }
        }
      }
    } else {
      console.log('[room-settle-cron] No rooms to expire');
    }

    // ========================================
    // STEP 4: Legacy fallback - settle any LOCKED rooms using old settle_room
    // This handles any non-lottery/power-based rooms that may still exist
    // ========================================
    const { data: legacyRoomsToSettle, error: legacyFetchError } = await supabase
      .from('rooms')
      .select('id, tier, status, end_at')
      .eq('status', 'LOCKED')
      .lte('end_at', now);

    if (legacyFetchError) {
      console.error('[room-settle-cron] Error fetching legacy rooms:', legacyFetchError);
    } else if (legacyRoomsToSettle && legacyRoomsToSettle.length > 0) {
      console.log(`[room-settle-cron] Found ${legacyRoomsToSettle.length} legacy LOCKED rooms to settle`);

      for (const room of legacyRoomsToSettle) {
        console.log(`[room-settle-cron] Settling legacy room ${room.id} (${room.tier}) using settle_room`);

        const { data, error } = await supabase.rpc('settle_room', {
          p_room_id: room.id,
        });

        if (error) {
          console.error(`[room-settle-cron] Error settling legacy room ${room.id}:`, error);
          results.push({ room_id: room.id, action: 'settle_legacy', success: false, error: error.message });
        } else {
          console.log(`[room-settle-cron] Legacy room ${room.id} settled:`, data);
          results.push({ room_id: room.id, action: 'settle_legacy', success: true, data });
        }
      }
    }

    // Summary
    const successCount = results.filter(r => r.success).length;
    const totalActions = results.length;
    
    console.log(`[room-settle-cron] Complete. ${successCount}/${totalActions} actions succeeded`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${totalActions} room actions (${successCount} succeeded)`,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    const error = err as Error;
    console.error('[room-settle-cron] Unexpected error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
