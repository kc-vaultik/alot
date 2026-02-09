/**
 * @fileoverview Tests for useHapticFeedback hook
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useHapticFeedback } from './useHapticFeedback';

// Mock navigator.vibrate
const mockVibrate = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useHapticFeedback', () => {
  describe('when vibration is supported', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'vibrate', {
        value: mockVibrate,
        writable: true,
        configurable: true,
      });
    });

    it('should report isSupported as true', () => {
      const { result } = renderHook(() => useHapticFeedback());
      expect(result.current.isSupported).toBe(true);
    });

    it('should trigger medium haptic by default', () => {
      const { result } = renderHook(() => useHapticFeedback());
      
      act(() => {
        result.current.triggerHaptic();
      });
      
      expect(mockVibrate).toHaveBeenCalledWith(25);
    });

    it('should trigger light haptic', () => {
      const { result } = renderHook(() => useHapticFeedback());
      
      act(() => {
        result.current.triggerHaptic('light');
      });
      
      expect(mockVibrate).toHaveBeenCalledWith(10);
    });

    it('should trigger heavy haptic', () => {
      const { result } = renderHook(() => useHapticFeedback());
      
      act(() => {
        result.current.triggerHaptic('heavy');
      });
      
      expect(mockVibrate).toHaveBeenCalledWith(50);
    });

    it('should maintain stable function reference', () => {
      const { result, rerender } = renderHook(() => useHapticFeedback());
      
      const firstTrigger = result.current.triggerHaptic;
      
      rerender();
      
      expect(result.current.triggerHaptic).toBe(firstTrigger);
    });
  });

  describe('when vibration is not supported', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'vibrate', {
        value: undefined,
        writable: true,
        configurable: true,
      });
    });

    it('should report isSupported as false', () => {
      const { result } = renderHook(() => useHapticFeedback());
      expect(result.current.isSupported).toBe(false);
    });

    it('should not throw when triggering haptic', () => {
      const { result } = renderHook(() => useHapticFeedback());
      
      // Should not throw
      act(() => {
        result.current.triggerHaptic();
        result.current.triggerHaptic('heavy');
        result.current.triggerHaptic('light');
      });
    });
  });
});
