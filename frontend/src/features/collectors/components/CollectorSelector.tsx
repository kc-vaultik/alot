/**
 * @fileoverview Component for selecting a collector from connections
 */

import { memo, useState, useCallback } from 'react';
import { Search, Users, Check, X } from 'lucide-react';
import { useCollectorConnections } from '../hooks/mutations';
import { CollectorScoreBadge } from './CollectorScoreBadge';
import type { CollectorListItem } from '../types';

interface CollectorSelectorProps {
  onSelect: (collector: CollectorListItem | null) => void;
  selectedCollector: CollectorListItem | null;
}

export const CollectorSelector = memo(({ onSelect, selectedCollector }: CollectorSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  
  const { collectors, isLoading } = useCollectorConnections('mutual');

  const filteredCollectors = collectors.filter(c => 
    c.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.display_name?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSelect = useCallback((collector: CollectorListItem) => {
    onSelect(collector);
    setIsOpen(false);
    setSearchQuery('');
  }, [onSelect]);

  const handleClear = useCallback(() => {
    onSelect(null);
  }, [onSelect]);

  if (selectedCollector) {
    return (
      <div className="bg-white/5 rounded-xl p-3 border border-white/5 flex items-center justify-between backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-600/20 flex items-center justify-center border border-white/10">
            {selectedCollector.avatar_url ? (
              <img src={selectedCollector.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-white/80 font-light text-sm">
                {selectedCollector.username.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <p className="text-white text-sm font-light">{selectedCollector.display_name || selectedCollector.username}</p>
            <p className="text-white/50 text-xs font-light">@{selectedCollector.username}</p>
          </div>
          <CollectorScoreBadge score={selectedCollector.score || 0} size="sm" />
        </div>
        <button
          onClick={handleClear}
          className="p-2 text-white/40 hover:text-white/70 transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white/5 rounded-xl p-3 border border-white/5 flex items-center gap-3 hover:bg-white/10 hover:border-white/10 transition-all text-left backdrop-blur-sm"
      >
        <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
          <Users className="w-5 h-5 text-white/50" />
        </div>
        <div className="flex-1">
          <p className="text-white/60 text-sm font-light">Send to a specific collector</p>
          <p className="text-white/40 text-xs font-light">Or share a public link</p>
        </div>
      </button>

      {isOpen && (
        <div className="bg-zinc-950 rounded-xl border border-white/10 overflow-hidden">
          {/* Search input */}
          <div className="p-3 border-b border-white/5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search connections..."
                className="w-full bg-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white font-light placeholder:text-white/30 border border-white/5 focus:border-violet-500/50 focus:outline-none transition-all"
                autoFocus
              />
            </div>
          </div>

          {/* Collectors list */}
          <div className="max-h-48 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-white/40 text-sm font-light">Loading...</div>
            ) : filteredCollectors.length === 0 ? (
              <div className="p-4 text-center text-white/40 text-sm font-light">
                {collectors.length === 0 
                  ? "No mutual connections yet" 
                  : "No collectors found"
                }
              </div>
            ) : (
              filteredCollectors.map((collector) => (
                <button
                  key={collector.user_id}
                  onClick={() => handleSelect(collector)}
                  className="w-full p-3 flex items-center gap-3 hover:bg-white/5 transition-all text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-600/20 flex items-center justify-center border border-white/10">
                    {collector.avatar_url ? (
                      <img src={collector.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-white/80 font-light text-xs">
                        {collector.username.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-light truncate">{collector.display_name || collector.username}</p>
                    <p className="text-white/40 text-xs font-light">@{collector.username}</p>
                  </div>
                  <CollectorScoreBadge score={collector.score || 0} size="sm" />
                </button>
              ))
            )}
          </div>

          {/* Skip option */}
          <button
            onClick={() => setIsOpen(false)}
            className="w-full p-3 border-t border-white/5 text-white/50 text-sm font-light hover:bg-white/5 transition-all"
          >
            Skip - generate public link instead
          </button>
        </div>
      )}
    </div>
  );
});

CollectorSelector.displayName = 'CollectorSelector';
