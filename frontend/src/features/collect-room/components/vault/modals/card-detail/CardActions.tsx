/**
 * @fileoverview Card Actions Component
 * Gift, swap, share, and list buttons for card actions
 */

import { memo, useState } from 'react';
import { Gift, Share2, Store, Loader2, ArrowLeftRight, Trophy } from 'lucide-react';
import { useCreatePublicListing } from '@/features/marketplace/hooks/useMarketplaceListings';
import { toast } from 'sonner';
import type { CollectCard } from '@/features/collect-room/types';
import type { MarketplaceListing } from '@/features/marketplace/types';
import type { CardOrListing } from './types';

interface CardActionsProps {
  card: CardOrListing;
  activeTab: string;
  isListing: boolean;
  isOwnListing: boolean;
  onClose: () => void;
  onGift: (card: CollectCard) => void;
  onSwap: (card: CollectCard) => void;
  onShare: (card: CollectCard) => void;
  onRequestSwap?: (card: MarketplaceListing) => void;
}

export const CardActions = memo(({
  card,
  activeTab,
  isListing,
  isOwnListing,
  onClose,
  onGift,
  onShare,
  onRequestSwap,
}: CardActionsProps) => {
  const [listingType, setListingType] = useState<'GIFT' | 'SWAP' | null>(null);
  const createPublicListing = useCreatePublicListing();
  const isStaked = card.card_state === 'staked' || !!card.staked_room_id;

  const handleListPublicly = async (type: 'GIFT' | 'SWAP') => {
    if (!card.card_id) return;
    setListingType(type);
    try {
      await createPublicListing.mutateAsync({
        revealId: card.card_id,
        listingType: type,
      });
      toast.success(`Card listed for ${type.toLowerCase()}!`, {
        description: 'Others can now see it in the Trade tab.',
      });
      onClose();
    } catch (error) {
      // Error handled by mutation
    } finally {
      setListingType(null);
    }
  };

  // Prize section for own cards
  const renderPrize = () => {
    if (!card.rewards?.prize || isListing) return null;
    
    const { prize } = card.rewards;
    return (
      <div className={`rounded-xl p-4 border ${
        prize.redeemable 
          ? 'bg-green-500/10 border-green-400/30' 
          : 'bg-white/5 border-white/10'
      }`}>
        <div className="flex items-center gap-2 mb-2">
          <Trophy className={`w-5 h-5 ${prize.redeemable ? 'text-green-400' : 'text-white/50'}`} />
          <span className={`font-medium ${prize.redeemable ? 'text-green-400' : 'text-white'}`}>
            {prize.name}
          </span>
        </div>
        <p className="text-white/60 text-sm">{prize.description}</p>
        {prize.redeemable && (
          <button className="mt-3 w-full py-2 rounded-lg bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-colors">
            Redeem Prize
          </button>
        )}
      </div>
    );
  };

  // Marketplace swap action
  const renderMarketplaceSwap = () => {
    if (activeTab !== 'marketplace' || !isListing || !('listing_type' in card) || card.listing_type !== 'SWAP' || isOwnListing) {
      return null;
    }
    
    return (
      <div className="rounded-xl p-4 border bg-blue-500/10 border-blue-400/30">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-blue-400" />
            <span className="text-white font-medium">Available for Trade</span>
          </div>
        </div>
        <p className="text-white/50 text-xs mb-3">Convert this card into progress for another product</p>
        {'from_username' in card && card.from_username && (
          <p className="text-white/50 text-sm mb-3">from @{card.from_username}</p>
        )}
        <button 
          onClick={() => onRequestSwap?.(card as MarketplaceListing)}
          className="w-full py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-600 text-white text-sm font-medium hover:from-blue-600 hover:to-cyan-700 transition-all"
        >
          Trade for Progress
        </button>
      </div>
    );
  };

  // Own card actions
  const renderOwnCardActions = () => {
    if (activeTab !== 'my-cards') return null;

    return (
      <div className="space-y-4 pt-2">
        {/* List to Trade - Primary action - Sticker Style */}
        <div className="space-y-2">
          <button
            onClick={() => handleListPublicly('SWAP')}
            disabled={createPublicListing.isPending || isStaked}
            className="w-full flex items-center justify-center gap-2 px-4 py-4 rounded-2xl gradient-hype text-white hover:shadow-lg transition-all font-display text-base border-4 border-white shadow-sticker disabled:opacity-50 transform -rotate-1"
          >
            {listingType === 'SWAP' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Store className="w-5 h-5" strokeWidth={2.5} />
            )}
            LIST TO TRADE
          </button>
          <p className="text-muted-foreground text-[10px] text-center font-medium">Convert this card into progress for another product</p>
        </div>

        {/* Gift & Share - Secondary actions - Sticker Style */}
        <div className="flex gap-3 pt-3 border-t border-border/30">
          <button
            onClick={() => onGift(card as CollectCard)}
            disabled={isStaked}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-hype-pink/20 text-hype-pink border-2 border-white/50 shadow-sticker hover:bg-hype-pink/30 transition-colors font-display text-sm disabled:opacity-50 transform rotate-[0.5deg]"
          >
            <Gift className="w-4 h-4" strokeWidth={2.5} />
            GIFT
          </button>
          <button
            onClick={() => onShare(card as CollectCard)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-card/80 text-foreground/70 border-2 border-white/50 shadow-sticker hover:bg-card transition-colors font-display text-sm transform -rotate-[0.5deg]"
          >
            <Share2 className="w-4 h-4" strokeWidth={2.5} />
            SHARE
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {renderPrize()}
      {renderMarketplaceSwap()}
      {renderOwnCardActions()}
    </>
  );
});

CardActions.displayName = 'CardActions';
