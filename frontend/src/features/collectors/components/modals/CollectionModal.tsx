/**
 * @fileoverview Full collection view modal
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CollectorCollection } from '../../types';

interface CollectionModalProps {
  collection: CollectorCollection;
  profileName: string;
  onClose: () => void;
}

export const CollectionModal = memo(function CollectionModal({
  collection,
  profileName,
  onClose,
}: CollectionModalProps) {
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
              {profileName}'s Collection
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {collection.cards.map((card) => (
              <div
                key={card.id}
                className="bg-white/5 rounded-xl border border-white/10 overflow-hidden"
              >
                <div className="aspect-square">
                  {card.product.image_url ? (
                    <img
                      src={card.product.image_url}
                      alt={card.product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-white/5 text-white/30">
                      {card.product.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-white/50 text-xs">{card.product.brand}</p>
                  <p className="text-white text-sm font-medium truncate">{card.product.model}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-violet-400 text-xs font-medium">
                      ${card.product.retail_value_usd.toLocaleString()}
                    </span>
                    <span className={cn(
                      'text-xs px-1.5 py-0.5 rounded',
                      card.band === 'MYTHIC' ? 'bg-amber-500/20 text-amber-400' :
                      card.band === 'GRAIL' ? 'bg-violet-500/20 text-violet-400' :
                      card.band === 'RARE' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-white/10 text-white/60'
                    )}>
                      {card.band}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
});
