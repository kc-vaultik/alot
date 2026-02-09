/**
 * @fileoverview Product Progress Hook
 * Aggregates cards by product to calculate redemption progress
 */

import { useMemo } from 'react';
import type { CollectCard, ProductProgress } from '../../types';

/** Internal mutable type for aggregation */
interface MutableProductProgress {
  productKey: string;
  brand: string;
  model: string;
  productImage: string;
  productValue: number;
  totalShards: number;
  cardCount: number;
  isRedeemable: boolean;
  cards: CollectCard[];
  latestCard: CollectCard;
  goldenCard: CollectCard | null;
  displayCard: CollectCard;
  totalPoints: number;
  hasGolden: boolean;
  hasPrize: boolean;
}

/**
 * Aggregates a collection of cards into product-level progress data.
 * Groups cards by product key and calculates total shards, points, and redemption status.
 * 
 * @param collection - Array of CollectCards to aggregate
 * @returns Sorted array of ProductProgress, highest shards first
 * 
 * @example
 * const productProgress = useProductProgress(reveals);
 * // Returns: [{ productKey: 'rolex-submariner', totalShards: 45, cardCount: 3, ... }, ...]
 */
export function useProductProgress(collection: CollectCard[]): ProductProgress[] {
  return useMemo(() => {
    const progressMap = new Map<string, MutableProductProgress>();

    collection.forEach((card) => {
      const shards = card.rewards?.progress?.shards_earned || 0;
      const points = card.rewards?.points || 0;
      const productKey =
        card.rewards?.progress?.product_key ||
        `${card.brand}-${card.model}`.toLowerCase().replace(/\s+/g, '-');

      const existing = progressMap.get(productKey);

      if (existing) {
        // Aggregate into existing product
        existing.totalShards += shards;
        existing.cardCount += 1;
        existing.isRedeemable = existing.totalShards >= 100;
        existing.cards.push(card);
        existing.totalPoints += points;

        if (card.is_golden) {
          existing.hasGolden = true;
          existing.goldenCard = card;
          existing.displayCard = card; // Golden cards take display priority
        }

        if (card.rewards?.prize?.redeemable) {
          existing.hasPrize = true;
        }

        existing.latestCard = card;
      } else {
        // Create new product entry
        progressMap.set(productKey, {
          productKey,
          brand: card.brand,
          model: card.model,
          productImage: card.product_image,
          productValue: card.product_value || 0,
          totalShards: shards,
          cardCount: 1,
          isRedeemable: shards >= 100,
          cards: [card],
          latestCard: card,
          goldenCard: card.is_golden ? card : null,
          displayCard: card,
          totalPoints: points,
          hasGolden: card.is_golden || false,
          hasPrize: card.rewards?.prize?.redeemable || false,
        });
      }
    });

    // Sort by highest shards first and cast to readonly type
    return Array.from(progressMap.values()).sort((a, b) => b.totalShards - a.totalShards) as ProductProgress[];
  }, [collection]);
}
