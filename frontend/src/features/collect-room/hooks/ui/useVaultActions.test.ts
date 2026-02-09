/**
 * @fileoverview Tests for useVaultActions hook
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useVaultActions } from './useVaultActions';
import type { CollectCard, ProductProgress } from '../../types';

// Mock navigator APIs
const mockShare = vi.fn();
const mockWriteText = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  
  // Reset navigator mocks
  Object.defineProperty(navigator, 'share', {
    value: undefined,
    writable: true,
    configurable: true,
  });
  
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: mockWriteText },
    writable: true,
    configurable: true,
  });
});

// Mock card factory
const createMockCard = (overrides: Partial<CollectCard> = {}): CollectCard => ({
  card_id: 'card-123',
  product_reveal: 'reveal-123',
  brand: 'Nike',
  model: 'Air Max',
  product_image: 'https://example.com/image.jpg',
  product_value: 200,
  rarity_score: 75,
  is_golden: false,
  design_traits: {
    background: 'matte-black',
    texture: 'smooth',
    emblem: 'standard',
    borderStyle: 'clean',
    foilType: 'none',
    typography: 'modern',
  },
  serial_number: 'SN-001',
  priority_points: 10,
  redeem_credits_cents: 500,
  card_state: 'owned',
  staked_room_id: null,
  band: 'RARE',
  ...overrides,
});

const createMockProductProgress = (): ProductProgress => ({
  productKey: 'product-123',
  brand: 'Nike',
  model: 'Air Max',
  productImage: 'https://example.com/image.jpg',
  productValue: 200,
  totalShards: 100,
  cardCount: 5,
  isRedeemable: false,
  cards: [],
  latestCard: createMockCard(),
  goldenCard: null,
  displayCard: createMockCard(),
  totalPoints: 50,
  hasGolden: false,
  hasPrize: false,
});

describe('useVaultActions', () => {
  const mockOnUnboxAnother = vi.fn();
  const mockOnSpendPoints = vi.fn();

  beforeEach(() => {
    mockOnUnboxAnother.mockClear();
    mockOnSpendPoints.mockClear();
  });

  describe('initialization', () => {
    it('should initialize with null selectedCard', () => {
      const { result } = renderHook(() => 
        useVaultActions({ onUnboxAnother: mockOnUnboxAnother })
      );
      expect(result.current.selectedCard).toBeNull();
    });

    it('should initialize with null giftSwapMode', () => {
      const { result } = renderHook(() => 
        useVaultActions({ onUnboxAnother: mockOnUnboxAnother })
      );
      expect(result.current.giftSwapMode).toBeNull();
    });

    it('should initialize with null giftSwapCard', () => {
      const { result } = renderHook(() => 
        useVaultActions({ onUnboxAnother: mockOnUnboxAnother })
      );
      expect(result.current.giftSwapCard).toBeNull();
    });

    it('should initialize with null buyProgressProduct', () => {
      const { result } = renderHook(() => 
        useVaultActions({ onUnboxAnother: mockOnUnboxAnother })
      );
      expect(result.current.buyProgressProduct).toBeNull();
    });
  });

  describe('setSelectedCard', () => {
    it('should set selected card', () => {
      const { result } = renderHook(() => 
        useVaultActions({ onUnboxAnother: mockOnUnboxAnother })
      );
      const mockCard = createMockCard();
      
      act(() => {
        result.current.setSelectedCard(mockCard);
      });
      
      expect(result.current.selectedCard).toEqual(mockCard);
    });

    it('should clear selected card when set to null', () => {
      const { result } = renderHook(() => 
        useVaultActions({ onUnboxAnother: mockOnUnboxAnother })
      );
      const mockCard = createMockCard();
      
      act(() => {
        result.current.setSelectedCard(mockCard);
      });
      
      act(() => {
        result.current.setSelectedCard(null);
      });
      
      expect(result.current.selectedCard).toBeNull();
    });
  });

  describe('handleGift', () => {
    it('should set giftSwapCard and mode to gift', () => {
      const { result } = renderHook(() => 
        useVaultActions({ onUnboxAnother: mockOnUnboxAnother })
      );
      const mockCard = createMockCard();
      
      act(() => {
        result.current.handleGift(mockCard);
      });
      
      expect(result.current.giftSwapCard).toEqual(mockCard);
      expect(result.current.giftSwapMode).toBe('gift');
    });
  });

  describe('handleSwap', () => {
    it('should set giftSwapCard and mode to swap', () => {
      const { result } = renderHook(() => 
        useVaultActions({ onUnboxAnother: mockOnUnboxAnother })
      );
      const mockCard = createMockCard();
      
      act(() => {
        result.current.handleSwap(mockCard);
      });
      
      expect(result.current.giftSwapCard).toEqual(mockCard);
      expect(result.current.giftSwapMode).toBe('swap');
    });
  });

  describe('handleCloseGiftSwap', () => {
    it('should clear gift/swap state', () => {
      const { result } = renderHook(() => 
        useVaultActions({ onUnboxAnother: mockOnUnboxAnother })
      );
      const mockCard = createMockCard();
      
      act(() => {
        result.current.handleGift(mockCard);
      });
      
      act(() => {
        result.current.handleCloseGiftSwap();
      });
      
      expect(result.current.giftSwapCard).toBeNull();
      expect(result.current.giftSwapMode).toBeNull();
    });
  });

  describe('handleConfirmGiftSwap', () => {
    it('should clear all modal state', () => {
      const { result } = renderHook(() => 
        useVaultActions({ onUnboxAnother: mockOnUnboxAnother })
      );
      const mockCard = createMockCard();
      
      // Set up state
      act(() => {
        result.current.setSelectedCard(mockCard);
        result.current.handleGift(mockCard);
      });
      
      // Confirm gift
      act(() => {
        result.current.handleConfirmGiftSwap('gift');
      });
      
      expect(result.current.giftSwapCard).toBeNull();
      expect(result.current.giftSwapMode).toBeNull();
      expect(result.current.selectedCard).toBeNull();
    });
  });

  describe('handleUnboxMore', () => {
    it('should clear selected card and call onUnboxAnother', () => {
      const { result } = renderHook(() => 
        useVaultActions({ onUnboxAnother: mockOnUnboxAnother })
      );
      const mockCard = createMockCard();
      
      act(() => {
        result.current.setSelectedCard(mockCard);
      });
      
      act(() => {
        result.current.handleUnboxMore();
      });
      
      expect(result.current.selectedCard).toBeNull();
      expect(mockOnUnboxAnother).toHaveBeenCalledTimes(1);
    });
  });

  describe('handleBuyProgress', () => {
    it('should call onSpendPoints and clear product', () => {
      const { result } = renderHook(() => 
        useVaultActions({ 
          onUnboxAnother: mockOnUnboxAnother,
          onSpendPoints: mockOnSpendPoints,
        })
      );
      const mockProduct = createMockProductProgress();
      
      act(() => {
        result.current.setBuyProgressProduct(mockProduct);
      });
      
      act(() => {
        result.current.handleBuyProgress(50, 25);
      });
      
      expect(mockOnSpendPoints).toHaveBeenCalledWith(50, 'product-123', 25);
      expect(result.current.buyProgressProduct).toBeNull();
    });

    it('should not call onSpendPoints if no product selected', () => {
      const { result } = renderHook(() => 
        useVaultActions({ 
          onUnboxAnother: mockOnUnboxAnother,
          onSpendPoints: mockOnSpendPoints,
        })
      );
      
      act(() => {
        result.current.handleBuyProgress(50, 25);
      });
      
      expect(mockOnSpendPoints).not.toHaveBeenCalled();
    });

    it('should not call onSpendPoints if callback not provided', () => {
      const { result } = renderHook(() => 
        useVaultActions({ onUnboxAnother: mockOnUnboxAnother })
      );
      const mockProduct = createMockProductProgress();
      
      act(() => {
        result.current.setBuyProgressProduct(mockProduct);
      });
      
      // Should not throw
      act(() => {
        result.current.handleBuyProgress(50, 25);
      });
      
      expect(result.current.buyProgressProduct).toBeNull();
    });
  });

  describe('handleShare', () => {
    it('should copy to clipboard when share API not available', async () => {
      const { result } = renderHook(() => 
        useVaultActions({ onUnboxAnother: mockOnUnboxAnother })
      );
      const mockCard = createMockCard({ 
        brand: 'Nike', 
        model: 'Air Max',
        serial_number: 'SN-001',
        rarity_score: 75, // RARE
      });
      
      await act(async () => {
        await result.current.handleShare(mockCard);
      });
      
      expect(mockWriteText).toHaveBeenCalledWith(
        expect.stringContaining('Nike Air Max #SN-001')
      );
      expect(mockWriteText).toHaveBeenCalledWith(
        expect.stringContaining('#CollectRoom')
      );
    });

    it('should use native share when available', async () => {
      Object.defineProperty(navigator, 'share', {
        value: mockShare,
        writable: true,
        configurable: true,
      });
      
      const { result } = renderHook(() => 
        useVaultActions({ onUnboxAnother: mockOnUnboxAnother })
      );
      const mockCard = createMockCard();
      
      await act(async () => {
        await result.current.handleShare(mockCard);
      });
      
      expect(mockShare).toHaveBeenCalledWith({
        title: 'Collect Room Pull',
        text: expect.stringContaining('#CollectRoom'),
      });
    });

    it('should handle share cancellation gracefully', async () => {
      mockShare.mockRejectedValue(new Error('User cancelled'));
      Object.defineProperty(navigator, 'share', {
        value: mockShare,
        writable: true,
        configurable: true,
      });
      
      const { result } = renderHook(() => 
        useVaultActions({ onUnboxAnother: mockOnUnboxAnother })
      );
      const mockCard = createMockCard();
      
      // Should not throw
      await act(async () => {
        await result.current.handleShare(mockCard);
      });
    });
  });

  describe('setBuyProgressProduct', () => {
    it('should set buy progress product', () => {
      const { result } = renderHook(() => 
        useVaultActions({ onUnboxAnother: mockOnUnboxAnother })
      );
      const mockProduct = createMockProductProgress();
      
      act(() => {
        result.current.setBuyProgressProduct(mockProduct);
      });
      
      expect(result.current.buyProgressProduct).toEqual(mockProduct);
    });
  });
});
