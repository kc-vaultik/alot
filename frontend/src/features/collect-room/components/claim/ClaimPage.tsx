import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gift, ArrowLeftRight, ArrowLeft, Loader2, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useClaimTransfer } from '../../hooks/actions';
import { useMyReveals } from '../../hooks/data';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { getRarityTier } from '@/utils/styling';
import type { CollectCard } from '../../types';

function getBandFromScore(score: number): string {
  const tier = getRarityTier(score);
  return tier.toUpperCase();
}

export function ClaimPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { transfer, loading, error, claiming, isOwnTransfer, claimGift, claimSwap } = useClaimTransfer(token);
  const { data: myReveals } = useMyReveals();
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [showCardSelector, setShowCardSelector] = useState(false);

  // Handle auth redirect
  const handleAuthRedirect = () => {
    // Store the claim URL to return to after auth
    localStorage.setItem('auth_redirect_to', location.pathname);
    navigate('/auth');
  };

  const handleClaimGift = async () => {
    const result = await claimGift();
    if (result.success) {
      navigate('/collect-room', { state: { tab: 'vault' } });
    }
  };

  const handleStartSwap = () => {
    setShowCardSelector(true);
  };

  const handleConfirmSwap = async () => {
    if (!selectedCardId) return;
    const result = await claimSwap(selectedCardId);
    if (result.success) {
      navigate('/collect-room', { state: { tab: 'vault' } });
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-violet-400 mx-auto" />
          <p className="text-zinc-400">Loading transfer details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !transfer) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 text-center space-y-6"
        >
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-semibold text-white">Invalid Link</h1>
            <p className="text-zinc-400">{error || 'This claim link is not valid'}</p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/collect-room')}
            className="border-zinc-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Collect Room
          </Button>
        </motion.div>
      </div>
    );
  }

  // Own transfer warning
  if (isOwnTransfer) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 text-center space-y-6"
        >
          <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-amber-400" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-semibold text-white">This is Your Card</h1>
            <p className="text-zinc-400">You can't claim your own card. Share this link with a friend!</p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/collect-room')}
            className="border-zinc-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Collect Room
          </Button>
        </motion.div>
      </div>
    );
  }

  const isGift = transfer.transfer_type === 'gift';
  const Icon = isGift ? Gift : ArrowLeftRight;
  const expiresAt = new Date(transfer.expires_at);
  const timeLeft = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60)));

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg w-full space-y-6"
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <div className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center mx-auto",
            isGift ? "bg-emerald-500/10" : "bg-violet-500/10"
          )}>
            <Icon className={cn(
              "w-8 h-8",
              isGift ? "text-emerald-400" : "text-violet-400"
            )} />
          </div>
          <h1 className="text-2xl font-semibold text-white">
            {isGift ? "You've Received a Gift!" : "Swap Offer"}
          </h1>
          <p className="text-zinc-400">
            {isGift 
              ? "Someone wants to gift you this collectible card"
              : "Someone wants to swap cards with you"
            }
          </p>
        </div>

        {/* Card Preview */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-start gap-4">
            {transfer.card.product_image ? (
              <img
                src={transfer.card.product_image}
                alt={transfer.card.product_name}
                className="w-24 h-24 object-contain rounded-lg bg-zinc-800"
              />
            ) : (
              <div className="w-24 h-24 rounded-lg bg-zinc-800 flex items-center justify-center">
                <span className="text-zinc-600 text-xs">No Image</span>
              </div>
            )}
            <div className="flex-1 space-y-1">
              <p className="text-sm text-zinc-500">{transfer.card.product_brand}</p>
              <h3 className="text-lg font-medium text-white">{transfer.card.product_name}</h3>
              <div className="flex items-center gap-2 mt-2">
                <span className={cn(
                  "px-2 py-0.5 rounded text-xs font-medium",
                  transfer.card.band === 'MYTHIC' && "bg-amber-500/20 text-amber-400",
                  transfer.card.band === 'GRAIL' && "bg-purple-500/20 text-purple-400",
                  transfer.card.band === 'RARE' && "bg-blue-500/20 text-blue-400",
                  transfer.card.band === 'ICON' && "bg-zinc-500/20 text-zinc-400"
                )}>
                  {transfer.card.band}
                </span>
                <span className="text-xs text-zinc-500">#{transfer.card.serial_number}</span>
              </div>
              <p className="text-sm text-emerald-400 mt-2">
                ${transfer.card.retail_value_usd.toLocaleString()} value
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-800">
            <p className="text-xs text-zinc-500">
              Expires in {timeLeft} hour{timeLeft !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Swap Card Selector */}
        {!isGift && showCardSelector && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-4"
          >
            <h3 className="text-sm font-medium text-white">Select a card to swap</h3>
            <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
              {myReveals?.map((card: CollectCard) => {
                const band = getBandFromScore(card.rarity_score);
                return (
                  <button
                    key={card.card_id}
                    onClick={() => setSelectedCardId(card.card_id)}
                    className={cn(
                      "p-3 rounded-lg border transition-all text-left",
                      selectedCardId === card.card_id
                        ? "border-violet-500 bg-violet-500/10"
                        : "border-zinc-700 hover:border-zinc-600"
                    )}
                  >
                    <p className="text-xs text-zinc-400 truncate">
                      {card.brand}
                    </p>
                    <p className="text-sm text-white truncate">
                      {card.product_reveal}
                    </p>
                    <span className={cn(
                      "text-xs px-1.5 py-0.5 rounded mt-1 inline-block",
                      band === 'MYTHIC' && "bg-amber-500/20 text-amber-400",
                      band === 'GRAIL' && "bg-purple-500/20 text-purple-400",
                      band === 'RARE' && "bg-blue-500/20 text-blue-400",
                      band === 'ICON' && "bg-zinc-500/20 text-zinc-400"
                    )}>
                      {band}
                    </span>
                  </button>
                );
              })}
            </div>
            {(!myReveals || myReveals.length === 0) && (
              <p className="text-sm text-zinc-500 text-center py-4">
                You don't have any cards to swap
              </p>
            )}
          </motion.div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          {!isAuthenticated ? (
            <Button
              onClick={handleAuthRedirect}
              className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500"
            >
              Sign in to Claim
            </Button>
          ) : isGift ? (
            <Button
              onClick={handleClaimGift}
              disabled={claiming}
              className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500"
            >
              {claiming ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Claiming...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Claim Gift
                </>
              )}
            </Button>
          ) : !showCardSelector ? (
            <Button
              onClick={handleStartSwap}
              className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500"
            >
              <ArrowLeftRight className="w-4 h-4 mr-2" />
              Select Card to Swap
            </Button>
          ) : (
            <Button
              onClick={handleConfirmSwap}
              disabled={claiming || !selectedCardId}
              className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500"
            >
              {claiming ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing Swap...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Confirm Swap
                </>
              )}
            </Button>
          )}

          <Button
            variant="ghost"
            onClick={() => navigate('/collect-room')}
            className="w-full text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Collect Room
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
