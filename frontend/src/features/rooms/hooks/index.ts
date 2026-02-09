/**
 * @fileoverview Public hook exports for the Rooms feature.
 * 
 * @description Provides hooks for room data fetching, mutations (join/leave),
 * and checkout flows. Hooks are organized into subfolders by responsibility.
 * 
 * @module features/rooms/hooks
 * 
 * @example
 * // Fetch active rooms
 * import { useRooms, useJoinRoom } from '@/features/rooms/hooks';
 * 
 * function RoomLobby() {
 *   const { data: rooms, isLoading } = useRooms();
 *   const { mutate: joinRoom } = useJoinRoom();
 *   
 *   return rooms?.map(room => (
 *     <RoomCard key={room.id} room={room} onJoin={() => joinRoom({ roomId: room.id })} />
 *   ));
 * }
 */

// ============= Data Hooks =============
// Fetch room data, leaderboards, eligible cards

export { useRooms, useRoom, useRoomLeaderboard, useMyEligibleCards, useMyRoomEntry, useProductsByTier } from './data';

// ============= Mutation Hooks =============
// Join rooms, leave rooms, claim rewards

export { useJoinRoom, useLeaveRoom, useClaimRedemption, useBuyEntriesWithCredits } from './mutations';

// ============= Checkout Hooks =============
// Stripe checkout and return handling

export { useRoomEntryCheckout, useRoomEntryReturn } from './checkout';
