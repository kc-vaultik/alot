/**
 * @fileoverview Tests for useRooms hook
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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

describe('useRooms', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should be loading initially', async () => {
    const { useRooms } = await import('./useRooms');
    const { result } = renderHook(() => useRooms(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
  });

  it('should accept optional tier filter', async () => {
    const { useRooms } = await import('./useRooms');
    
    // Test with no tier
    const { result: noTierResult } = renderHook(() => useRooms(), {
      wrapper: createWrapper(),
    });
    expect(noTierResult.current.isLoading).toBe(true);

    // Test with tier
    const { result: withTierResult } = renderHook(() => useRooms('GRAIL'), {
      wrapper: createWrapper(),
    });
    expect(withTierResult.current.isLoading).toBe(true);
  });

  it('should have correct initial state', async () => {
    const { useRooms } = await import('./useRooms');
    const { result } = renderHook(() => useRooms(), {
      wrapper: createWrapper(),
    });

    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeNull();
    expect(result.current.isError).toBe(false);
  });
});
