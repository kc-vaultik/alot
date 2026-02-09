/**
 * @module features/marketplace
 * @description Marketplace Feature - Card trading and listings
 * 
 * This module provides:
 * - Product catalog with rarity scores
 * - Card generation utilities
 * - Marketplace grid and listings
 * - Gift and swap listing management
 */

// ============================================================================
// TYPES - Public type definitions
// ============================================================================
export type {
  MarketplaceListing,
  ProductData,
} from './types';

// ============================================================================
// DATA - Product catalog
// ============================================================================
export { 
  productDatabase, 
  getProductValue 
} from './data/products';

// ============================================================================
// UTILITIES - Card generation and display
// ============================================================================
export { 
  generateRandomCard, 
  generateDemoCollection, 
  generateMarketplaceCards,
  getDesignTraits,
  getCardBorderClass,
  getGradientColors,
} from './utils';

// ============================================================================
// HOOKS - Marketplace data and actions
// ============================================================================
export { 
  useMarketplaceListings, 
  useCreatePublicListing,
  useMyListings,
} from './hooks';

// ============================================================================
// COMPONENTS - UI components
// ============================================================================
export { MarketplaceGrid, MarketplaceCard } from './components';
