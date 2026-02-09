/**
 * @fileoverview Gradient Button Component
 * @description Standardized gradient button with multiple variants
 */

import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface GradientButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export const GradientButton = forwardRef<HTMLButtonElement, GradientButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const baseStyles = 'font-medium transition-all duration-200 flex items-center justify-center gap-2';
    
    const variants = {
      primary: 'rounded-full bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:from-violet-600 hover:to-purple-700',
      ghost: 'rounded-2xl bg-white/10 border border-white/20 text-white hover:bg-white/15 hover:border-white/30 backdrop-blur-sm',
      outline: 'rounded-2xl bg-transparent border border-white/20 text-white hover:bg-white/10',
    };

    const sizes = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-sm',
      lg: 'px-8 py-3 text-base',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

GradientButton.displayName = 'GradientButton';
