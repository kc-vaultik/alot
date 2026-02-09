/**
 * @fileoverview Shared hooks barrel export.
 * @module hooks
 * 
 * App-wide hooks only. Feature-specific hooks should be imported from their
 * respective feature modules:
 * - Credits: import { useMyCredits } from '@/features/collect-room/hooks'
 * - Rooms: import { useActiveRooms } from '@/features/rooms/hooks'
 */

// Device & UI hooks
export { useIsMobile, useScrollPosition, useSectionScroll } from "./useDeviceDetection";
export { useToast } from "./useToast";
export { useApiError, isApiErrorResponse, extractErrorMessage } from "./useApiError";
export { useLocalStorage } from "./useLocalStorage";

// Styling hooks
export { useCardStyles, type CardStyles } from "./useCardStyles";
