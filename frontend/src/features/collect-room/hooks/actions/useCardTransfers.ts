/**
 * @fileoverview Hook for card transfer operations (gift/swap)
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/utils/logger';

interface TransferResult {
  success: boolean;
  transfer_id?: string;
  claim_token?: string;
  expires_at?: string;
  error?: string;
}

interface PendingTransfer {
  id: string;
  reveal_id: string;
  transfer_type: 'GIFT' | 'SWAP';
  status: string;
  claim_token: string;
  created_at: string;
  expires_at: string;
}

export function useCardTransfers() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate a unique claim token
  const generateClaimToken = useCallback(() => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let token = '';
    for (let i = 0; i < 12; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }, []);

  // Create a gift transfer (optionally to a specific collector)
  const createGiftTransfer = useCallback(async (revealId: string, toUserId?: string): Promise<TransferResult> => {
    if (!user) {
      return { success: false, error: 'You must be logged in to gift a card' };
    }

    setIsLoading(true);
    setError(null);

    try {
      const claimToken = generateClaimToken();
      
      // Only include p_to_user_id if provided to avoid function overload ambiguity
      const rpcParams: { p_reveal_id: string; p_claim_token: string; p_to_user_id?: string } = {
        p_reveal_id: revealId,
        p_claim_token: claimToken,
      };
      
      if (toUserId) {
        rpcParams.p_to_user_id = toUserId;
      }
      
      const { data, error: rpcError } = await supabase.rpc('create_gift_transfer', rpcParams);

      if (rpcError) {
        logger.error('Gift transfer RPC error:', rpcError);
        return { success: false, error: rpcError.message };
      }

      const result = data as { success?: boolean; error?: string; transfer_id?: string; claim_token?: string; expires_at?: string; is_direct?: boolean };

      if (result.error) {
        return { success: false, error: result.error };
      }

      logger.info('Gift transfer created:', result);
      return {
        success: true,
        transfer_id: result.transfer_id,
        claim_token: result.claim_token,
        expires_at: result.expires_at,
      };
    } catch (err) {
      logger.error('Gift transfer error:', err);
      return { success: false, error: 'Failed to create gift transfer' };
    } finally {
      setIsLoading(false);
    }
  }, [user, generateClaimToken]);

  // Create a swap offer (optionally to a specific collector)
  const createSwapOffer = useCallback(async (revealId: string, toUserId?: string): Promise<TransferResult> => {
    if (!user) {
      return { success: false, error: 'You must be logged in to swap a card' };
    }

    setIsLoading(true);
    setError(null);

    try {
      const claimToken = generateClaimToken();
      
      // Only include p_to_user_id if provided to avoid function overload ambiguity
      const rpcParams: { p_reveal_id: string; p_claim_token: string; p_to_user_id?: string } = {
        p_reveal_id: revealId,
        p_claim_token: claimToken,
      };
      
      if (toUserId) {
        rpcParams.p_to_user_id = toUserId;
      }
      
      const { data, error: rpcError } = await supabase.rpc('create_swap_offer', rpcParams);

      if (rpcError) {
        logger.error('Swap offer RPC error:', rpcError);
        return { success: false, error: rpcError.message };
      }

      const result = data as { success?: boolean; error?: string; transfer_id?: string; claim_token?: string; expires_at?: string; is_direct?: boolean };

      if (result.error) {
        return { success: false, error: result.error };
      }

      logger.info('Swap offer created:', result);
      return {
        success: true,
        transfer_id: result.transfer_id,
        claim_token: result.claim_token,
        expires_at: result.expires_at,
      };
    } catch (err) {
      logger.error('Swap offer error:', err);
      return { success: false, error: 'Failed to create swap offer' };
    } finally {
      setIsLoading(false);
    }
  }, [user, generateClaimToken]);

  // Cancel a pending transfer
  const cancelTransfer = useCallback(async (transferId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'You must be logged in to cancel a transfer' };
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc('cancel_transfer', {
        p_transfer_id: transferId,
      });

      if (rpcError) {
        logger.error('Cancel transfer RPC error:', rpcError);
        return { success: false, error: rpcError.message };
      }

      const result = data as { success?: boolean; error?: string; message?: string };

      if (result.error) {
        return { success: false, error: result.error };
      }

      logger.info('Transfer cancelled:', result);
      return { success: true };
    } catch (err) {
      logger.error('Cancel transfer error:', err);
      return { success: false, error: 'Failed to cancel transfer' };
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Get user's pending transfers
  const getPendingTransfers = useCallback(async (): Promise<PendingTransfer[]> => {
    if (!user) return [];

    try {
      const { data, error: queryError } = await supabase
        .from('card_transfers')
        .select('*')
        .eq('from_user_id', user.id)
        .eq('status', 'PENDING')
        .order('created_at', { ascending: false });

      if (queryError) {
        logger.error('Fetch pending transfers error:', queryError);
        return [];
      }

      return (data || []) as PendingTransfer[];
    } catch (err) {
      logger.error('Get pending transfers error:', err);
      return [];
    }
  }, [user]);

  return {
    isLoading,
    error,
    createGiftTransfer,
    createSwapOffer,
    cancelTransfer,
    getPendingTransfers,
  };
}
