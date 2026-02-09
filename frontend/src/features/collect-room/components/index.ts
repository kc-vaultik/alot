/**
 * @fileoverview Barrel export for Collect Room components.
 * 
 * INTERNAL USE ONLY - Components here are for use within the collect-room feature.
 * External features should import from the main feature barrel (features/collect-room/index.ts).
 */

// ============= Layout =============
export { 
  CollectRoomHeader, 
  CollectRoomBackground, 
  BottomNavigation,
} from './layout';
export type { NavTab } from './layout';

// ============= Views =============
export { HomeView, SealedPack } from './views';

// ============= Hub =============
export { 
  TradeHubView, 
  BattlesHubView, 
  MarketplaceTab, 
  CollectorsTab,
} from './hub';

// ============= Vault =============
export {
  VaultHeader,
  VaultTabs,
  RedemptionProgress,
  CollectionView,
  VaultView,
  MyCardsGrid,
  CardRoomStats,
  ProfileBox,
  CollectionValueBox,
  CardDetailModal,
  CardSkeleton,
  CardGridSkeleton,
  ProgressSkeleton,
  RedemptionSkeleton,
  HeaderSkeleton,
  TabsSkeleton,
  VaultSkeleton,
  BattleSkeleton,
} from './vault';
export type { TabType } from './vault';

// ============= Unboxing =============
export { 
  SealedPack as SealedPackCard,
  CardEmerge, 
  CardReveal, 
  GoldenReveal,
} from './unboxing';

// ============= Purchase =============
export { 
  PurchaseModal, 
  GiftSwapModal, 
  BuyProgressModal,
} from './purchase';

// ============= Category Packs =============
export { 
  CategoryPackCard, 
  CategoryPacksGrid, 
  CategoryPurchaseModal,
} from './category-packs';

// ============= Claim =============
export { ClaimPage } from './claim';

// ============= Shared UI =============
export { 
  GradientBox, 
  GradientButton, 
  SectionTitle,
} from './shared';

// ============= Common Components =============
export { OpeningOverlay } from './OpeningOverlay';
export { LoadingScreen } from './LoadingScreen';
export { NotificationCenter } from './NotificationCenter';
