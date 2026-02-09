/**
 * @fileoverview Stat display box component for collector profiles
 */

import { memo, type ReactNode } from 'react';

export interface StatBoxProps {
  icon: ReactNode;
  label: string;
  value: number | string;
}

export const StatBox = memo(function StatBox({ icon, label, value }: StatBoxProps) {
  return (
    <div className="flex flex-col items-center p-3 rounded-xl bg-white/5 border border-white/5 backdrop-blur-sm">
      <div className="text-violet-400/80 mb-1">{icon}</div>
      <p className="text-white font-light text-lg">{value}</p>
      <p className="text-white/50 text-xs font-light">{label}</p>
    </div>
  );
});
