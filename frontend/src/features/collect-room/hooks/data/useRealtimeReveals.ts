/**
 * @fileoverview Hook for real-time reveal subscriptions.
 */

import { useRef, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/utils/logger';
import { QUERY_KEYS } from '../../constants';
import { mapRevealToCollectCard } from '../../utils/cardMappers';
import type { CollectCard, RevealRow } from '../../types';

/**
 * Subscribes to real-time reveals for the current user.
 * Calls the provided callback when a new reveal is received.
 * 
 * @param onNewReveal - Callback invoked with the new card data
 */
export function useRealtimeReveals(onNewReveal: (card: CollectCard) => void) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const onNewRevealRef = useRef(onNewReveal);

  // Keep callback ref up to date
  useEffect(() => {
    onNewRevealRef.current = onNewReveal;
  }, [onNewReveal]);

  useEffect(() => {
    if (!user) return;

    let channel: ReturnType<typeof supabase.channel> | null = null;
    let mounted = true;

    channel = supabase
      .channel(`collect-room-reveals:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reveals',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          logger.debug('New realtime reveal:', payload.new);

          const { data: reveal } = await supabase
            .from('reveals')
            .select(`*, product_classes (*)`)
            .eq('id', (payload.new as { id: string }).id)
            .single();

          if (reveal && mounted) {
            const card = mapRevealToCollectCard(reveal as unknown as RevealRow);
            if (card) {
              onNewRevealRef.current(card);
              queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.REVEALS] });
              queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CREDITS] });
            }
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [user, queryClient]);
}
