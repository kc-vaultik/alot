/**
 * @fileoverview Types for the Marketplace feature.
 */

import { CollectCard } from '@/features/collect-room/types';
import type { RarityBand } from '@/types/shared';

// Re-export for convenience
export type { RarityBand };

/**
 * A card listing in the marketplace (gift or swap).
 */
export interface MarketplaceListing extends CollectCard {
  /** Type of listing */
  listing_type: 'GIFT' | 'SWAP';
  /** Transfer record ID */
  transfer_id: string;
  /** Token to claim this listing */
  claim_token?: string;
  /** When the listing was created */
  listed_at?: string;
  /** When the listing expires */
  expires_at?: string;
  /** Username of the lister */
  from_username?: string;
}

/**
 * Product data for display purposes.
 */
export interface ProductData {
  brand: string;
  model: string;
  rarity_score: number;
  product_image: string;
  value: number;
}
