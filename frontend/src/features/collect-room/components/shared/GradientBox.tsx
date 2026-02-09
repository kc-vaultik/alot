/**
 * @fileoverview Gradient Box Component
 * @description Reusable container with cyan-violet-purple gradient border
 */

import { ReactNode } from 'react';

interface GradientBoxProps {
  children: ReactNode;
  className?: string;
}

export function GradientBox({ children, className = '' }: GradientBoxProps) {
  return (
    <div className={`relative rounded-2xl p-[1px] bg-gradient-to-br from-cyan-400/50 via-violet-500/50 to-purple-600/50 ${className}`}>
      <div className="rounded-2xl bg-zinc-900/90 backdrop-blur-sm p-4">
        {children}
      </div>
    </div>
  );
}
