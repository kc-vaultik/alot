/**
 * @fileoverview Constants for the Rooms feature
 */

export const ROOM_QUERY_KEYS = {
  ACTIVE_ROOMS: 'active-rooms',
  ROOM: 'room',
  ROOM_LEADERBOARD: 'room-leaderboard',
  MY_ELIGIBLE_CARDS: 'my-eligible-cards',
  MY_ROOM_ENTRIES: 'my-room-entries',
  MY_ROOM_ENTRY: 'my-room-entry',
  REWARD_PACKS: 'reward-packs',
} as const;

export const ROOM_TIERS = {
  ICON: {
    name: 'Icon',
    cap_cents: 100000,
    cap_display: '$1,000',
    color: 'from-zinc-400 to-zinc-300',
    bgColor: 'bg-zinc-500/20',
    borderColor: 'border-zinc-400/30',
  },
  RARE: {
    name: 'Rare',
    cap_cents: 800000,
    cap_display: '$8,000',
    color: 'from-blue-500 to-cyan-400',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-400/30',
  },
  GRAIL: {
    name: 'Grail',
    cap_cents: 5000000,
    cap_display: '$50,000',
    color: 'from-violet-500 to-purple-400',
    bgColor: 'bg-violet-500/20',
    borderColor: 'border-violet-400/30',
  },
  MYTHIC: {
    name: 'Mythic',
    cap_cents: 10000000,
    cap_display: '$100,000+',
    color: 'from-amber-500 to-yellow-400',
    bgColor: 'bg-amber-500/20',
    borderColor: 'border-amber-400/30',
  },
} as const;

export const ROOM_STATUS_LABELS = {
  OPEN: 'Open',
  LOCKED: 'Locked',
  FUNDED: 'Funded',
  DRAWING: 'Drawing Winner',
  CLOSED: 'Closed',
  SETTLED: 'Settled',
  EXPIRED: 'Expired',
  REFUNDING: 'Refunding',
} as const;

export const STALE_TIME = {
  ROOMS: 10000, // 10 seconds
  LEADERBOARD: 5000, // 5 seconds
  ELIGIBLE_CARDS: 30000, // 30 seconds
} as const;

export const SCORING_WEIGHTS = {
  RC_WEIGHT: 0.55,
  PP_WEIGHT: 0.35,
  RS_WEIGHT: 0.10,
} as const;

export const REWARD_CONFIG = {
  PLACEMENT_BONUS: {
    S: 120,  // Top 10%
    A: 70,   // 11-30%
    B: 35,   // 31-60%
    C: 0,    // 61-100%
  },
  PACK_BONUS: {
    S: 1,
    A: 1,
    B: 0,
    C: 0,
  },
  TIER_MULTIPLIERS: {
    ICON: 1.0,
    RARE: 1.5,
    GRAIL: 2.2,
    MYTHIC: 3.5,
  },
  BASE_PARTICIPATION_CREDITS: {
    ICON: 40,
    RARE: 60,
    GRAIL: 90,
    MYTHIC: 140,
  },
  BASE_PACKS: {
    ICON: 0,
    RARE: 0,
    GRAIL: 1,
    MYTHIC: 1,
  },
  PACKS_CAP: {
    ICON: 0,
    RARE: 0,
    GRAIL: 2,
    MYTHIC: 2,
  },
} as const;

export const COMPETITIVENESS_THRESHOLDS = {
  HIGH: 70,   // Score >= 70
  MEDIUM: 40, // Score >= 40
  LOW: 0,     // Score < 40
} as const;

export const PERCENTILE_BAND_LABELS = {
  S: 'Top 10%',
  A: '11-30%',
  B: '31-60%',
  C: '61-100%',
} as const;

// Prize Room Entry Pricing
export const HIGH_VALUE_THRESHOLD_CENTS = 500000; // $5,000 - rooms above this use high-value tiers

/**
 * Entry tiers for prize rooms.
 * Each $1 spent = 1 entry (chance to win).
 * "entries" represents the number of chances in the draw.
 */
export const ENTRY_TIERS = {
  HIGH_VALUE: [
    { cents: 2500, label: '$25', entries: 25 },
    { cents: 5000, label: '$50', entries: 50 },
    { cents: 10000, label: '$100', entries: 100 },
    { cents: 20000, label: '$200', entries: 200 },
  ],
  LOW_VALUE: [
    { cents: 200, label: '$2', entries: 2 },
    { cents: 500, label: '$5', entries: 5 },
    { cents: 1000, label: '$10', entries: 10 },
    { cents: 2000, label: '$20', entries: 20 },
  ],
} as const;

export const FUNDING_MULTIPLIER = 2.5; // Funding target = retail_value × 2.5

/**
 * Loser Credit Pool: 10% of product value is distributed as Stash Credits
 * to non-winners, pro-rata by their spend amount.
 */
export const LOSER_POOL_PERCENTAGE = 0.10;

/**
 * When a lot expires unfunded:
 * - 98% cash refund to participants
 * - 2% platform fee retained
 * - No Stash Credits minted
 * 
 * This multiplier is DEPRECATED - use explicit refund logic instead.
 * Kept for backwards compatibility.
 */
export const REFUND_CREDIT_MULTIPLIER = 1.5;

// Re-export economy messaging from centralized location
export { ECONOMY_MESSAGING, formatStashCredits, formatVaultCredits } from '@/constants/messaging';

/**
 * Credit-based entry tiers for purchasing entries with Stash Credits.
 * Conversion rate: 100 Credits = 1 Entry (1 Credit = $0.01, 1 Entry = $1)
 */
export const CREDIT_ENTRY_TIERS = [
  { credits: 200, label: '200 C', entries: 2 },
  { credits: 500, label: '500 C', entries: 5 },
  { credits: 1000, label: '1,000 C', entries: 10 },
  { credits: 2500, label: '2,500 C', entries: 25 },
] as const;

/**
 * Conversion rate for Stash Credits to Entries
 * 100 Credits = 1 Entry
 */
export const VC_TO_ENTRY_RATE = 100;

// Helper to get entry tiers based on product value
export const getEntryTiersForRoom = (productValueCents: number) => {
  return productValueCents > HIGH_VALUE_THRESHOLD_CENTS 
    ? ENTRY_TIERS.HIGH_VALUE 
    : ENTRY_TIERS.LOW_VALUE;
};

// Helper to calculate entries from credits
export const calculateEntriesFromCredits = (credits: number): number => {
  return Math.floor(credits / VC_TO_ENTRY_RATE);
};
