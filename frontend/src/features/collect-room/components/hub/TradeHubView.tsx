/**
 * @fileoverview TradeHubView Component
 * Hub view for Marketplace and Collectors with sub-navigation.
 * Previously named BattlesHubView - renamed to match "Play & Trade" header.
 */

import { memo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Store, Users, ChevronRight } from 'lucide-react';
import { CollectCard } from '@/features/collect-room/types';
import { useCollectorConnections, type CollectorFilter } from '@/features/collectors';
import { MarketplaceTab } from './MarketplaceTab';
import { CollectorsTab } from './CollectorsTab';
import { CollectRoomHeader } from '../layout/CollectRoomHeader';

type SubTab = 'marketplace' | 'collectors';

export const TradeHubView = memo(() => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('marketplace');
  const [selectedCard, setSelectedCard] = useState<CollectCard | null>(null);
  const [collectorFilter, setCollectorFilter] = useState<CollectorFilter>('all');

  // Get mutual count for display
  const { collectors } = useCollectorConnections('all');
  const mutualCount = collectors.filter(c => c.connection_status === 'MUTUAL').length;

  const handleCardSelect = useCallback((card: CollectCard) => {
    setSelectedCard(card);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full flex flex-col"
    >
      <CollectRoomHeader />

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pb-32 pt-6">
        {/* Navigation Boxes */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 mb-4 sm:mb-6">
          {/* Marketplace Box - Sticker Style */}
          <button
            onClick={() => setActiveSubTab('marketplace')}
            className={`w-full rounded-2xl p-4 transition-all transform -rotate-1 ${
              activeSubTab === 'marketplace' 
                ? 'bg-gradient-to-br from-cyan-500/20 via-violet-500/15 to-purple-600/20 border-4 border-white shadow-sticker' 
                : 'bg-zinc-900/90 hover:bg-zinc-800/90 border-4 border-white/30 hover:border-white shadow-sticker'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-hype flex items-center justify-center flex-shrink-0 border-2 border-white">
                <Store className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <div className="text-left min-w-0">
                <p className="font-display text-white text-base">MARKETPLACE</p>
                <p className="text-white/50 text-xs">Trade Cards</p>
              </div>
            </div>
          </button>

          {/* Collectors Sub-tab button - Sticker Style */}
          <button
            onClick={() => setActiveSubTab('collectors')}
            className={`w-full mt-3 rounded-2xl p-4 transition-all transform rotate-1 ${
              activeSubTab === 'collectors'
                ? 'bg-gradient-to-br from-cyan-500/20 via-violet-500/15 to-purple-600/20 border-4 border-white shadow-sticker'
                : 'bg-zinc-900/90 hover:bg-zinc-800/90 border-4 border-white/30 hover:border-white shadow-sticker'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0 border-2 border-white">
                  <Users className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
                <div className="text-left">
                  <p className="font-display text-white text-base">COLLECTORS</p>
                  <p className="text-white/50 text-xs">{mutualCount} friends</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-white/50" strokeWidth={2.5} />
            </div>
          </button>
        </div>

        {/* Content Area */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <AnimatePresence mode="wait">
            {activeSubTab === 'marketplace' && (
              <MarketplaceTab
                selectedCard={selectedCard}
                onCardSelect={handleCardSelect}
                onCloseModal={() => setSelectedCard(null)}
              />
            )}

            {activeSubTab === 'collectors' && (
              <CollectorsTab
                collectorFilter={collectorFilter}
                onFilterChange={setCollectorFilter}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
});

TradeHubView.displayName = 'TradeHubView';

// Backward compatibility export
export const BattlesHubView = TradeHubView;
