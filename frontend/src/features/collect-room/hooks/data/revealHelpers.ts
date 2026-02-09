/**
 * @fileoverview Helper functions for reveal operations.
 */

import { supabase } from '@/integrations/supabase/client';
import { QueryClient } from '@tanstack/react-query';
import { logger } from '@/utils/logger';
import { PATTERNS } from '@/constants';
import { QUERY_KEYS } from '../../constants';
import { mapRevealToCollectCard } from '../../utils/cardMappers';
import type { CollectCard, RevealRow } from '../../types';

// Module-level query client reference for cache invalidation
let queryClientRef: QueryClient | null = null;

/**
 * Sets the query client reference for cache invalidation.
 * Should be called once during app initialization.
 */
export function setQueryClientRef(client: QueryClient): void {
  queryClientRef = client;
}

/**
 * Fetches reveals associated with a Stripe session ID.
 * Uses a two-step fallback if the initial join query returns empty.
 * 
 * @param sessionId - The Stripe checkout session ID
 * @returns Object with data array or error
 */
export async function fetchRevealsBySession(
  sessionId: string
): Promise<{ data: CollectCard[] | null; error: Error | null }> {
  logger.debug('Fetching reveals for session:', sessionId);

  // Primary query: join reveals with purchases
  const { data, error } = await supabase
    .from('reveals')
    .select(`*, product_classes (*), purchases!inner (stripe_session_id)`)
    .eq('purchases.stripe_session_id', sessionId)
    .is('revealed_at', null)
    .order('created_at', { ascending: true });

  if (error) {
    logger.error('Join query error:', error);
  }

  if (data && data.length > 0) {
    const cards = (data as unknown as RevealRow[])
      .map(mapRevealToCollectCard)
      .filter((card): card is CollectCard => card !== null);
    return { data: cards, error: null };
  }

  // Fallback: two-step query if join returns empty
  logger.debug('Join empty, trying fallback...');

  const { data: purchaseData, error: purchaseError } = await supabase
    .from('purchases')
    .select('id')
    .eq('stripe_session_id', sessionId)
    .maybeSingle();

  if (purchaseError || !purchaseData) {
    return { data: null, error: purchaseError ?? new Error('No purchase found') };
  }

  const { data: revealData, error: revealError } = await supabase
    .from('reveals')
    .select(`*, product_classes (*)`)
    .eq('purchase_id', purchaseData.id)
    .is('revealed_at', null)
    .order('created_at', { ascending: true });

  if (revealError) {
    return { data: null, error: revealError };
  }

  const cards = (revealData as unknown as RevealRow[])
    .map(mapRevealToCollectCard)
    .filter((card): card is CollectCard => card !== null);
  return { data: cards, error: null };
}

/**
 * Marks a reveal as seen (sets revealed_at timestamp).
 * Skips non-UUID card IDs (e.g., demo cards).
 * 
 * @param revealId - The reveal ID to mark as seen
 * @returns Object with success status and any error
 */
export async function markRevealSeen(
  revealId: string
): Promise<{ success: boolean; error: Error | null }> {
  // Skip non-UUID card IDs (e.g., demo cards)
  if (!PATTERNS.UUID.test(revealId)) {
    logger.debug('Skipping non-UUID card:', revealId);
    return { success: true, error: null };
  }

  logger.debug('Marking card as seen:', revealId);

  // Ensure we have a valid session before calling RPC
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    logger.error('Auth error - no valid session:', authError);
    return { success: false, error: authError || new Error('No authenticated user') };
  }

  const { error } = await supabase.rpc('mark_reveal_seen', {
    p_reveal_id: revealId,
  });

  if (error) {
    logger.error('RPC error:', error);
    return { success: false, error };
  }

  // Immediately invalidate reveals cache to trigger re-fetch
  if (queryClientRef) {
    queryClientRef.invalidateQueries({ queryKey: [QUERY_KEYS.REVEALS] });
    logger.debug('Invalidated reveals cache after marking seen:', revealId);
  }

  logger.debug('Successfully marked card:', revealId);
  return { success: true, error: null };
}
