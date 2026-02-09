// Admin panel constants

export const ADMIN_ROUTES = {
  DASHBOARD: "/admin",
  DROPS: "/admin/drops",
  DROPS_NEW: "/admin/drops/new",
  INVENTORY: "/admin/inventory",
  PRODUCTS: "/admin/inventory/products",
  ECONOMY: "/admin/economy",
  USERS: "/admin/users",
  SUPPORT: "/admin/support",
  SETTINGS: "/admin/settings",
  // Legacy aliases for backward compatibility
  ROOMS: "/admin/drops",
  ROOMS_NEW: "/admin/drops/new",
} as const;

export const ADMIN_NAV_ITEMS = [
  {
    label: "Dashboard",
    href: ADMIN_ROUTES.DASHBOARD,
    icon: "LayoutDashboard",
  },
  {
    label: "Drops",
    href: ADMIN_ROUTES.DROPS,
    icon: "Sparkles",
  },
  {
    label: "Inventory",
    href: ADMIN_ROUTES.INVENTORY,
    icon: "Package",
  },
  {
    label: "Economy",
    href: ADMIN_ROUTES.ECONOMY,
    icon: "TrendingUp",
  },
  {
    label: "Users",
    href: ADMIN_ROUTES.USERS,
    icon: "Users",
  },
  {
    label: "Support",
    href: ADMIN_ROUTES.SUPPORT,
    icon: "HeadphonesIcon",
  },
  {
    label: "Settings",
    href: ADMIN_ROUTES.SETTINGS,
    icon: "Settings",
  },
] as const;

export const ADMIN_QUERY_KEYS = {
  stats: ["admin", "stats"] as const,
  revenue: ["admin", "revenue"] as const,
  drops: ["admin", "drops"] as const,
  products: ["admin", "products"] as const,
  inventory: ["admin", "inventory"] as const,
  users: ["admin", "users"] as const,
  economy: ["admin", "economy"] as const,
  poolBalances: ["admin", "pool-balances"] as const,
  escrowPools: ["admin", "escrow-pools"] as const,
  ledger: ["admin", "ledger"] as const,
  // Legacy alias
  rooms: ["admin", "drops"] as const,
} as const;

export const TIER_OPTIONS = [
  { value: "T5", label: "$5 Tier" },
  { value: "T10", label: "$10 Tier" },
  { value: "T20", label: "$20 Tier" },
] as const;

export const DROP_STATUS_OPTIONS = [
  { value: "OPEN", label: "Open" },
  { value: "LOCKED", label: "Locked" },
  { value: "SETTLED", label: "Settled" },
  { value: "CANCELLED", label: "Cancelled" },
] as const;

// Legacy alias
export const ROOM_STATUS_OPTIONS = DROP_STATUS_OPTIONS;

export const USER_STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
  { value: "banned", label: "Banned" },
] as const;

export const KYC_STATUS_OPTIONS = [
  { value: "pending", label: "Pending Review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
] as const;
