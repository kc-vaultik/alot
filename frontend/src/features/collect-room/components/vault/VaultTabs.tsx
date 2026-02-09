/**
 * @fileoverview Vault Tabs - "Digital Vandalism" Style
 * @description Tab navigation with sticker aesthetic
 */

import { memo } from 'react';
import { Target, Ticket, ArrowLeftRight } from 'lucide-react';

export type TabType = 'my-cards' | 'marketplace' | 'progress' | 'battle';

interface VaultTabsProps {
  activeTab: TabType;
  cardCount: number;
  onTabChange: (tab: TabType) => void;
}

export const VaultTabs = memo(({ activeTab, cardCount, onTabChange }: VaultTabsProps) => {
  const getTabClass = (tab: TabType) => {
    const isActive = activeTab === tab;
    return `px-3 xs:px-4 sm:px-5 py-2 xs:py-2.5 sm:py-3 rounded-xl text-[10px] xs:text-xs sm:text-sm font-bold uppercase tracking-wide transition-all whitespace-nowrap ${
      isActive
        ? 'bg-gradient-to-r from-hype-pink to-hype-blue text-white border-2 border-white shadow-sticker'
        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50 border-2 border-transparent'
    }`;
  };

  const getTabWithIconClass = (tab: TabType) => {
    return `${getTabClass(tab)} flex items-center gap-1 xs:gap-1.5 sm:gap-2`;
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 pt-3 sm:pt-6 pb-3 sm:pb-4">
      {/* Sticker-style tab container */}
      <div className="flex gap-1 xs:gap-1.5 sm:gap-2 p-1.5 bg-card/80 rounded-2xl border-4 border-white shadow-sticker w-full sm:w-fit overflow-x-auto scrollbar-hide transform -rotate-[0.3deg]">
        <button
          onClick={() => onTabChange('my-cards')}
          className={getTabClass('my-cards')}
        >
          <span className="hidden xs:inline">Cards ({cardCount})</span>
          <span className="xs:hidden">{cardCount}</span>
        </button>
        <button
          onClick={() => onTabChange('progress')}
          className={getTabWithIconClass('progress')}
        >
          <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={2.5} />
          <span className="hidden sm:inline">Redeem</span>
        </button>
        <button
          onClick={() => onTabChange('battle')}
          className={getTabWithIconClass('battle')}
        >
          <Ticket className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={2.5} />
          <span className="hidden xs:inline">Lots</span>
        </button>
        <button
          onClick={() => onTabChange('marketplace')}
          className={getTabWithIconClass('marketplace')}
        >
          <ArrowLeftRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={2.5} />
          <span className="hidden sm:inline">Trade</span>
        </button>
      </div>
    </div>
  );
});

VaultTabs.displayName = 'VaultTabs';
