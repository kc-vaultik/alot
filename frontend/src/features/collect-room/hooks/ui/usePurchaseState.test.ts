/**
 * @fileoverview Tests for usePurchaseState hook
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { usePurchaseState } from './usePurchaseState';

describe('usePurchaseState', () => {
  describe('initialization', () => {
    it('should initialize with purchaseOpen as false', () => {
      const { result } = renderHook(() => usePurchaseState());
      expect(result.current.purchaseOpen).toBe(false);
    });
  });

  describe('setPurchaseOpen', () => {
    it('should set purchaseOpen to true', () => {
      const { result } = renderHook(() => usePurchaseState());
      
      act(() => {
        result.current.setPurchaseOpen(true);
      });
      
      expect(result.current.purchaseOpen).toBe(true);
    });

    it('should set purchaseOpen to false', () => {
      const { result } = renderHook(() => usePurchaseState());
      
      act(() => {
        result.current.setPurchaseOpen(true);
      });
      
      act(() => {
        result.current.setPurchaseOpen(false);
      });
      
      expect(result.current.purchaseOpen).toBe(false);
    });
  });

  describe('openPurchase', () => {
    it('should open the purchase modal', () => {
      const { result } = renderHook(() => usePurchaseState());
      
      act(() => {
        result.current.openPurchase();
      });
      
      expect(result.current.purchaseOpen).toBe(true);
    });

    it('should be idempotent when already open', () => {
      const { result } = renderHook(() => usePurchaseState());
      
      act(() => {
        result.current.openPurchase();
      });
      
      act(() => {
        result.current.openPurchase();
      });
      
      expect(result.current.purchaseOpen).toBe(true);
    });
  });

  describe('closePurchase', () => {
    it('should close the purchase modal', () => {
      const { result } = renderHook(() => usePurchaseState());
      
      act(() => {
        result.current.openPurchase();
      });
      
      act(() => {
        result.current.closePurchase();
      });
      
      expect(result.current.purchaseOpen).toBe(false);
    });

    it('should be idempotent when already closed', () => {
      const { result } = renderHook(() => usePurchaseState());
      
      act(() => {
        result.current.closePurchase();
      });
      
      expect(result.current.purchaseOpen).toBe(false);
    });
  });

  describe('togglePurchase', () => {
    it('should toggle from closed to open', () => {
      const { result } = renderHook(() => usePurchaseState());
      
      expect(result.current.purchaseOpen).toBe(false);
      
      act(() => {
        result.current.togglePurchase();
      });
      
      expect(result.current.purchaseOpen).toBe(true);
    });

    it('should toggle from open to closed', () => {
      const { result } = renderHook(() => usePurchaseState());
      
      act(() => {
        result.current.openPurchase();
      });
      
      act(() => {
        result.current.togglePurchase();
      });
      
      expect(result.current.purchaseOpen).toBe(false);
    });

    it('should handle multiple toggles', () => {
      const { result } = renderHook(() => usePurchaseState());
      
      // false -> true
      act(() => {
        result.current.togglePurchase();
      });
      expect(result.current.purchaseOpen).toBe(true);
      
      // true -> false
      act(() => {
        result.current.togglePurchase();
      });
      expect(result.current.purchaseOpen).toBe(false);
      
      // false -> true
      act(() => {
        result.current.togglePurchase();
      });
      expect(result.current.purchaseOpen).toBe(true);
    });
  });

  describe('memoization', () => {
    it('should maintain stable function references', () => {
      const { result, rerender } = renderHook(() => usePurchaseState());
      
      const firstRender = {
        openPurchase: result.current.openPurchase,
        closePurchase: result.current.closePurchase,
        togglePurchase: result.current.togglePurchase,
      };
      
      rerender();
      
      expect(result.current.openPurchase).toBe(firstRender.openPurchase);
      expect(result.current.closePurchase).toBe(firstRender.closePurchase);
      expect(result.current.togglePurchase).toBe(firstRender.togglePurchase);
    });
  });

  describe('typical user flow', () => {
    it('should handle user opening and closing modal', () => {
      const { result } = renderHook(() => usePurchaseState());
      
      // User clicks buy button
      act(() => {
        result.current.openPurchase();
      });
      expect(result.current.purchaseOpen).toBe(true);
      
      // User clicks X or outside modal
      act(() => {
        result.current.closePurchase();
      });
      expect(result.current.purchaseOpen).toBe(false);
    });

    it('should handle keyboard shortcut toggle', () => {
      const { result } = renderHook(() => usePurchaseState());
      
      // User presses shortcut key
      act(() => {
        result.current.togglePurchase();
      });
      expect(result.current.purchaseOpen).toBe(true);
      
      // User presses same key again
      act(() => {
        result.current.togglePurchase();
      });
      expect(result.current.purchaseOpen).toBe(false);
    });
  });
});
