/**
 * @fileoverview Modal for selecting a card to stake in a room
 */

import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, TrendingUp, Sparkles, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMyEligibleCards, useJoinRoom } from '../../hooks';
import { ROOM_TIERS } from '../../constants';
import { formatCents } from '../../utils';
import type { Room, EligibleCard, RoomTier } from '../../types';

interface StakeModalProps {
  room: Room;
  onClose: () => void;
}

export const StakeModal = memo(function StakeModal({ room, onClose }: StakeModalProps) {
  const { data, isLoading } = useMyEligibleCards(room.id);
  const joinRoom = useJoinRoom();
  const [selectedCard, setSelectedCard] = useState<EligibleCard | null>(null);
  const tierConfig = ROOM_TIERS[room.tier as RoomTier];

  const handleStake = async () => {
    if (!selectedCard) return;
    
    try {
      await joinRoom.mutateAsync({
        roomId: room.id,
        revealId: selectedCard.reveal_id,
      });
      onClose();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const cards = data?.cards || [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-lg max-h-[80vh] bg-zinc-900 rounded-2xl border border-white/10 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div>
            <h3 className="text-lg font-semibold text-white">Stake a Card</h3>
            <p className="text-sm text-white/50">
              Select a card to compete in the{' '}
              <span className={`bg-gradient-to-r ${tierConfig.color} bg-clip-text text-transparent`}>
                {tierConfig.name}
              </span>{' '}
              Room
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Card Grid */}
        <div className="p-4 overflow-y-auto max-h-[50vh]">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[3/4] bg-white/5 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : cards.length === 0 ? (
            <div className="text-center py-8 text-white/40">
              <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No eligible cards</p>
              <p className="text-xs mt-1">
                You need cards worth ≤ {formatCents(room.tier_cap_cents)}
                {room.category && ` in ${room.category}`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {cards.map((card) => {
                const isSelected = selectedCard?.reveal_id === card.reveal_id;
                const rcPercent = Math.min(
                  100,
                  (card.redeem_credits_cents / (card.product.retail_value_usd * 100)) * 100
                );

                return (
                  <motion.button
                    key={card.reveal_id}
                    onClick={() => setSelectedCard(isSelected ? null : card)}
                    className={`
                      relative p-3 rounded-xl border text-left transition-all
                      ${isSelected
                        ? 'bg-violet-500/20 border-violet-400/50 ring-2 ring-violet-400/30'
                        : 'bg-white/5 border-white/10 hover:border-white/20'
                      }
                    `}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* Selected check */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-violet-500 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}

                    {/* Product image */}
                    <div className="aspect-square rounded-lg bg-white/5 mb-2 overflow-hidden">
                      {card.product.image_url ? (
                        <img
                          src={card.product.image_url}
                          alt={card.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/20">
                          No Image
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="mb-2">
                      <div className="text-xs text-white/40">{card.product.brand}</div>
                      <div className="text-sm font-medium text-white truncate">
                        {card.product.model}
                      </div>
                      <div className="text-xs text-white/50">
                        ${card.product.retail_value_usd.toLocaleString()}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1 text-green-400">
                          <TrendingUp className="w-3 h-3" />
                          <span>RC</span>
                        </div>
                        <span className="text-white/60">{rcPercent.toFixed(1)}%</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1 text-amber-400">
                          <Zap className="w-3 h-3" />
                          <span>PP</span>
                        </div>
                        <span className="text-white/60">{card.priority_points}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-white/40">Score</span>
                        <span className="text-white font-medium">{card.preview_score.toFixed(1)}</span>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-black/20">
          {selectedCard && (
            <div className="mb-3 p-3 rounded-lg bg-violet-500/10 border border-violet-400/20">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">Estimated Score</span>
                <span className="text-violet-400 font-semibold">
                  {selectedCard.preview_score.toFixed(1)}
                </span>
              </div>
              <p className="text-xs text-white/40 mt-1">
                Score may vary based on other participants' cards
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500"
              disabled={!selectedCard || joinRoom.isPending}
              onClick={handleStake}
            >
              {joinRoom.isPending ? 'Staking...' : 'Stake Card'}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
});
