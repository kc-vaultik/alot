/**
 * @fileoverview Shared components barrel export.
 * Explicit named exports for predictable API surface.
 * 
 * This module provides app-wide reusable components:
 * 
 * ## Error Handling
 * - `ErrorBoundary` - Main React error boundary class component
 * - `PageErrorBoundary` - Full-page error boundary with default UI
 * - `SafeWrapper` - Lightweight inline error boundary for sections
 * - `ComponentErrorFallback` - Reusable error UI component
 * - `withErrorBoundary` - HOC for wrapping components with error handling
 * 
 * ## Routing Utilities
 * - `ScrollToTop` - Scrolls to top on route change
 * 
 * ## Reveal Animations
 * - `CardEmergeAnimation` - Card emergence animation
 * - `CardRevealAnimation` - Card reveal animation
 * - `RevealSuccessScreen` - Success screen after reveal
 * 
 * @module components/shared
 */

// ============= Error Handling =============
export { 
  ErrorBoundary, 
  withErrorBoundary, 
  PageErrorBoundary,
  SafeWrapper,
  ComponentErrorFallback,
} from './ErrorBoundary';

// ============= Routing =============
export { ScrollToTop } from './ScrollToTop';

// ============= Reveal Animations =============
export { 
  CardEmergeAnimation, 
  CardRevealAnimation, 
  RevealSuccessScreen,
} from './reveal';
export type { 
  CardEmergeProps, 
  CardRevealProps, 
  RevealAuraColors, 
  RevealSuccessProps,
} from './reveal';
