/**
 * @fileoverview Tests for useScreenState hook
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useScreenState } from './useScreenState';

describe('useScreenState', () => {
  describe('initialization', () => {
    it('should initialize with default screen "sealed"', () => {
      const { result } = renderHook(() => useScreenState());
      expect(result.current.screen).toBe('sealed');
    });

    it('should accept custom initial screen', () => {
      const { result } = renderHook(() => useScreenState('reveal'));
      expect(result.current.screen).toBe('reveal');
    });

    it('should initialize with "collection" screen', () => {
      const { result } = renderHook(() => useScreenState('collection'));
      expect(result.current.screen).toBe('collection');
    });
  });

  describe('setScreen', () => {
    it('should update screen state directly', () => {
      const { result } = renderHook(() => useScreenState());
      
      act(() => {
        result.current.setScreen('emerge');
      });
      
      expect(result.current.screen).toBe('emerge');
    });

    it('should allow setting any valid screen', () => {
      const { result } = renderHook(() => useScreenState());
      
      const screens = ['sealed', 'emerge', 'reveal', 'golden', 'collection'] as const;
      
      screens.forEach((screenName) => {
        act(() => {
          result.current.setScreen(screenName);
        });
        expect(result.current.screen).toBe(screenName);
      });
    });
  });

  describe('navigation helpers', () => {
    it('should navigate to sealed screen', () => {
      const { result } = renderHook(() => useScreenState('reveal'));
      
      act(() => {
        result.current.goToSealed();
      });
      
      expect(result.current.screen).toBe('sealed');
    });

    it('should navigate to emerge screen', () => {
      const { result } = renderHook(() => useScreenState());
      
      act(() => {
        result.current.goToEmerge();
      });
      
      expect(result.current.screen).toBe('emerge');
    });

    it('should navigate to reveal screen', () => {
      const { result } = renderHook(() => useScreenState());
      
      act(() => {
        result.current.goToReveal();
      });
      
      expect(result.current.screen).toBe('reveal');
    });

    it('should navigate to golden screen', () => {
      const { result } = renderHook(() => useScreenState());
      
      act(() => {
        result.current.goToGolden();
      });
      
      expect(result.current.screen).toBe('golden');
    });

    it('should navigate to collection screen', () => {
      const { result } = renderHook(() => useScreenState());
      
      act(() => {
        result.current.goToCollection();
      });
      
      expect(result.current.screen).toBe('collection');
    });
  });

  describe('navigation flow', () => {
    it('should handle typical unboxing flow', () => {
      const { result } = renderHook(() => useScreenState());
      
      // Start at sealed
      expect(result.current.screen).toBe('sealed');
      
      // User taps to emerge
      act(() => {
        result.current.goToEmerge();
      });
      expect(result.current.screen).toBe('emerge');
      
      // Card rises to reveal
      act(() => {
        result.current.goToReveal();
      });
      expect(result.current.screen).toBe('reveal');
      
      // User adds to collection
      act(() => {
        result.current.goToCollection();
      });
      expect(result.current.screen).toBe('collection');
      
      // User goes back to unbox more
      act(() => {
        result.current.goToSealed();
      });
      expect(result.current.screen).toBe('sealed');
    });

    it('should handle golden card flow', () => {
      const { result } = renderHook(() => useScreenState());
      
      act(() => {
        result.current.goToEmerge();
      });
      
      act(() => {
        result.current.goToGolden();
      });
      
      expect(result.current.screen).toBe('golden');
    });
  });

  describe('memoization', () => {
    it('should maintain stable function references', () => {
      const { result, rerender } = renderHook(() => useScreenState());
      
      const firstRender = {
        goToSealed: result.current.goToSealed,
        goToEmerge: result.current.goToEmerge,
        goToReveal: result.current.goToReveal,
        goToGolden: result.current.goToGolden,
        goToCollection: result.current.goToCollection,
      };
      
      rerender();
      
      expect(result.current.goToSealed).toBe(firstRender.goToSealed);
      expect(result.current.goToEmerge).toBe(firstRender.goToEmerge);
      expect(result.current.goToReveal).toBe(firstRender.goToReveal);
      expect(result.current.goToGolden).toBe(firstRender.goToGolden);
      expect(result.current.goToCollection).toBe(firstRender.goToCollection);
    });
  });
});
