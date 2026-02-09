/**
 * @fileoverview Hook for managing purchase modal state.
 * Simple state management for the purchase modal visibility.
 */

import { useState, useCallback } from 'react';

interface UsePurchaseStateResult {
  /** Whether the purchase modal is open */
  purchaseOpen: boolean;
  /** Set the purchase modal open state */
  setPurchaseOpen: (open: boolean) => void;
  /** Open the purchase modal */
  openPurchase: () => void;
  /** Close the purchase modal */
  closePurchase: () => void;
  /** Toggle the purchase modal */
  togglePurchase: () => void;
}

/**
 * Manages the purchase modal visibility state.
 */
export function usePurchaseState(): UsePurchaseStateResult {
  const [purchaseOpen, setPurchaseOpen] = useState(false);

  const openPurchase = useCallback(() => setPurchaseOpen(true), []);
  const closePurchase = useCallback(() => setPurchaseOpen(false), []);
  const togglePurchase = useCallback(() => setPurchaseOpen((prev) => !prev), []);

  return {
    purchaseOpen,
    setPurchaseOpen,
    openPurchase,
    closePurchase,
    togglePurchase,
  };
}
