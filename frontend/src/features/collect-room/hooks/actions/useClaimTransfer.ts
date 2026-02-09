/**
 * @fileoverview Hook for claiming card transfers (gifts and swaps)
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

interface TransferDetails {
  id: string;
  reveal_id: string;
  from_user_id: string;
  transfer_type: 'gift' | 'swap';
  status: string;
  expires_at: string;
  card: {
    id: string;
    product_name: string;
    product_brand: string;
    product_image: string | null;
    band: string;
    serial_number: string;
    retail_value_usd: number;
  };
}

export function useClaimTransfer(token: string | undefined) {
  const { user, isAuthenticated } = useAuth();
  const [transfer, setTransfer] = useState<TransferDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid claim link');
      setLoading(false);
      return;
    }

    fetchTransferDetails();
  }, [token]);

  const fetchTransferDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: rpcError } = await supabase.rpc(
        'get_transfer_details_by_claim_token',
        { p_claim_token: token }
      );

      if (rpcError) {
        setError('Failed to load transfer details');
        return;
      }

      const result = data as Record<string, unknown> | null;
      if (!result) {
        setError('Transfer not found');
        return;
      }

      if (result.error) {
        setError(String(result.error));
        return;
      }

      const t = (result as any).transfer as TransferDetails | undefined;
      if (!t) {
        setError('Transfer not found');
        return;
      }

      setTransfer(t);
    } catch (err) {
      logger.error('Error fetching transfer:', err);
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const claimGift = async () => {
    if (!token || !isAuthenticated) return { success: false };

    try {
      setClaiming(true);
      const { data, error } = await supabase.rpc('claim_gift', {
        p_claim_token: token,
      });

      if (error) {
        toast.error(error.message || 'Failed to claim gift');
        return { success: false, error: error.message };
      }

      const result = data as Record<string, unknown> | null;
      
      if (result?.error) {
        const errorMsg = String(result.error);
        toast.error(errorMsg);
        return { success: false, error: errorMsg };
      }

      toast.success('Gift claimed successfully!');
      return { success: true, revealId: result?.reveal_id as string };
    } catch (err) {
      logger.error('Error claiming gift:', err);
      toast.error('Failed to claim gift');
      return { success: false };
    } finally {
      setClaiming(false);
    }
  };

  const claimSwap = async (offeredRevealId: string) => {
    if (!token || !isAuthenticated) return { success: false };

    try {
      setClaiming(true);
      const { data, error } = await supabase.rpc('claim_swap', {
        p_claim_token: token,
        p_offered_reveal_id: offeredRevealId,
      });

      if (error) {
        toast.error(error.message || 'Failed to complete swap');
        return { success: false, error: error.message };
      }

      const result = data as Record<string, unknown> | null;

      if (result?.error) {
        const errorMsg = String(result.error);
        toast.error(errorMsg);
        return { success: false, error: errorMsg };
      }

      toast.success('Swap completed successfully!');
      return { success: true };
    } catch (err) {
      logger.error('Error claiming swap:', err);
      toast.error('Failed to complete swap');
      return { success: false };
    } finally {
      setClaiming(false);
    }
  };

  const isOwnTransfer = user?.id === transfer?.from_user_id;

  return {
    transfer,
    loading,
    error,
    claiming,
    isAuthenticated,
    isOwnTransfer,
    claimGift,
    claimSwap,
  };
}
