/**
 * @fileoverview Spend Credits Hook
 * Allows users to spend universal credits to gain product progress
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/useToast';
import { logger } from '@/utils/logger';

interface SpendCreditsResult {
  success: boolean;
  credits_spent?: number;
  new_universal_balance?: number;
  new_product_credits?: number;
  error?: string;
}

interface UseSpendCreditsResult {
  spendCredits: (productClassId: string, creditsToSpend: number) => Promise<SpendCreditsResult>;
  isSpending: boolean;
}

/**
 * Hook to spend universal credits for product progress
 * Calls the spend_credits_for_progress RPC function
 */
export function useSpendCredits(): UseSpendCreditsResult {
  const [isSpending, setIsSpending] = useState(false);
  const { toast } = useToast();

  const spendCredits = useCallback(async (
    productClassId: string,
    creditsToSpend: number
  ): Promise<SpendCreditsResult> => {
    setIsSpending(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Authentication required', 'Please log in to spend credits.');
        return { success: false, error: 'Not authenticated' };
      }

      const { data, error } = await supabase.rpc('spend_credits_for_progress', {
        p_user_id: user.id,
        p_product_class_id: productClassId,
        p_credits_to_spend: creditsToSpend,
      });

      if (error) {
        logger.error('useSpendCredits RPC error:', error);
        toast.error('Transaction failed', error.message);
        return { success: false, error: error.message };
      }

      // Parse the JSON result
      const result = (typeof data === 'object' && data !== null ? data : {}) as unknown as SpendCreditsResult;

      if (result.success) {
        const progressGained = creditsToSpend / 100; // Approximate, actual depends on tier
        toast.success('Credits spent!', `+${progressGained.toFixed(1)}% progress added`);
      } else {
        toast.error('Could not spend credits', result.error || 'Unknown error');
      }

      return result;
    } catch (err) {
      logger.error('useSpendCredits Error:', err);
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast.error('Transaction failed', message);
      return { success: false, error: message };
    } finally {
      setIsSpending(false);
    }
  }, [toast]);

  return { spendCredits, isSpending };
}
