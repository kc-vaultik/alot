/**
 * @fileoverview Barrel export for shared types.
 * Import types from here for convenience.
 * 
 * @example
 * import { RarityBand, CardState, UserProfile, CreditsData } from '@/types';
 */

export * from './shared';

// ============= Credits Types =============

import type { RarityBand } from './shared';

/**
 * Product-specific credit information.
 * Represents credits accumulated toward a specific product redemption.
 */
export interface ProductCredit {
  readonly product_class_id: string;
  readonly credits: number;
  readonly product_classes: {
    readonly id: string;
    readonly name: string;
    readonly brand: string;
    readonly model: string;
    readonly category: string;
    readonly band: RarityBand;
    readonly retail_value_usd: number;
    readonly image_url: string | null;
    readonly expected_fulfillment_cost_usd: number;
  };
}

/**
 * User's complete credits data.
 * Contains both universal credits and product-specific credits.
 */
export interface CreditsData {
  readonly universal: number;
  readonly products: readonly ProductCredit[];
}
