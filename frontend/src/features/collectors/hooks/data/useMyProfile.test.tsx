/**
 * @fileoverview Tests for useMyProfile hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
      insert: vi.fn(() => Promise.resolve({ error: null })),
    })),
  },
}));

// Mock AuthContext
const mockUser = { id: 'test-user-id', email: 'test@example.com' };
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: mockUser }),
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

describe('useMyProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should be enabled when user is authenticated', async () => {
    const { useMyProfile } = await import('./useMyProfile');
    const { result } = renderHook(() => useMyProfile(), {
      wrapper: createWrapper(),
    });

    // Hook should be loading initially since user is authenticated
    expect(result.current.isLoading).toBe(true);
  });

  it('should expose update and create functions', async () => {
    const { useMyProfile } = await import('./useMyProfile');
    const { result } = renderHook(() => useMyProfile(), {
      wrapper: createWrapper(),
    });

    expect(typeof result.current.updateProfile).toBe('function');
    expect(typeof result.current.createProfile).toBe('function');
  });

  it('should expose loading states for mutations', async () => {
    const { useMyProfile } = await import('./useMyProfile');
    const { result } = renderHook(() => useMyProfile(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isUpdating).toBe(false);
    expect(result.current.isCreating).toBe(false);
  });
});
