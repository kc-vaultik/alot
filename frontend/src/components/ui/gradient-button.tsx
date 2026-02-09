import { memo, forwardRef, ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Slot } from '@radix-ui/react-slot';

interface GradientButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'cyan';
  size?: 'default' | 'lg';
  asChild?: boolean;
}

const VARIANTS = {
  primary: {
    base: 'from-violet-600 to-purple-600',
    hover: 'from-violet-500 to-purple-500',
  },
  secondary: {
    base: 'from-cyan-500/20 via-violet-500/20 to-purple-600/20',
    hover: 'from-cyan-400/30 via-violet-500/30 to-purple-600/30',
  },
  cyan: {
    base: 'from-cyan-500 to-violet-500',
    hover: 'from-cyan-400 to-violet-400',
  },
};

const SIZES = {
  default: 'h-10 px-4 py-2',
  lg: 'h-12 px-6',
};

export const GradientButton = memo(forwardRef<HTMLButtonElement, GradientButtonProps>(
  ({ className, children, variant = 'primary', size = 'default', asChild, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    const variantStyles = VARIANTS[variant];
    
    return (
      <Comp
        ref={ref}
        disabled={disabled}
        className={cn(
          'relative inline-flex items-center justify-center gap-2',
          'font-medium text-white rounded-lg overflow-hidden',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          SIZES[size],
          className
        )}
        {...props}
      >
        {/* Base gradient background */}
        <span 
          className={cn(
            'absolute inset-0 bg-gradient-to-r',
            variantStyles.base
          )} 
        />
        
        {/* Hover gradient overlay - fades in on hover */}
        <span 
          className={cn(
            'absolute inset-0 bg-gradient-to-r opacity-0 transition-opacity duration-200',
            !disabled && 'group-hover:opacity-100 hover:opacity-100',
            variantStyles.hover
          )} 
        />
        
        {/* Content - always above gradients */}
        <span className="relative z-10 flex items-center justify-center gap-2">
          {children}
        </span>
      </Comp>
    );
  }
));

GradientButton.displayName = 'GradientButton';
