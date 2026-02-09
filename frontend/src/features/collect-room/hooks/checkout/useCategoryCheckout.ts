/**
 * @fileoverview Category Checkout Hook
 * Handles Stripe checkout for category-specific packs
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/useToast';
import { logger } from '@/utils/logger';
import { ROUTES } from '@/constants';
import type { PricingTier } from '../../types';
import type { ProductCategory } from '../../constants/categories';

interface CheckoutResult {
  url?: string;
  error?: string;
}

interface UseCategoryCheckoutResult {
  createCategoryCheckout: (
    category: ProductCategory,
    tier: PricingTier,
    quantity: number,
    unitPriceCents: number
  ) => Promise<CheckoutResult | null>;
  isLoading: boolean;
}

export function useCategoryCheckout(): UseCategoryCheckoutResult {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const createCategoryCheckout = useCallback(async (
    category: ProductCategory,
    tier: PricingTier,
    quantity: number,
    unitPriceCents: number
  ): Promise<CheckoutResult | null> => {
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Authentication required', 'Please sign in to purchase packs');
        return null;
      }

      const successUrl = `${window.location.origin}${ROUTES.COLLECT_ROOM}?success=true&session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${window.location.origin}${ROUTES.COLLECT_ROOM}?canceled=true`;

      const { data, error } = await supabase.functions.invoke<CheckoutResult>(
        'category-pack-checkout',
        {
          body: {
            category,
            tier,
            quantity,
            unit_price_cents: unitPriceCents,
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
      logger.error('useCategoryCheckout Error:', err);
      toast.error('Checkout failed', message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return { createCategoryCheckout, isLoading };
}
