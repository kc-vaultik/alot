/**
 * @fileoverview Section Title Component
 * @description The serif italic gradient title pattern used across pages
 */

import { ReactNode } from 'react';

interface SectionTitleProps {
  /** The highlighted word(s) with gradient styling */
  highlight: string;
  /** The regular text following the highlight */
  text?: string;
  /** Additional CSS classes */
  className?: string;
}

export function SectionTitle({ highlight, text, className = '' }: SectionTitleProps) {
  return (
    <h1 className={`text-2xl sm:text-3xl ${className}`}>
      <span className="font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-violet-400 to-purple-500">
        {highlight}
      </span>
      {text && (
        <>
          {' '}
          <span className="font-sans font-light text-white">{text}</span>
        </>
      )}
    </h1>
  );
}
