/**
 * @fileoverview Checkout hooks for Collect Room feature.
 * @module features/collect-room/hooks/checkout
 * 
 * @description Handles purchase flows and Stripe integration:
 * - Standard mystery pack checkout
 * - Category-based pack checkout
 * - Stripe return URL handling
 * - Pricing and product queries
 */

export { useCheckout } from './useCheckout';
export { useCategoryCheckout } from './useCategoryCheckout';
export { useCategoryPricing } from './useCategoryPricing';
export { useCategoryProducts } from './useCategoryProducts';
export type { CategoryProduct } from './useCategoryProducts';
export { useStripeReturn } from './useStripeReturn';
