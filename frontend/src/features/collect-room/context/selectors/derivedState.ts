/**
 * @fileoverview Derived state selectors for Collect Room context.
 * @module features/collect-room/context/selectors
 */

import { useMemo } from 'react';
import type { CollectCard } from '../../types';

/**
 * Hook that calculates the total vault value from all cards.
 * 
 * @param reveals - Array of collect cards in the user's vault
 * @returns Total value in USD of all cards
 * 
 * @example
 * const totalValue = useTotalVaultValue(reveals);
 * // totalValue = 1500 (if cards sum to $1500)
 */
export function useTotalVaultValue(reveals: CollectCard[]): number {
  return useMemo(
    () => reveals.reduce((sum, card) => sum + (card.product_value || 0), 0),
    [reveals]
  );
}

/**
 * Hook that calculates combined loading state from multiple data sources.
 * 
 * @param revealsLoading - Whether reveals data is loading
 * @param creditsLoading - Whether credits data is loading
 * @param unrevealedLoading - Whether unrevealed cards are loading
 * @returns True if any data source is still loading
 */
export function useIsLoading(
  revealsLoading: boolean,
  creditsLoading: boolean,
  unrevealedLoading: boolean
): boolean {
  return revealsLoading || creditsLoading || unrevealedLoading;
}

/**
 * Pure function to calculate total vault value (for non-hook usage).
 * 
 * @param reveals - Array of collect cards
 * @returns Total value in USD of all cards
 */
export function calculateTotalVaultValue(reveals: CollectCard[]): number {
  return reveals.reduce((sum, card) => sum + (card.product_value || 0), 0);
}
