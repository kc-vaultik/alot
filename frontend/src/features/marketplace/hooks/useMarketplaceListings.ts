import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import type { MarketplaceListing } from '../types';
import { mapRevealToCollectCard } from '@/features/collect-room/utils/cardMappers';
import type { RevealRow } from '@/features/collect-room/types';

const MARKETPLACE_QUERY_KEY = 'marketplace-listings';

/**
 * Fetches public marketplace listings (pending transfers without a specific recipient)
 */
export function useMarketplaceListings() {
  const { user } = useAuth();

  return useQuery({
    queryKey: [MARKETPLACE_QUERY_KEY, user?.id],
    queryFn: async (): Promise<MarketplaceListing[]> => {
      if (!user) return [];

      // Fetch pending transfers that are publicly listed (no to_user_id)
      let query = supabase
        .from('card_transfers')
        .select(`
          id,
          reveal_id,
          from_user_id,
          transfer_type,
          claim_token,
          created_at,
          expires_at,
          reveals!inner (
            id,
            user_id,
            product_class_id,
            band,
            is_golden,
            credits_awarded,
            product_credits_awarded,
            universal_credits_awarded,
            is_award,
            serial_number,
            created_at,
            revealed_at,
            product_classes!inner (
              id,
              name,
              brand,
              model,
              category,
              band,
              retail_value_usd,
              image_url,
              expected_fulfillment_cost_usd
            )
          )
        `)
        .eq('status', 'PENDING')
        .eq('transfer_type', 'SWAP') // Only swaps in marketplace (gifts are personal)
        .is('to_user_id', null) // Only public listings
        .gt('expires_at', new Date().toISOString()) // Not expired
        .order('created_at', { ascending: false });

      // Exclude own listings (avoid invalid uuid by only applying when user.id exists)
      if (user.id) {
        query = query.neq('from_user_id', user.id);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('useMarketplaceListings Error:', error);
        throw error;
      }

      if (!data) return [];

      // Map to MarketplaceListing format
      return data.map((transfer): MarketplaceListing => {
        const reveal = transfer.reveals as unknown as RevealRow;
        const baseCard = mapRevealToCollectCard(reveal);

        if (!baseCard) {
          // Fallback if mapping fails
          return {
            card_id: transfer.reveal_id,
            product_reveal: (reveal.product_classes as any)?.name || 'Unknown',
            brand: (reveal.product_classes as any)?.brand || 'Unknown',
            model: (reveal.product_classes as any)?.model || 'Unknown',
            product_image: (reveal.product_classes as any)?.image_url || '',
            product_value: (reveal.product_classes as any)?.retail_value_usd || 0,
            rarity_score: 50,
            is_golden: reveal.is_golden || false,
            design_traits: {
              background: 'matte-black',
              texture: 'smooth',
              emblem: 'standard',
              borderStyle: 'clean',
              foilType: 'none',
              typography: 'modern',
            },
            serial_number: reveal.serial_number || '0000/10000',
            listing_type: transfer.transfer_type === 'GIFT' ? 'GIFT' : 'SWAP',
            transfer_id: transfer.id,
            claim_token: transfer.claim_token,
            listed_at: transfer.created_at,
            expires_at: transfer.expires_at,
            // Room Stats
            priority_points: reveal.priority_points ?? 0,
            redeem_credits_cents: reveal.redeem_credits_cents ?? 0,
            card_state: (reveal.card_state as any) ?? 'owned',
            band: reveal.band ?? 'ICON',
          };
        }

        return {
          ...baseCard,
          listing_type: transfer.transfer_type === 'GIFT' ? 'GIFT' : 'SWAP',
          transfer_id: transfer.id,
          claim_token: transfer.claim_token,
          listed_at: transfer.created_at,
          expires_at: transfer.expires_at,
        };
      });
    },
    enabled: !!user,
    staleTime: 30000,
    refetchInterval: 60000, // Refresh every minute
  });
}

/**
 * Creates a public listing for a card (gift or swap)
 */
export function useCreatePublicListing() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      revealId, 
      listingType 
    }: { 
      revealId: string; 
      listingType: 'GIFT' | 'SWAP' 
    }) => {
      if (!user) throw new Error('Must be logged in');

      // Generate a unique claim token
      const claimToken = crypto.randomUUID();

      const rpcName = listingType === 'GIFT' ? 'create_gift_transfer' : 'create_swap_offer';
      
      const { data, error } = await supabase.rpc(rpcName, {
        p_reveal_id: revealId,
        p_claim_token: claimToken,
      });

      if (error) throw error;
      
      const result = data as Record<string, unknown> | null;
      if (result?.error) {
        throw new Error(String(result.error));
      }

      return { 
        transferId: result?.transfer_id as string,
        claimToken,
        claimUrl: `${window.location.origin}/collect-room/claim/${claimToken}`,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MARKETPLACE_QUERY_KEY] });
      toast.success('Card listed on marketplace!');
    },
    onError: (error) => {
      logger.error('useCreatePublicListing Error:', error);
      toast.error(error.message || 'Failed to list card');
    },
  });
}

/**
 * Fetches the user's own active listings with full card data
 */
export function useMyListings() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-listings', user?.id],
    queryFn: async (): Promise<MarketplaceListing[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('card_transfers')
        .select(`
          id,
          reveal_id,
          from_user_id,
          transfer_type,
          status,
          claim_token,
          created_at,
          expires_at,
          reveals!inner (
            id,
            user_id,
            product_class_id,
            band,
            is_golden,
            credits_awarded,
            product_credits_awarded,
            universal_credits_awarded,
            is_award,
            serial_number,
            created_at,
            revealed_at,
            product_classes!inner (
              id,
              name,
              brand,
              model,
              category,
              band,
              retail_value_usd,
              image_url,
              expected_fulfillment_cost_usd
            )
          )
        `)
        .eq('from_user_id', user.id)
        .eq('status', 'PENDING')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data) return [];

      // Map to MarketplaceListing format
      return data.map((transfer): MarketplaceListing => {
        const reveal = transfer.reveals as unknown as RevealRow;
        const baseCard = mapRevealToCollectCard(reveal);

        if (!baseCard) {
          return {
            card_id: transfer.reveal_id,
            product_reveal: (reveal.product_classes as any)?.name || 'Unknown',
            brand: (reveal.product_classes as any)?.brand || 'Unknown',
            model: (reveal.product_classes as any)?.model || 'Unknown',
            product_image: (reveal.product_classes as any)?.image_url || '',
            product_value: (reveal.product_classes as any)?.retail_value_usd || 0,
            rarity_score: 50,
            is_golden: reveal.is_golden || false,
            design_traits: {
              background: 'matte-black',
              texture: 'smooth',
              emblem: 'standard',
              borderStyle: 'clean',
              foilType: 'none',
              typography: 'modern',
            },
            serial_number: reveal.serial_number || '0000/10000',
            listing_type: transfer.transfer_type === 'GIFT' ? 'GIFT' : 'SWAP',
            transfer_id: transfer.id,
            claim_token: transfer.claim_token,
            listed_at: transfer.created_at,
            expires_at: transfer.expires_at,
            // Room Stats
            priority_points: reveal.priority_points ?? 0,
            redeem_credits_cents: reveal.redeem_credits_cents ?? 0,
            card_state: (reveal.card_state as any) ?? 'owned',
            band: reveal.band ?? 'ICON',
          };
        }

        return {
          ...baseCard,
          listing_type: transfer.transfer_type === 'GIFT' ? 'GIFT' : 'SWAP',
          transfer_id: transfer.id,
          claim_token: transfer.claim_token,
          listed_at: transfer.created_at,
          expires_at: transfer.expires_at,
        };
      });
    },
    enabled: !!user,
    staleTime: 30000,
  });
}

/**
 * Cancels a listing
 */
export function useCancelListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transferId: string) => {
      const { data, error } = await supabase.rpc('cancel_transfer', {
        p_transfer_id: transferId,
      });

      if (error) throw error;
      const result = data as Record<string, unknown> | null;
      if (result?.error) {
        throw new Error(String(result.error));
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MARKETPLACE_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
      toast.success('Listing cancelled');
    },
    onError: (error) => {
      logger.error('useCancelListing Error:', error);
      toast.error(error.message || 'Failed to cancel listing');
    },
  });
}
