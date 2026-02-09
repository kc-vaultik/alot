/**
 * @fileoverview Tests for useCollectorProfile hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { COLLECTOR_QUERY_KEYS } from './useCollectorProfile';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('COLLECTOR_QUERY_KEYS', () => {
  describe('profile', () => {
    it('should generate correct query key for profile', () => {
      const userId = 'user-123';
      expect(COLLECTOR_QUERY_KEYS.profile(userId)).toEqual(['collector', 'profile', 'user-123']);
    });
  });

  describe('search', () => {
    it('should generate correct query key for search', () => {
      const query = 'test search';
      expect(COLLECTOR_QUERY_KEYS.search(query)).toEqual(['collector', 'search', 'test search']);
    });
  });

  describe('list', () => {
    it('should generate correct query key for list filter', () => {
      const filter = 'mutual';
      expect(COLLECTOR_QUERY_KEYS.list(filter)).toEqual(['collector', 'list', 'mutual']);
    });
  });

  describe('collection', () => {
    it('should generate correct query key for collection', () => {
      const userId = 'user-456';
      expect(COLLECTOR_QUERY_KEYS.collection(userId)).toEqual(['collector', 'collection', 'user-456']);
    });
  });

  describe('myProfile', () => {
    it('should return correct static query key', () => {
      expect(COLLECTOR_QUERY_KEYS.myProfile).toEqual(['collector', 'my-profile']);
    });
  });
});

describe('useCollectorProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should be disabled when userId is undefined', async () => {
    const { useCollectorProfile } = await import('./useCollectorProfile');
    const { result } = renderHook(() => useCollectorProfile(undefined), {
      wrapper: createWrapper(),
    });

    // Query should not be loading since it's disabled
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it('should be disabled when userId is empty string', async () => {
    const { useCollectorProfile } = await import('./useCollectorProfile');
    const { result } = renderHook(() => useCollectorProfile(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
  });
});
