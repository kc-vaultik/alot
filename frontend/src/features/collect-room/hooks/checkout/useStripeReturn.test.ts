import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { waitFor } from '@testing-library/dom';

// ============= Mocks =============

// Mock supabase
const mockGetUser = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: () => mockGetUser(),
    },
  },
}));

// Mock toast
const mockToastInfo = vi.fn();
const mockToastError = vi.fn();
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    toast: {
      info: mockToastInfo,
      error: mockToastError,
    },
  }),
}));

// Mock fetchRevealsBySession
const mockFetchRevealsBySession = vi.fn();
vi.mock('../data', () => ({
  fetchRevealsBySession: (...args: unknown[]) => mockFetchRevealsBySession(...args),
}));

// Mock sleep to speed up tests
vi.mock('../../utils/dateUtils', () => ({
  sleep: () => Promise.resolve(),
}));

// Import after mocks
import { useStripeReturn } from './useStripeReturn';
import type { CollectCard } from '../../types';

// ============= Test Helpers =============

function setUrlParams(params: Record<string, string>) {
  const url = new URL(window.location.href);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  window.history.replaceState({}, '', url.toString());
}

function clearUrlParams() {
  window.history.replaceState({}, '', window.location.pathname);
}

function createMockCard(id: string): CollectCard {
  return {
    card_id: id,
    product_reveal: 'Test Product',
    brand: 'TestBrand',
    model: 'TestModel',
    product_image: '/test.png',
    product_value: 1000,
    rarity_score: 50,
    is_golden: false,
    design_traits: {
      background: 'matte-black',
      texture: 'smooth',
      emblem: 'standard',
      borderStyle: 'clean',
      foilType: 'none',
      typography: 'modern',
    },
    serial_number: '0001/10000',
    // Room Stats
    priority_points: 0,
    redeem_credits_cents: 0,
    card_state: 'owned',
    staked_room_id: null,
    band: 'RARE',
  };
}

// ============= Tests =============

describe('useStripeReturn', () => {
  const mockOnRevealsReady = vi.fn();
  const mockOnRefetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    clearUrlParams();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } });
  });

  afterEach(() => {
    clearUrlParams();
  });

  describe('URL parameter parsing', () => {
    it('handles canceled payment', async () => {
      setUrlParams({ canceled: 'true' });

      renderHook(() =>
        useStripeReturn({
          onRevealsReady: mockOnRevealsReady,
          onRefetch: mockOnRefetch,
        })
      );

      await waitFor(() => {
        expect(mockToastInfo).toHaveBeenCalledWith(
          'Payment canceled',
          'Your purchase was not completed.'
        );
      });
    });

    it('handles success with session_id', async () => {
      const mockCards = [createMockCard('card-1')];
      mockFetchRevealsBySession.mockResolvedValue({ data: mockCards, error: null });

      setUrlParams({ success: 'true', session_id: 'cs_test_123' });

      const { result } = renderHook(() =>
        useStripeReturn({
          onRevealsReady: mockOnRevealsReady,
          onRefetch: mockOnRefetch,
        })
      );

      // Should start in opening state
      expect(result.current.isOpening).toBe(true);

      await waitFor(() => {
        expect(mockOnRevealsReady).toHaveBeenCalledWith(mockCards);
      });
    });

    it('handles alternative purchase=success param', async () => {
      const mockCards = [createMockCard('card-1')];
      mockFetchRevealsBySession.mockResolvedValue({ data: mockCards, error: null });

      setUrlParams({ purchase: 'success', session_id: 'cs_test_123' });

      renderHook(() =>
        useStripeReturn({
          onRevealsReady: mockOnRevealsReady,
          onRefetch: mockOnRefetch,
        })
      );

      await waitFor(() => {
        expect(mockFetchRevealsBySession).toHaveBeenCalledWith('cs_test_123');
      });
    });
  });

  describe('polling behavior', () => {
    it('waits for auth before polling', async () => {
      // First call returns no user, second returns user
      mockGetUser
        .mockResolvedValueOnce({ data: { user: null } })
        .mockResolvedValueOnce({ data: { user: { id: 'user-123' } } });

      const mockCards = [createMockCard('card-1')];
      mockFetchRevealsBySession.mockResolvedValue({ data: mockCards, error: null });

      setUrlParams({ success: 'true', session_id: 'cs_test_123' });

      renderHook(() =>
        useStripeReturn({
          onRevealsReady: mockOnRevealsReady,
          onRefetch: mockOnRefetch,
        })
      );

      await waitFor(() => {
        // Should have called getUser multiple times
        expect(mockGetUser).toHaveBeenCalledTimes(2);
      });
    });

    it('calls onRefetch and onRevealsReady when cards found', async () => {
      const mockCards = [createMockCard('card-1'), createMockCard('card-2')];
      mockFetchRevealsBySession.mockResolvedValue({ data: mockCards, error: null });

      setUrlParams({ success: 'true', session_id: 'cs_test_123' });

      renderHook(() =>
        useStripeReturn({
          onRevealsReady: mockOnRevealsReady,
          onRefetch: mockOnRefetch,
        })
      );

      await waitFor(() => {
        expect(mockOnRefetch).toHaveBeenCalled();
        expect(mockOnRevealsReady).toHaveBeenCalledWith(mockCards);
      });
    });

    it('stops polling when cards are found', async () => {
      const mockCards = [createMockCard('card-1')];
      mockFetchRevealsBySession.mockResolvedValue({ data: mockCards, error: null });

      setUrlParams({ success: 'true', session_id: 'cs_test_123' });

      const { result } = renderHook(() =>
        useStripeReturn({
          onRevealsReady: mockOnRevealsReady,
          onRefetch: mockOnRefetch,
        })
      );

      await waitFor(() => {
        expect(result.current.isOpening).toBe(false);
      });
    });

    it('continues polling when no cards found', async () => {
      // Return empty array first, then cards
      mockFetchRevealsBySession
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValue({ data: [createMockCard('card-1')], error: null });

      setUrlParams({ success: 'true', session_id: 'cs_test_123' });

      renderHook(() =>
        useStripeReturn({
          onRevealsReady: mockOnRevealsReady,
          onRefetch: mockOnRefetch,
        })
      );

      await waitFor(() => {
        expect(mockFetchRevealsBySession.mock.calls.length).toBeGreaterThan(1);
      });
    });
  });

  describe('error handling', () => {
    it('shows error toast when auth never becomes ready', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });

      setUrlParams({ success: 'true', session_id: 'cs_test_123' });

      renderHook(() =>
        useStripeReturn({
          onRevealsReady: mockOnRevealsReady,
          onRefetch: mockOnRefetch,
        })
      );

      await waitFor(
        () => {
          expect(mockToastError).toHaveBeenCalledWith(
            'Session issue',
            'Please refresh the page to see your cards.'
          );
        },
        { timeout: 5000 }
      );
    });

    it('handles fetch errors gracefully', async () => {
      mockFetchRevealsBySession
        .mockResolvedValueOnce({ data: null, error: new Error('Network error') })
        .mockResolvedValue({ data: [createMockCard('card-1')], error: null });

      setUrlParams({ success: 'true', session_id: 'cs_test_123' });

      renderHook(() =>
        useStripeReturn({
          onRevealsReady: mockOnRevealsReady,
          onRefetch: mockOnRefetch,
        })
      );

      // Should eventually succeed after retrying
      await waitFor(() => {
        expect(mockOnRevealsReady).toHaveBeenCalled();
      });
    });
  });

  describe('cleanup', () => {
    it('clears URL params after successful reveal', async () => {
      const mockCards = [createMockCard('card-1')];
      mockFetchRevealsBySession.mockResolvedValue({ data: mockCards, error: null });

      setUrlParams({ success: 'true', session_id: 'cs_test_123' });

      renderHook(() =>
        useStripeReturn({
          onRevealsReady: mockOnRevealsReady,
          onRefetch: mockOnRefetch,
        })
      );

      await waitFor(() => {
        expect(window.location.search).toBe('');
      });
    });

    it('does not start polling without session_id', () => {
      setUrlParams({ success: 'true' }); // No session_id

      const { result } = renderHook(() =>
        useStripeReturn({
          onRevealsReady: mockOnRevealsReady,
          onRefetch: mockOnRefetch,
        })
      );

      expect(result.current.isOpening).toBe(false);
      expect(mockFetchRevealsBySession).not.toHaveBeenCalled();
    });
  });
});
