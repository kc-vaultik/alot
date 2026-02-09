/**
 * @fileoverview CollectorsTab Component
 * Displays collector search, filters, and list.
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Search, Users, Loader2 } from 'lucide-react';
import { 
  useSearchCollectors, 
  useCollectorConnections, 
  CollectorCard,
  type CollectorFilter 
} from '@/features/collectors';

interface CollectorsTabProps {
  collectorFilter: CollectorFilter;
  onFilterChange: (filter: CollectorFilter) => void;
}

export const CollectorsTab = memo(({ collectorFilter, onFilterChange }: CollectorsTabProps) => {
  const { 
    searchQuery, 
    setSearchQuery, 
    data: searchResults,
    isLoading: searchLoading,
    debouncedQuery
  } = useSearchCollectors();

  const { 
    collectors, 
    isLoading: collectorsLoading,
    follow,
    unfollow,
    isFollowing,
    isUnfollowing
  } = useCollectorConnections(collectorFilter);

  // Show search results if searching, otherwise show filtered list
  const displayCollectors = debouncedQuery.length >= 2 ? (searchResults || []) : collectors;
  const isLoadingCollectors = debouncedQuery.length >= 2 ? searchLoading : collectorsLoading;

  return (
    <motion.div
      key="collectors-content"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-4"
    >
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search collectors..."
          className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-violet-400/50 transition-colors"
        />
      </div>

      {/* Filter Tabs (only show when not searching) */}
      {debouncedQuery.length < 2 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {(['all', 'following', 'followers', 'mutual'] as CollectorFilter[]).map((filter) => (
            <button
              key={filter}
              onClick={() => onFilterChange(filter)}
              className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                collectorFilter === filter
                  ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                  : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
              }`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
      )}

      {/* Collectors List */}
      <div className="space-y-2">
        {isLoadingCollectors ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
          </div>
        ) : displayCollectors.length > 0 ? (
          displayCollectors.map((collector) => (
            <CollectorCard
              key={collector.user_id}
              collector={collector}
              isFollowing={collector.connection_status === 'FOLLOWING' || collector.connection_status === 'MUTUAL'}
              isMutual={collector.connection_status === 'MUTUAL'}
              onFollow={follow}
              onUnfollow={unfollow}
              isLoading={isFollowing || isUnfollowing}
            />
          ))
        ) : (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/40">
              {debouncedQuery.length >= 2 
                ? 'No collectors found' 
                : collectorFilter === 'all' 
                  ? 'No collectors yet'
                  : `No ${collectorFilter}`
              }
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
});

CollectorsTab.displayName = 'CollectorsTab';
