/**
 * @fileoverview Card selection modal for gift/swap transfers
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { CollectCard } from '@/features/collect-room/types';

interface CardSelectionModalProps {
  mode: 'gift' | 'swap';
  recipientName: string;
  cards: CollectCard[];
  onSelectCard: (card: CollectCard) => void;
  onClose: () => void;
}

export const CardSelectionModal = memo(function CardSelectionModal({
  mode,
  recipientName,
  cards,
  onSelectCard,
  onClose,
}: CardSelectionModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="min-h-screen p-4 pb-20"
        onClick={e => e.stopPropagation()}
      >
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white font-semibold text-xl">
              Select a card to {mode === 'gift' ? 'gift' : 'swap'} with {recipientName}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
          
          {cards.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {cards.map((card) => (
                <button
                  key={card.card_id}
                  onClick={() => onSelectCard(card)}
                  className="bg-white/5 rounded-xl border border-white/10 overflow-hidden hover:border-violet-500/50 transition-colors text-left"
                >
                  <div className="aspect-square">
                    {card.product_image ? (
                      <img
                        src={card.product_image}
                        alt={card.model}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-white/5 text-white/30">
                        {card.model.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-white/50 text-xs">{card.brand}</p>
                    <p className="text-white text-sm font-medium truncate">{card.model}</p>
                    <p className="text-violet-400 text-xs font-medium mt-1">
                      ${card.product_value?.toLocaleString()}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-white/60">You don't have any cards to {mode}</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
});
