/**
 * @fileoverview Collectors components barrel export.
 * Internal use - external imports should use the main feature barrel.
 */

// ============= Main Components =============
export { CollectorCard } from './CollectorCard';
export { CollectorProfilePage } from './CollectorProfilePage';
export { CollectorScoreBadge, getScoreTier } from './CollectorScoreBadge';
export type { ScoreTier } from './CollectorScoreBadge';
export { CollectorSelector } from './CollectorSelector';
export { EditProfileModal } from './EditProfileModal';
export { PendingTransfersBadge } from './PendingTransfersBadge';

// ============= Shared =============
export { StatBox } from './shared';
export type { StatBoxProps } from './shared';

// ============= Modals =============
export { CollectionModal, CardSelectionModal } from './modals';
