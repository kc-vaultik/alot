/**
 * @fileoverview Hook for handling room entry Stripe return flow.
 * Polls for entry data after successful checkout and prepares reveal animation.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/useToast';
import { logger } from '@/utils/logger';
import type { Room, RoomProduct } from '../../types';

interface RoomEntrySessionResponse {
  success: boolean;
  error?: string;
  room_id?: string;
  room?: {
    id: string;
    tier: string;
    status: string;
    start_at: string;
    end_at: string;
    deadline_at: string | null;
    escrow_balance_cents: number;
    escrow_target_cents: number;
    funding_target_cents: number | null;
    tier_cap_cents: number;
    max_participants: number;
    min_participants: number;
    is_mystery: boolean;
    category: string | null;
  };
  product?: {
    id: string;
    name: string;
    brand: string;
    model: string;
    image_url: string | null;
    retail_value_usd: number;
    category: string;
    band: string;
  } | null;
  tickets_purchased?: number;
  user_total_tickets?: number;
  total_room_tickets?: number;
  amount_cents?: number;
}

interface RoomEntryData {
  room: Room;
  product: RoomProduct | null;
  creditsEarned: number;
  userTotalCredits: number;
  totalRoomCredits: number;
  amountCents: number;
}

interface UseRoomEntryReturnResult {
  isProcessing: boolean;
  entryData: RoomEntryData | null;
  showReveal: boolean;
  clearReveal: () => void;
}

const MAX_POLLS = 15;
const POLL_INTERVAL = 2000;

/**
 * Hook for handling return from Stripe checkout for room entries.
 * Polls for entry data and triggers reveal animation.
 */
export function useRoomEntryReturn(): UseRoomEntryReturnResult {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [entryData, setEntryData] = useState<RoomEntryData | null>(null);
  const [showReveal, setShowReveal] = useState(false);
  
  const hasProcessedRef = useRef(false);
  const pollCountRef = useRef(0);

  // Debug logging for state transitions
  useEffect(() => {
    console.log('[useRoomEntryReturn] State:', {
      showReveal,
      isProcessing,
      hasEntryData: !!entryData,
      urlParams: {
        room_success: searchParams.get('room_success'),
        session_id: searchParams.get('session_id'),
        room_id: searchParams.get('room_id'),
      }
    });
  }, [showReveal, isProcessing, entryData, searchParams]);

  const clearUrlParams = useCallback(() => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('room_success');
    newParams.delete('room_canceled');
    newParams.delete('room_id');
    newParams.delete('session_id');
    setSearchParams(newParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const clearReveal = useCallback(() => {
    const roomId = entryData?.room?.id;
    setShowReveal(false);
    setEntryData(null);
    
    // Navigate back to collect-room with room selection preserved
    if (roomId) {
      navigate(`/collect-room?selected_room=${roomId}`, { replace: true });
    } else {
      navigate('/collect-room', { replace: true });
    }
  }, [entryData, navigate]);

  // Poll for entry data using session ID
  const pollForEntry = useCallback(async (sessionId: string): Promise<RoomEntryData | null> => {
    try {
      const { data, error } = await supabase.rpc('get_room_entry_by_session', {
        p_session_id: sessionId,
      });

      if (error) {
        logger.error('[useRoomEntryReturn] RPC error:', error);
        return null;
      }

      const response = data as unknown as RoomEntrySessionResponse;

      if (!response?.success || !response.room) {
        logger.debug('[useRoomEntryReturn] Entry not ready yet');
        return null;
      }

      return {
        room: {
          id: response.room.id,
          tier: response.room.tier,
          status: response.room.status,
          start_at: response.room.start_at,
          end_at: response.room.end_at,
          deadline_at: response.room.deadline_at,
          escrow_balance_cents: response.room.escrow_balance_cents,
          escrow_target_cents: response.room.escrow_target_cents,
          funding_target_cents: response.room.funding_target_cents,
          tier_cap_cents: response.room.tier_cap_cents,
          max_participants: response.room.max_participants,
          min_participants: response.room.min_participants,
          is_mystery: response.room.is_mystery,
          category: response.room.category,
        } as Room,
        product: response.product ? {
          id: response.product.id,
          name: response.product.name,
          brand: response.product.brand,
          model: response.product.model,
          image_url: response.product.image_url,
          retail_value_usd: response.product.retail_value_usd,
          category: response.product.category,
          band: response.product.band,
        } as RoomProduct : null,
        creditsEarned: response.tickets_purchased ?? 0,
        userTotalCredits: response.user_total_tickets ?? 0,
        totalRoomCredits: response.total_room_tickets ?? 0,
        amountCents: response.amount_cents ?? 0,
      };
    } catch (err) {
      logger.error('[useRoomEntryReturn] Poll error:', err);
      return null;
    }
  }, []);

  // Handle successful checkout return
  useEffect(() => {
    const roomSuccess = searchParams.get('room_success');
    const roomCanceled = searchParams.get('room_canceled');
    const sessionId = searchParams.get('session_id');
    const roomId = searchParams.get('room_id');

    // Handle canceled checkout
    if (roomCanceled === 'true') {
      toast.error('Purchase canceled', 'Your ticket purchase was canceled.');
      clearUrlParams();
      if (roomId) {
        navigate(`/rooms/${roomId}`);
      }
      return;
    }

    // Handle successful checkout
    if (roomSuccess === 'true' && sessionId && !hasProcessedRef.current) {
      hasProcessedRef.current = true;
      setIsProcessing(true);
      
      toast.info('Processing purchase', 'Your entry is being prepared...');

      const startPolling = async () => {
        while (pollCountRef.current < MAX_POLLS) {
          pollCountRef.current++;
          logger.debug(`[useRoomEntryReturn] Polling attempt ${pollCountRef.current}/${MAX_POLLS}`);

          const data = await pollForEntry(sessionId);
          
          if (data) {
            logger.info('[useRoomEntryReturn] Entry data received:', data);
            setEntryData(data);
            setShowReveal(true);
            setIsProcessing(false);
            clearUrlParams();
            return;
          }

          await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
        }

        // Max polls reached without finding entry
        logger.error('[useRoomEntryReturn] Max polls reached, entry not found');
        setIsProcessing(false);
        clearUrlParams();
        toast.info('Processing payment', 'Your payment is being processed. Check the room in a moment.');
        if (roomId) {
          navigate(`/rooms/${roomId}`);
        }
      };

      startPolling();
    }
  }, [searchParams, toast, navigate, clearUrlParams, pollForEntry]);

  return {
    isProcessing,
    entryData,
    showReveal,
    clearReveal,
  };
}
