/**
 * @fileoverview Barrel export for collect-room data hooks.
 * @module features/collect-room/hooks/data
 * 
 * @description Data fetching and real-time subscription hooks.
 * Handles server state management via React Query.
 */

// Query hooks
export { useMyReveals, useUnrevealedCards, useInvalidateReveals } from './useMyReveals';
export { useMyCredits, useInvalidateCredits } from './useMyCredits';
export { useMyAwards, useInvalidateAwards } from './useMyAwards';
export { useFreePullStatus, useClaimFreePull } from './useFreePull';

// Unified invalidation hook (preferred over individual useInvalidate* hooks)
export { useInvalidateQueries, type InvalidateQueries } from './useInvalidateQueries';

// Realtime hooks
export { useRealtimeReveals } from './useRealtimeReveals';

// Helper functions
export { fetchRevealsBySession, markRevealSeen, setQueryClientRef } from './revealHelpers';
