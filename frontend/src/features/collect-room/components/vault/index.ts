// Vault Components - Main barrel export

// Views
export { VaultHeader } from './VaultHeader';
export { VaultTabs, type TabType } from './VaultTabs';
export { RedemptionProgress } from './RedemptionProgress';
export { CollectionView } from './CollectionView';
export { VaultView } from './VaultView';
export { BattlesHubView, TradeHubView } from '../hub/TradeHubView';

// Grid components
export { MyCardsGrid, CardRoomStats } from './grid';

// Stats components  
export { ProfileBox, CollectionValueBox } from './stats';

// Modal components
export { CardDetailModal } from './modals';

// Types and utilities
export { type ProductProgress } from './types';
export { formatDigitalNumber, getExpireDate } from '../../utils/formatters';

// Skeletons
export {
  CardSkeleton,
  CardGridSkeleton,
  ProgressSkeleton,
  RedemptionSkeleton,
  HeaderSkeleton,
  TabsSkeleton,
  VaultSkeleton,
  BattleSkeleton,
} from './VaultSkeleton';

// Re-export from marketplace feature
export { MarketplaceGrid } from '@/features/marketplace';
