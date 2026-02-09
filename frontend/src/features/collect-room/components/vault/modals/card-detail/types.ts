/**
 * @fileoverview Shared types for CardDetailModal sub-components
 */

import type { CollectCard } from '@/features/collect-room/types';
import type { MarketplaceListing } from '@/features/marketplace/types';
import type { ProductProgress } from '../../types';
import type { TabType } from '../../VaultTabs';

/**
 * Combined card type that can be either a CollectCard or MarketplaceListing
 */
export type CardOrListing = CollectCard | MarketplaceListing;

/**
 * Props for the main CardDetailModal component
 */
export interface CardDetailModalProps {
  card: CardOrListing | null;
  activeTab: TabType;
  productProgress: ProductProgress[];
  isOwnListing?: boolean;
  onClose: () => void;
  onGift: (card: CollectCard) => void;
  onSwap: (card: CollectCard) => void;
  onShare: (card: CollectCard) => void;
  onUnboxMore: () => void;
  onBuyProgress: (product: ProductProgress) => void;
  onClaimGift?: (card: MarketplaceListing) => void;
  onRequestSwap?: (card: MarketplaceListing) => void;
  onStakeInRoom?: (card: CollectCard) => void;
  onBoostClaimPower?: (card: CollectCard) => void;
}

/**
 * Type guard to check if card is a marketplace listing
 */
export const isMarketplaceListing = (card: CardOrListing): card is MarketplaceListing => {
  return 'listing_type' in card && 'transfer_id' in card;
};

/**
 * Tier color configuration
 */
export interface TierColors {
  bg: string;
  border: string;
  text: string;
}

/**
 * Get tier badge colors based on card tier and golden status
 */
export function getTierColors(tier: string, isGolden?: boolean): TierColors {
  if (isGolden) return { bg: 'bg-amber-500/20', border: 'border-amber-400/30', text: 'text-amber-400' };
  switch (tier) {
    case 'mythic': return { bg: 'bg-amber-500/20', border: 'border-amber-400/30', text: 'text-amber-400' };
    case 'grail': return { bg: 'bg-violet-500/20', border: 'border-violet-400/30', text: 'text-violet-400' };
    case 'rare': return { bg: 'bg-blue-500/20', border: 'border-blue-400/30', text: 'text-blue-400' };
    default: return { bg: 'bg-white/10', border: 'border-white/20', text: 'text-white/70' };
  }
}

/**
 * Embedded perks configuration
 */
export const EMBEDDED_PERKS = [
  { icon: 'Shield', label: 'Authentication Verified', description: 'Product authenticity guaranteed' },
  { icon: 'Gift', label: 'Rewards Enabled', description: 'Earn credits and perks' },
  { icon: 'CheckCircle2', label: 'Insurance Protected', description: 'Coverage during fulfillment' },
  { icon: 'Store', label: 'Trusted Resale Ready', description: 'List on verified marketplaces' },
] as const;
