/**
 * @fileoverview Modal for purchasing room entries (cash or credits)
 */

import { useState, memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Coins, Target, Users, Clock, TrendingUp, Sparkles, CreditCard } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRoomEntryCheckout, useBuyEntriesWithCredits } from '../../hooks';
import { getEntryTiersForRoom, ROOM_TIERS, ECONOMY_MESSAGING, CREDIT_ENTRY_TIERS, VC_TO_ENTRY_RATE } from '../../constants';
import { formatCents, formatTimeRemainingSimple } from '../../utils';
import { useMyCredits } from '@/features/collect-room/hooks';
import type { Room, RoomTier } from '../../types';
import collectRoomPack from '@/assets/collect-room-pack.png';

type PaymentMethod = 'cash' | 'credits';

interface EntryPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room;
  product?: {
    id: string;
    name: string;
    brand: string;
    image_url: string | null;
    retail_value_usd: number;
    category: string;
  } | null;
  currentEntries?: number;
  totalEntries?: number;
}

export const EntryPurchaseModal = memo(function EntryPurchaseModal({ 
  isOpen, 
  onClose,
  room,
  product,
  currentEntries = 0,
  totalEntries = 0,
}: EntryPurchaseModalProps) {
  const { user } = useAuth();
  const { createEntryCheckout, isLoading: isCashLoading } = useRoomEntryCheckout();
  const { mutate: buyWithCredits, isPending: isCreditsLoading } = useBuyEntriesWithCredits();
  const { data: creditsData } = useMyCredits();
  
  const userCredits = creditsData?.universal ?? 0;
  
  const productValueCents = product ? product.retail_value_usd * 100 : (room.tier_cap_cents || 0);
  const entryTiers = getEntryTiersForRoom(productValueCents);
  const tierConfig = ROOM_TIERS[room.tier as RoomTier];
  
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [selectedCashTierIndex, setSelectedCashTierIndex] = useState(0);
  const [selectedCreditTierIndex, setSelectedCreditTierIndex] = useState(0);
  
  const selectedTier = paymentMethod === 'cash' 
    ? entryTiers[selectedCashTierIndex]
    : CREDIT_ENTRY_TIERS[selectedCreditTierIndex];
  
  const isLoading = isCashLoading || isCreditsLoading;
  
  // Show funding progress based on product value
  const fundingProgress = productValueCents > 0 
    ? Math.min((room.escrow_balance_cents / productValueCents) * 100, 100) 
    : 0;
  
  // Calculate estimated odds
  const estimatedOdds = useMemo(() => {
    const newTotalEntries = totalEntries + selectedTier.entries;
    const userNewEntries = currentEntries + selectedTier.entries;
    if (newTotalEntries === 0) return 100;
    return Math.round((userNewEntries / newTotalEntries) * 10000) / 100;
  }, [totalEntries, currentEntries, selectedTier.entries]);
  
  const timeRemaining = formatTimeRemainingSimple(room.deadline_at || room.end_at);

  // Check if user has enough credits for selected tier
  const hasEnoughCredits = paymentMethod === 'credits' 
    ? userCredits >= CREDIT_ENTRY_TIERS[selectedCreditTierIndex].credits
    : true;

  const handlePurchase = async () => {
    if (!user) {
      window.location.href = '/auth?returnTo=/collect-room';
      return;
    }
    
    if (paymentMethod === 'cash') {
      const cashTier = entryTiers[selectedCashTierIndex];
      await createEntryCheckout(room.id, cashTier.cents, cashTier.entries);
    } else {
      const creditTier = CREDIT_ENTRY_TIERS[selectedCreditTierIndex];
      buyWithCredits(
        { roomId: room.id, creditsToSpend: creditTier.credits },
        { onSuccess: () => onClose() }
      );
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-md bg-zinc-950 rounded-2xl border-4 border-white shadow-sticker overflow-hidden max-h-[90vh] overflow-y-auto transform rotate-[0.5deg]"
            onClick={e => e.stopPropagation()}
          >
            {/* Header with product */}
            <div className="relative">
              {/* Product image background */}
              <div className="h-36 bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center relative overflow-hidden">
                {room.is_mystery && !product ? (
                  <div className="relative h-full p-3">
                    <img 
                      src={collectRoomPack} 
                      alt="Mystery Pack"
                      className="h-full object-contain drop-shadow-2xl"
                    />
                    <Sparkles className="absolute top-2 right-2 w-6 h-6 text-violet-400 animate-pulse" />
                  </div>
                ) : product?.image_url ? (
                  <img 
                    src={product.image_url} 
                    alt={product.name}
                    className="h-28 object-contain"
                  />
                ) : (
                  <Coins className="w-12 h-12 text-white/20" />
                )}
                
                {/* Tier badge */}
                <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-full bg-gradient-to-r ${tierConfig.color} text-black text-xs font-bold font-display border-2 border-white shadow-sticker transform -rotate-2`}>
                  {tierConfig.name}
                </div>
              </div>
              
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
              >
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>

            <div className="px-5 py-4 pb-24">
              {/* Room info */}
              <h2 className="text-xl font-semibold text-white mb-1">
                {room.is_mystery && !product ? 'Mystery Prize' : product?.name || `${tierConfig.name} Prize`}
              </h2>
              {product && (
                <p className="text-xs text-white/50 mb-4">{product.brand} • Worth {formatCents(productValueCents)}</p>
              )}
              
              {/* Stats row */}
              <div className="flex gap-3 mb-5">
                <div className="flex-1 bg-zinc-900 rounded-xl p-3 border-2 border-white shadow-sticker transform -rotate-1">
                  <div className="flex items-center gap-1.5 text-white/50 text-xs mb-1">
                    <Target className="w-3.5 h-3.5" />
                    <span className="uppercase tracking-wide">Funding</span>
                  </div>
                  <p className="text-white font-display text-lg">{Math.round(fundingProgress)}%</p>
                </div>
                <div className="flex-1 bg-zinc-900 rounded-xl p-3 border-2 border-white shadow-sticker transform rotate-[0.5deg]">
                  <div className="flex items-center gap-1.5 text-white/50 text-xs mb-1">
                    <Users className="w-3.5 h-3.5" />
                    <span className="uppercase tracking-wide">Players</span>
                  </div>
                  <p className="text-white font-display text-lg">{room.participant_count || 0}</p>
                </div>
                <div className="flex-1 bg-zinc-900 rounded-xl p-3 border-2 border-white shadow-sticker transform rotate-1">
                  <div className="flex items-center gap-1.5 text-white/50 text-xs mb-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="uppercase tracking-wide">Time</span>
                  </div>
                  <p className="text-white font-display text-base">{timeRemaining}</p>
                </div>
              </div>

              {/* Payment Method Tabs */}
              <div className="flex gap-2 mb-5 p-1.5 bg-zinc-900 rounded-2xl border-2 border-white/20">
                <button
                  onClick={() => setPaymentMethod('cash')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm transition-all ${
                    paymentMethod === 'cash'
                      ? 'gradient-hype text-white border-2 border-white shadow-sticker font-display'
                      : 'text-white/50 hover:text-white/70 font-medium'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  PAY WITH CASH
                </button>
                <button
                  onClick={() => setPaymentMethod('credits')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm transition-all ${
                    paymentMethod === 'credits'
                      ? 'gradient-volt text-black border-2 border-white shadow-sticker font-display'
                      : 'text-white/50 hover:text-white/70 font-medium'
                  }`}
                >
                  <Coins className="w-4 h-4" />
                  USE STASH CREDITS
                </button>
              </div>

              {/* Credits Balance (shown when credits tab active) */}
              {paymentMethod === 'credits' && (
                <div className="flex items-center justify-between bg-hype-green/10 border-2 border-hype-green/40 rounded-xl p-3 mb-4 shadow-sticker transform -rotate-[0.5deg]">
                  <div className="flex items-center gap-2">
                    <Coins className="w-5 h-5 text-hype-green" />
                    <span className="text-white/70 text-sm font-medium uppercase tracking-wide">Your Stash</span>
                  </div>
                  <span className="text-hype-green font-display text-lg">{userCredits.toLocaleString()} C</span>
                </div>
              )}

              {/* Entry tier selection */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-white/40 text-xs uppercase tracking-wider">
                    Select Entry Amount
                  </label>
                  {paymentMethod === 'credits' && (
                    <span className="text-white/30 text-xs">{VC_TO_ENTRY_RATE} VC = 1 Entry</span>
                  )}
                </div>
                
                {paymentMethod === 'cash' ? (
                  <div className="grid grid-cols-2 gap-3">
                    {entryTiers.map((tier, idx) => {
                      const isSelected = selectedCashTierIndex === idx;
                      const tiltClass = idx % 2 === 0 ? '-rotate-1' : 'rotate-1';
                      return (
                        <button
                          key={tier.cents}
                          onClick={() => setSelectedCashTierIndex(idx)}
                          className={`relative p-4 rounded-xl transition-all text-left transform ${tiltClass} ${
                            isSelected
                              ? 'gradient-hype border-4 border-white shadow-sticker' 
                              : 'bg-zinc-900 border-2 border-white/20 hover:border-white/40'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-xl font-display ${isSelected ? 'text-white' : 'text-white'}`}>
                              {tier.label}
                            </span>
                            {isSelected && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-6 h-6 rounded-full bg-white flex items-center justify-center border-2 border-hype-pink"
                              >
                                <span className="text-hype-pink text-sm font-bold">✓</span>
                              </motion.div>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-white/70 text-sm font-medium">
                            <Coins className="w-3.5 h-3.5" />
                            <span>{tier.entries} {tier.entries === 1 ? ECONOMY_MESSAGING.ENTRIES.singular.toLowerCase() : ECONOMY_MESSAGING.ENTRIES.plural.toLowerCase()}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {CREDIT_ENTRY_TIERS.map((tier, idx) => {
                      const isSelected = selectedCreditTierIndex === idx;
                      const canAfford = userCredits >= tier.credits;
                      const tiltClass = idx % 2 === 0 ? '-rotate-1' : 'rotate-1';
                      return (
                        <button
                          key={tier.credits}
                          onClick={() => setSelectedCreditTierIndex(idx)}
                          disabled={!canAfford}
                          className={`relative p-4 rounded-xl transition-all text-left transform ${tiltClass} ${
                            isSelected
                              ? 'gradient-volt border-4 border-white shadow-sticker' 
                              : canAfford
                                ? 'bg-zinc-900 border-2 border-white/20 hover:border-white/40'
                                : 'bg-zinc-900/50 border-2 border-white/10 opacity-50 cursor-not-allowed'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-xl font-display ${isSelected ? 'text-black' : canAfford ? 'text-white' : 'text-white/30'}`}>
                              {tier.label}
                            </span>
                            {isSelected && canAfford && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-6 h-6 rounded-full bg-white flex items-center justify-center border-2 border-hype-green"
                              >
                                <span className="text-hype-green text-sm font-bold">✓</span>
                              </motion.div>
                            )}
                          </div>
                          <div className={`flex items-center gap-1.5 text-sm font-medium ${isSelected ? 'text-black/70' : 'text-white/70'}`}>
                            <Coins className="w-3.5 h-3.5" />
                            <span>{tier.entries} {ECONOMY_MESSAGING.ENTRIES.plural.toLowerCase()}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Not enough credits message */}
              {paymentMethod === 'credits' && !hasEnoughCredits && (
                <button
                  onClick={() => setPaymentMethod('cash')}
                  className="w-full text-center text-sm text-cyan-400 hover:text-cyan-300 mb-4 transition-colors"
                >
                  Not enough credits? Buy entries with cash →
                </button>
              )}

              {/* Odds preview */}
              <div className={`rounded-2xl p-4 border-4 border-white shadow-sticker mb-5 transform rotate-[0.5deg] ${paymentMethod === 'cash' ? 'bg-gradient-to-br from-hype-blue/20 to-hype-pink/20' : 'bg-gradient-to-br from-hype-green/20 to-hype-green/10'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className={`w-5 h-5 ${paymentMethod === 'cash' ? 'text-hype-pink' : 'text-hype-green'}`} />
                  <span className="text-white/80 text-sm font-medium uppercase tracking-wide">Your Odds</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-display text-white">{estimatedOdds}%</span>
                  <span className="text-white/50 text-sm font-medium">chance to win</span>
                </div>
                {currentEntries > 0 && (
                  <p className={`${paymentMethod === 'cash' ? 'text-hype-pink/80' : 'text-hype-green/80'} text-xs mt-2 font-medium`}>
                    You already have {currentEntries} {currentEntries === 1 ? ECONOMY_MESSAGING.ENTRIES.singular.toLowerCase() : ECONOMY_MESSAGING.ENTRIES.plural.toLowerCase()} • Adding {selectedTier.entries} more
                  </p>
                )}
              </div>

              {/* How it works */}
              <div className="bg-zinc-900 rounded-2xl p-4 border-2 border-white/30 mb-5 transform -rotate-[0.5deg]">
                <p className="text-white font-display text-sm mb-3 uppercase">
                  How Lots Work
                </p>
                <ul className="text-white/70 text-xs space-y-2 font-medium">
                  <li className="flex items-start gap-2">
                    <span className={`font-display text-sm ${paymentMethod === 'cash' ? 'text-hype-pink' : 'text-hype-green'}`}>1</span>
                    <span>Buy entries to increase your win chance ({paymentMethod === 'cash' ? ECONOMY_MESSAGING.ENTRIES.perDollar : `${VC_TO_ENTRY_RATE} Credits = 1 entry`})</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className={`font-display text-sm ${paymentMethod === 'cash' ? 'text-hype-pink' : 'text-hype-green'}`}>2</span>
                    <span>When fully funded, a random winner is drawn</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className={`font-display text-sm ${paymentMethod === 'cash' ? 'text-hype-pink' : 'text-hype-green'}`}>3</span>
                    <span>{ECONOMY_MESSAGING.WINNER.message.split('.')[0]} • {ECONOMY_MESSAGING.LOSER.message}</span>
                  </li>
                </ul>
              </div>

              {/* Purchase button */}
              <button
                onClick={handlePurchase}
                disabled={isLoading || (paymentMethod === 'credits' && !hasEnoughCredits)}
                className={`w-full py-4 rounded-xl text-lg transition-all transform -rotate-1 ${
                  isLoading || (paymentMethod === 'credits' && !hasEnoughCredits)
                    ? 'bg-zinc-800 text-white/30 cursor-not-allowed border-2 border-white/20'
                    : paymentMethod === 'cash'
                    ? 'gradient-hype text-white border-4 border-white shadow-sticker font-display hover:scale-[1.02]'
                    : 'gradient-volt text-black border-4 border-white shadow-sticker font-display hover:scale-[1.02]'
                }`}
              >
                {isLoading 
                  ? (paymentMethod === 'cash' ? 'REDIRECTING...' : 'PROCESSING...')
                  : !user 
                    ? 'SIGN IN TO ENTER'
                    : paymentMethod === 'cash'
                      ? `GET ${selectedTier.entries} ${ECONOMY_MESSAGING.ENTRIES.plural.toUpperCase()} • ${(selectedTier as typeof entryTiers[number]).label}`
                      : `SPEND ${(selectedTier as typeof CREDIT_ENTRY_TIERS[number]).credits.toLocaleString()} C FOR ${selectedTier.entries} ENTRIES`
                }
              </button>

              {!user && (
                <p className="text-center text-white/50 text-xs mt-3 font-medium">
                  You'll be redirected to sign in
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});