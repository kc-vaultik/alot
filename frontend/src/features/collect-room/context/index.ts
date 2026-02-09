/**
 * @fileoverview Context barrel exports.
 * @module features/collect-room/context
 */

// Main context (public API)
export { CollectRoomProvider, useCollectRoom } from './CollectRoomContext';
export type { CollectRoomContextValue, CollectRoomState, CollectRoomActions } from './types';

// Sub-contexts (for advanced usage)
export { RevealContextProvider, useRevealContext } from './RevealContext';
export type { RevealContextValue } from './RevealContext';

export { CreditsContextProvider, useCreditsContext } from './CreditsContext';
export type { CreditsContextValue } from './CreditsContext';

export { UIContextProvider, useUIContext } from './UIContext';
export type { UIContextValue } from './UIContext';

// Selectors
export { useTotalVaultValue, useIsLoading, calculateTotalVaultValue } from './selectors';
