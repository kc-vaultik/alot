/**
 * @module features/collectors
 * @description Collectors Feature - Social profiles and connections
 * 
 * This module provides:
 * - Collector profile management
 * - Search and discovery
 * - Follow/unfollow connections
 * - Collection viewing
 * - Pending transfer management
 */

// ============================================================================
// TYPES - Public type definitions
// ============================================================================
export type {
  CollectorProfile,
  CollectorListItem,
  CollectorStats,
  ScoreBreakdown,
  CollectorCollection,
  CollectorOwnedCard,
  CollectorFilter,
} from './types';

// Re-export shared types
export type { UserProfile, ExtendedUserProfile } from '@/types/shared';

// ============================================================================
// HOOKS - Data fetching and actions
// ============================================================================
export { 
  useCollectorProfile, 
  COLLECTOR_QUERY_KEYS,
  useSearchCollectors,
  useCollectorCollection,
  useMyProfile,
  usePendingTransfers,
} from './hooks/data';

export { useCollectorConnections } from './hooks/mutations';

// ============================================================================
// COMPONENTS - UI components
// ============================================================================
export { 
  CollectorScoreBadge, 
  getScoreTier,
} from './components/CollectorScoreBadge';
export type { ScoreTier } from './components/CollectorScoreBadge';
export { CollectorCard } from './components/CollectorCard';
export { CollectorProfilePage } from './components/CollectorProfilePage';
export { EditProfileModal } from './components/EditProfileModal';
export { PendingTransfersBadge } from './components/PendingTransfersBadge';
export { CollectorSelector } from './components/CollectorSelector';

// Shared components
export { StatBox } from './components/shared';
export type { StatBoxProps } from './components/shared';

// Modal components
export { CollectionModal, CardSelectionModal } from './components/modals';
