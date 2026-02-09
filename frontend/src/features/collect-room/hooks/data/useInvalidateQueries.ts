/**
 * @fileoverview Unified Query Invalidation Hook
 * 
 * Consolidates all query invalidation logic into a single hook.
 * Provides typed methods for invalidating specific query types.
 * 
 * @module features/collect-room/hooks/data/useInvalidateQueries
 * 
 * @example
 * const { invalidateReveals, invalidateCredits, invalidateAll } = useInvalidateQueries();
 * 
 * // After a successful action
 * await saveCard();
 * invalidateReveals();
 * invalidateCredits();
 * 
 * // Or invalidate everything at once
 * invalidateAll();
 */

import { useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../constants';

/**
 * Return type for the useInvalidateQueries hook.
 */
export interface InvalidateQueries {
  /** Invalidate reveals query (cards in collection) */
  invalidateReveals: () => void;
  /** Invalidate credits query (user balances) */
  invalidateCredits: () => void;
  /** Invalidate awards query (pending awards) */
  invalidateAwards: () => void;
  /** Invalidate unrevealed cards query */
  invalidateUnrevealed: () => void;
  /** Invalidate free pull status query */
  invalidateFreePull: () => void;
  /** Invalidate all collect-room related queries */
  invalidateAll: () => void;
  /** Invalidate a custom query key */
  invalidateCustom: (queryKey: string | readonly unknown[]) => void;
}

/**
 * Unified hook for invalidating collect-room queries.
 * 
 * Provides typed methods for each query type, reducing boilerplate
 * and ensuring consistent cache invalidation across the feature.
 * 
 * @returns Object with invalidation methods for each query type
 * 
 * @example
 * function CardActions() {
 *   const { invalidateReveals, invalidateCredits } = useInvalidateQueries();
 * 
 *   const handleGift = async (cardId: string) => {
 *     await giftCard(cardId);
 *     invalidateReveals();
 *     invalidateCredits();
 *   };
 * 
 *   return <button onClick={() => handleGift('123')}>Gift</button>;
 * }
 */
export function useInvalidateQueries(): InvalidateQueries {
  const queryClient = useQueryClient();

  const invalidateReveals = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.REVEALS] });
  }, [queryClient]);

  const invalidateCredits = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CREDITS] });
  }, [queryClient]);

  const invalidateAwards = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.AWARDS] });
  }, [queryClient]);

  const invalidateUnrevealed = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.UNREVEALED] });
  }, [queryClient]);

  const invalidateFreePull = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.FREE_PULL] });
  }, [queryClient]);

  const invalidateAll = useCallback(() => {
    invalidateReveals();
    invalidateCredits();
    invalidateAwards();
    invalidateUnrevealed();
    invalidateFreePull();
  }, [invalidateReveals, invalidateCredits, invalidateAwards, invalidateUnrevealed, invalidateFreePull]);

  const invalidateCustom = useCallback((queryKey: string | readonly unknown[]) => {
    const key = typeof queryKey === 'string' ? [queryKey] : queryKey;
    queryClient.invalidateQueries({ queryKey: key });
  }, [queryClient]);

  return useMemo(() => ({
    invalidateReveals,
    invalidateCredits,
    invalidateAwards,
    invalidateUnrevealed,
    invalidateFreePull,
    invalidateAll,
    invalidateCustom,
  }), [
    invalidateReveals,
    invalidateCredits,
    invalidateAwards,
    invalidateUnrevealed,
    invalidateFreePull,
    invalidateAll,
    invalidateCustom,
  ]);
}
