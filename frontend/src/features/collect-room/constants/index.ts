/**
 * @fileoverview Collect Room Constants barrel export.
 * 
 * Constants hierarchy:
 * - App-wide constants: import from '@/constants'
 * - Feature constants: defined here or in sub-modules
 * 
 * Consumers should import app-wide constants (ROUTES, PATTERNS) 
 * directly from '@/constants' rather than through this module.
 */

// ============= Query Keys =============
export const QUERY_KEYS = {
  REVEALS: 'collect-room-reveals',
  UNREVEALED: 'collect-room-unrevealed',
  CREDITS: 'collect-room-credits',
  AWARDS: 'collect-room-awards',
  FREE_PULL: 'collect-room-free-pull',
} as const;

// ============= Cache Timing =============
export const STALE_TIMES = {
  REVEALS: 30_000,
  CREDITS: 30_000,
  AWARDS: 30_000,
  FREE_PULL: 30_000,
  UNREVEALED: 30_000,
} as const;

// ============= Polling Intervals =============
export const POLLING = {
  FREE_PULL_REFETCH_INTERVAL: 60_000,
  STRIPE_TIMEOUT_MS: 60_000,
  STRIPE_POLL_INTERVAL_MS: 1_200,
  AUTH_RETRY_DELAY_MS: 500,
  AUTH_MAX_RETRIES: 10,
} as const;

// ============= Rarity Configuration =============
export {
  RARITY_BANDS,
  RARITY_SCORES,
  RARITY_THRESHOLDS,
  HAPTIC_PATTERNS,
  type RarityBandKey,
} from './rarity';

// ============= Category Packs =============
export { 
  CATEGORY_PACKS,
  type CategoryPackConfig,
  type ProductCategory,
} from './categories';
