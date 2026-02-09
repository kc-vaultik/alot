/**
 * @fileoverview Stripe Return Hook
 * Handles the return from Stripe checkout and polls for reveals
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/useToast';
import { logger } from '@/utils/logger';
import { POLLING } from '../../constants';
import { sleep } from '../../utils/dateUtils';
import { fetchRevealsBySession } from '../data';
import type { CollectCard } from '../../types';

// ============= Types =============

interface UseStripeReturnOptions {
  onRevealsReady: (cards: CollectCard[]) => void;
  onRefetch: () => void;
}

interface UseStripeReturnResult {
  isOpening: boolean;
}

// ============= URL Parsing =============

interface StripeReturnParams {
  isSuccess: boolean;
  isCanceled: boolean;
  sessionId: string | null;
}

function parseStripeReturnParams(): StripeReturnParams {
  const params = new URLSearchParams(window.location.search);
  
  return {
    isSuccess: params.get('success') === 'true' || params.get('purchase') === 'success',
    isCanceled: params.get('canceled') === 'true' || params.get('purchase') === 'cancelled',
    sessionId: params.get('session_id'),
  };
}

function clearUrlParams(): void {
  window.history.replaceState({}, '', window.location.pathname);
}

// ============= Auth Polling =============

async function waitForAuth(): Promise<boolean> {
  for (let attempt = 0; attempt < POLLING.AUTH_MAX_RETRIES; attempt++) {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      logger.debug('Auth ready, user:', user.id);
      return true;
    }
    
    logger.debug('Auth not ready, attempt:', attempt + 1);
    await sleep(POLLING.AUTH_RETRY_DELAY_MS);
  }
  
  return false;
}

// ============= Hook Implementation =============

export function useStripeReturn({
  onRevealsReady,
  onRefetch,
}: UseStripeReturnOptions): UseStripeReturnResult {
  const { toast } = useToast();
  const [isOpening, setIsOpening] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Parse URL params on mount
  useEffect(() => {
    const { isSuccess, isCanceled, sessionId: stripeSessionId } = parseStripeReturnParams();

    if (isCanceled) {
      toast.info('Payment canceled', 'Your purchase was not completed.');
      clearUrlParams();
      return;
    }

    if (isSuccess && stripeSessionId) {
      setIsOpening(true);
      setSessionId(stripeSessionId);
    }
  }, [toast]);

  // Poll for reveals when we have a session ID
  useEffect(() => {
    if (!isOpening || !sessionId) return;

    let cancelled = false;

    const pollForReveals = async () => {
      const startTime = Date.now();

      // Wait for authentication to be ready
      logger.debug('Starting auth check...');
      const authReady = await waitForAuth();

      if (!authReady) {
        logger.error('Auth never became ready');
        toast.error('Session issue', 'Please refresh the page to see your cards.');
        setIsOpening(false);
        return;
      }

      // Poll for reveals
      logger.debug('Starting poll for session:', sessionId);

      while (!cancelled && Date.now() - startTime < POLLING.STRIPE_TIMEOUT_MS) {
        logger.debug('Polling...');
        const { data, error } = await fetchRevealsBySession(sessionId);
        logger.debug('Poll result:', { count: data?.length, error: !!error });

        if (!error && data && data.length > 0) {
          logger.debug('Found cards:', data.map((c) => c.card_id));
          
          onRefetch();
          onRevealsReady(data);
          setIsOpening(false);
          setSessionId(null);
          clearUrlParams();
          return;
        }

        await sleep(POLLING.STRIPE_POLL_INTERVAL_MS);
      }

      // Timeout reached
      if (!cancelled) {
        logger.debug('Timeout, no cards found');
        toast.info('Processing', "Payment received, still processing your cards. They'll appear shortly.");
        setIsOpening(false);
      }
    };

    pollForReveals();

    return () => {
      cancelled = true;
    };
  }, [isOpening, sessionId, onRevealsReady, onRefetch, toast]);

  return { isOpening };
}
