/**
 * @fileoverview Types for Vault components.
 * Re-exports from feature-level and shared types.
 * Component-specific types should stay local to their components.
 */

// Re-export feature types used by vault components
export type { 
  CollectCard, 
  ProductProgress,
  CardRewards,
  ProgressShards,
  DesignTraits,
} from '../../types';

// Re-export shared types
export type { CardState, RarityBand, RarityTier, StakableCard } from '@/types/shared';
