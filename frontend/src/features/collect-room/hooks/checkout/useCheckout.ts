/**
 * @fileoverview Checkout Hook
 * Handles Stripe checkout session creation
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/useToast';
import { logger } from '@/utils/logger';
import { ROUTES } from '@/constants';
import type { PricingTier } from '../../types';

// ============= Types =============

interface CheckoutResult {
  url?: string;
  error?: string;
}

interface UseCheckoutResult {
  createCheckout: (tier: PricingTier, quantity: number) => Promise<CheckoutResult | null>;
  isLoading: boolean;
}

// ============= Hook Implementation =============

export function useCheckout(): UseCheckoutResult {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const createCheckout = useCallback(async (
    tier: PricingTier,
    quantity: number
  ): Promise<CheckoutResult | null> => {
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Authentication required', 'Please sign in to purchase cards');
        return null;
      }

      const successUrl = `${window.location.origin}${ROUTES.COLLECT_ROOM}?success=true&session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${window.location.origin}${ROUTES.COLLECT_ROOM}?canceled=true`;

      const { data, error } = await supabase.functions.invoke<CheckoutResult>(
        'mystery-card-checkout',
        {
          body: {
            tier,
            quantity,
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
      logger.error('useCheckout Error:', err);
      toast.error('Checkout failed', message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return { createCheckout, isLoading };
}
