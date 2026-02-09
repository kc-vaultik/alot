/**
 * @fileoverview Hook for room entry checkout via Stripe.
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/useToast';

interface CheckoutResult {
  url?: string;
  error?: string;
}

interface UseRoomEntryCheckoutResult {
  createEntryCheckout: (roomId: string, amountCents: number, tickets: number) => Promise<CheckoutResult | null>;
  isLoading: boolean;
}

/**
 * Hook for creating Stripe checkout sessions for room entry purchases.
 */
export function useRoomEntryCheckout(): UseRoomEntryCheckoutResult {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const createEntryCheckout = useCallback(async (
    roomId: string,
    amountCents: number,
    tickets: number
  ): Promise<CheckoutResult | null> => {
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Authentication required', 'Please sign in to enter rooms');
        return null;
      }

      const successUrl = `${window.location.origin}/collect-room?room_success=true&room_id=${roomId}&session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${window.location.origin}/collect-room?room_canceled=true&room_id=${roomId}`;

      const { data, error } = await supabase.functions.invoke<CheckoutResult>(
        'room-entry-checkout',
        {
          body: {
            room_id: roomId,
            amount_cents: amountCents,
            tickets,
            user_id: user.id,
            success_url: successUrl,
            cancel_url: cancelUrl,
          },
        }
      );

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create checkout session';
      console.error('[useRoomEntryCheckout] Error:', err);
      toast.error('Checkout failed', message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return { createEntryCheckout, isLoading };
}
