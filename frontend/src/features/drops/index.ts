/**
 * @module features/drops
 * @description Prize Drops Feature - Crowdfunded collectible giveaways
 * 
 * This module is an alias for the rooms feature with renamed exports.
 * Use "Drop" terminology in new code; "Room" is maintained for backwards compatibility.
 * 
 * Database tables still use "rooms" naming for compatibility.
 */

// Re-export everything from rooms feature with new naming
export * from '@/features/rooms';

// Re-export types with Drop naming
export type {
  Room as Drop,
  RoomEntry as DropEntry,
  RoomStatus as DropStatus,
  RoomTier as DropTier,
  RoomEntryStatus as DropEntryStatus,
  RoomProduct as DropProduct,
  JoinRoomResponse as JoinDropResponse,
  LeaveRoomResponse as LeaveDropResponse,
  RoomLeaderboardResponse as DropLeaderboardResponse,
  ActiveRoomsResponse as ActiveDropsResponse,
  MyRoomEntryResponse as MyDropEntryResponse,
  RoomReward as DropReward,
} from '@/features/rooms';
