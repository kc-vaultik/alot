/**
 * @fileoverview Alot! Bottom Navigation Component
 * @description Thick, floating bottom nav with chunky icons
 * Design: "Digital Vandalism" - maximalist icons, sticker aesthetic
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Flame, Layers, Vault } from 'lucide-react';
import { useHapticFeedback } from '@/features/collect-room/hooks/ui/useHapticFeedback';

export type NavTab = 'battles' | 'collect' | 'vault';

interface BottomNavigationProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

interface NavItemProps {
  tab: NavTab;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const NavItem = memo(function NavItem({ icon, label, isActive, onClick }: NavItemProps) {
  const { triggerHaptic } = useHapticFeedback();

  const handleClick = () => {
    triggerHaptic('medium');
    onClick();
  };

  if (isActive) {
    return (
      <motion.div 
        className="relative"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      >
        {/* Active glow effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-hype-pink to-hype-blue blur-md opacity-50" />
        
        <button
          type="button"
          className="relative w-20 h-16 flex flex-col items-center justify-center gap-1 rounded-2xl
            bg-gradient-to-r from-hype-pink to-hype-blue
            border-2 border-white shadow-sticker
            text-white transition-all"
          aria-current="page"
        >
          <div className="w-7 h-7 flex items-center justify-center">
            {icon}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wide">{label}</span>
        </button>
      </motion.div>
    );
  }

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      className="w-16 h-14 flex flex-col items-center justify-center gap-1 rounded-2xl
        text-muted-foreground hover:text-foreground 
        hover:bg-secondary/50 transition-all"
      aria-label={label}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className="w-6 h-6 flex items-center justify-center">
        {icon}
      </div>
      <span className="text-[9px] font-semibold uppercase tracking-wide opacity-60">{label}</span>
    </motion.button>
  );
});

export const BottomNavigation = memo(function BottomNavigation({ 
  activeTab, 
  onTabChange 
}: BottomNavigationProps) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 safe-bottom">
      {/* Floating bar with thick styling */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 p-2.5 rounded-3xl
          bg-card/95 backdrop-blur-xl
          border-2 border-border
          shadow-xl shadow-black/40"
      >
        {/* Home / The Lots */}
        <NavItem
          tab="collect"
          icon={<Layers className="w-full h-full" strokeWidth={2.5} />}
          label="Lots"
          isActive={activeTab === 'collect'}
          onClick={() => onTabChange('collect')}
        />

        {/* Live / The Drop Zone */}
        <NavItem
          tab="battles"
          icon={<Flame className="w-full h-full" strokeWidth={2.5} />}
          label="Live"
          isActive={activeTab === 'battles'}
          onClick={() => onTabChange('battles')}
        />

        {/* My Stash / Profile */}
        <NavItem
          tab="vault"
          icon={<Vault className="w-full h-full" strokeWidth={2.5} />}
          label="Stash"
          isActive={activeTab === 'vault'}
          onClick={() => onTabChange('vault')}
        />
      </motion.div>
    </div>
  );
});

BottomNavigation.displayName = 'BottomNavigation';