/**
 * @fileoverview Tests for useRoom hook
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

describe('useRoom', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should be disabled when roomId is undefined', async () => {
    const { useRoom } = await import('./useRoom');
    const { result } = renderHook(() => useRoom(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it('should be loading when roomId is provided', async () => {
    const { useRoom } = await import('./useRoom');
    const { result } = renderHook(() => useRoom('room-123'), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
  });

  it('should have correct initial error state', async () => {
    const { useRoom } = await import('./useRoom');
    const { result } = renderHook(() => useRoom('room-123'), {
      wrapper: createWrapper(),
    });

    expect(result.current.error).toBeNull();
    expect(result.current.isError).toBe(false);
  });
});
