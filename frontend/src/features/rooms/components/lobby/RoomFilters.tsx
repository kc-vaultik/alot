/**
 * @fileoverview Room lobby filters for prize rooms
 */

import { memo, useState } from 'react';
import { Filter, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ROOM_TIERS } from '../../constants';
import type { RoomTier } from '../../types';

export type FundingFilter = 'all' | 'almost_funded' | 'new' | 'funded';
export type CategoryFilter = string | null;

interface RoomFiltersProps {
  selectedTier: RoomTier | null;
  onTierChange: (tier: RoomTier | null) => void;
  fundingFilter: FundingFilter;
  onFundingFilterChange: (filter: FundingFilter) => void;
  categoryFilter: CategoryFilter;
  onCategoryFilterChange: (category: CategoryFilter) => void;
  categories: string[];
  showMysteryOnly: boolean;
  onMysteryToggle: (show: boolean) => void;
}

const TIERS: RoomTier[] = ['ICON', 'RARE', 'GRAIL', 'MYTHIC'];

const FUNDING_OPTIONS: { value: FundingFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'new', label: 'New (<25%)' },
  { value: 'almost_funded', label: 'Almost Funded (>75%)' },
  { value: 'funded', label: 'Funded' },
];

export const RoomFilters = memo(function RoomFilters({
  selectedTier,
  onTierChange,
  fundingFilter,
  onFundingFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  categories,
  showMysteryOnly,
  onMysteryToggle,
}: RoomFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const hasActiveFilters = selectedTier !== null || fundingFilter !== 'all' || categoryFilter !== null || showMysteryOnly;
  
  // Count active filters for badge
  const activeFilterCount = [
    fundingFilter !== 'all',
    showMysteryOnly,
    categoryFilter !== null,
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    onTierChange(null);
    onFundingFilterChange('all');
    onCategoryFilterChange(null);
    onMysteryToggle(false);
  };

  return (
    <div className="space-y-3">
      {/* Tier tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => onTierChange(null)}
          className={`
            px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all
            ${selectedTier === null 
              ? 'bg-gradient-to-r from-cyan-500 via-violet-500 to-purple-500 text-white shadow-lg shadow-violet-500/20' 
              : 'bg-white/5 text-white/50 hover:bg-white/10 border border-white/10'}
          `}
        >
          All Lots
        </button>
        {TIERS.map(tier => {
          const config = ROOM_TIERS[tier];
          const isSelected = selectedTier === tier;
          return (
            <button
              key={tier}
              onClick={() => onTierChange(tier)}
              className={`
                px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2
                ${isSelected 
                  ? `bg-gradient-to-r ${config.color} text-black shadow-lg` 
                  : `bg-white/5 ${config.borderColor} border text-white/70 hover:text-white hover:bg-white/10`}
              `}
            >
              <span>{config.name}</span>
              <span className={`text-xs ${isSelected ? 'opacity-70' : 'opacity-50'}`}>
                {config.cap_display}
              </span>
            </button>
          );
        })}
      </div>

      {/* Collapsible Secondary filters */}
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <button className="flex items-center gap-2 text-white/50 hover:text-white/70 transition-colors py-1">
            <Filter className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">Filters</span>
            {activeFilterCount > 0 && (
              <span className="bg-hype-pink/20 text-hype-pink text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
          <div className="flex flex-wrap gap-2 items-center pt-2">
            {/* Funding progress filter */}
            <div className="flex gap-1">
              {FUNDING_OPTIONS.map(option => (
                <button
                  key={option.value}
                  onClick={() => onFundingFilterChange(option.value)}
                  className={`
                    px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                    ${fundingFilter === option.value
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'bg-white/5 text-white/50 hover:bg-white/10 border border-white/10'}
                  `}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* Mystery toggle */}
            <button
              onClick={() => onMysteryToggle(!showMysteryOnly)}
              className={`
                px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5
                ${showMysteryOnly
                  ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                  : 'bg-white/5 text-white/50 hover:bg-white/10 border border-white/10'}
              `}
            >
              <span>?</span>
              <span>Mystery</span>
            </button>

            {/* Category filter */}
            {categories.length > 0 && (
              <select
                value={categoryFilter || ''}
                onChange={(e) => onCategoryFilterChange(e.target.value || null)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 transition-all cursor-pointer"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            )}

            {/* Clear filters */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="h-7 px-2 text-xs text-white/40 hover:text-white"
              >
                <X className="w-3 h-3 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
});
