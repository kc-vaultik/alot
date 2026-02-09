/**
 * @fileoverview Credits Context
 * Manages user credits, awards, and collection data.
 * @module features/collect-room/context/CreditsContext
 */

import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../constants';
import {
  useMyReveals,
  useMyCredits,
  useMyAwards,
  setQueryClientRef,
} from '../hooks/data';
import { useTotalVaultValue } from './selectors';
import type { CollectCard, CreditsData, Award } from '../types';

// ============= Types =============

export interface CreditsContextValue {
  /** User's revealed cards collection */
  reveals: CollectCard[];
  /** User's credit balances */
  credits: CreditsData | undefined;
  /** User's awards */
  awards: Award[];
  /** Whether data is loading */
  isDataLoading: boolean;
  /** Total value of all cards in vault */
  totalVaultValue: number;
  /** Refetch reveals data */
  refetchReveals: () => Promise<{ data?: CollectCard[] }>;
  /** Refetch credits data */
  refetchCredits: () => void;
}

// ============= Context =============

const CreditsContext = createContext<CreditsContextValue | null>(null);

export function useCreditsContext(): CreditsContextValue {
  const context = useContext(CreditsContext);
  if (!context) {
    throw new Error('useCreditsContext must be used within CreditsContextProvider');
  }
  return context;
}

// ============= Provider =============

interface CreditsContextProviderProps {
  children: React.ReactNode;
}

export function CreditsContextProvider({ children }: CreditsContextProviderProps) {
  const queryClient = useQueryClient();

  // Data hooks
  const { data: reveals = [], isLoading: revealsLoading, refetch: refetchReveals } = useMyReveals();
  const { data: credits, isLoading: creditsLoading, refetch: refetchCredits } = useMyCredits();
  const { data: awards = [] } = useMyAwards();

  // Initialize query client reference for cache invalidation
  useEffect(() => {
    setQueryClientRef(queryClient);
  }, [queryClient]);

  // Force cache invalidation on mount
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.REVEALS] });
  }, [queryClient]);

  const isDataLoading = revealsLoading || creditsLoading;
  const totalVaultValue = useTotalVaultValue(reveals);

  const value = useMemo<CreditsContextValue>(() => ({
    reveals,
    credits,
    awards,
    isDataLoading,
    totalVaultValue,
    refetchReveals,
    refetchCredits,
  }), [
    reveals,
    credits,
    awards,
    isDataLoading,
    totalVaultValue,
    refetchReveals,
    refetchCredits,
  ]);

  return (
    <CreditsContext.Provider value={value}>
      {children}
    </CreditsContext.Provider>
  );
}
