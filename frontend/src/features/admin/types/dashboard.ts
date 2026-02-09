// Dashboard metric types for admin panel

export interface DashboardStats {
  totalRevenue: number;
  revenueToday: number;
  revenueThisWeek: number;
  revenueThisMonth: number;
  activeRooms: number;
  totalUsers: number;
  newUsersToday: number;
  totalCards: number;
  pendingAwards: number;
}

export interface RevenueDataPoint {
  date: string;
  revenue: number;
  purchases: number;
  roomEntries: number;
}

export interface RoomStatusCounts {
  open: number;
  locked: number;
  settled: number;
  cancelled: number;
}

export interface PoolBalance {
  bucket: string;
  balance_usd: number;
  updated_at: string;
}

export interface TierEscrowBalance {
  tier: string;
  balance_cents: number;
  tier_cap_cents: number;
  updated_at: string;
}

export interface RecentActivity {
  id: string;
  type: 'purchase' | 'reveal' | 'room_entry' | 'award' | 'transfer';
  description: string;
  user_id: string;
  amount?: number;
  created_at: string;
}
