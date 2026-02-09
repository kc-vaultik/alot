/**
 * @fileoverview Consolidated error handling components
 * 
 * This module provides:
 * - ErrorBoundary: Main React error boundary
 * - PageErrorBoundary: Full-page error boundary with default UI
 * - SafeWrapper: Lightweight inline error boundary
 * - ComponentErrorFallback: Reusable error UI component
 * - withErrorBoundary: HOC for wrapping components
 */

import React, { Component, ReactNode, memo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ============================================================================
// TYPES
// ============================================================================

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ComponentErrorFallbackProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  compact?: boolean;
  /** Error object for more context (optional) */
  error?: Error;
}

interface SafeWrapperProps {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  compact?: boolean;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

// ============================================================================
// COMPONENT ERROR FALLBACK
// ============================================================================

/**
 * Lightweight error fallback for use inside component error boundaries.
 * Provides a retry button and minimal error messaging without disrupting
 * the overall page layout.
 */
export const ComponentErrorFallback = memo(({
  title = 'Something went wrong',
  message = 'This section failed to load. Please try again.',
  onRetry,
  compact = false,
}: ComponentErrorFallbackProps) => {
  if (compact) {
    return (
      <div className="flex items-center justify-center gap-3 py-8 px-4 text-white/60">
        <AlertTriangle className="w-5 h-5 text-amber-500" />
        <span className="text-sm">{title}</span>
        {onRetry && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRetry}
            className="text-violet-400 hover:text-violet-300"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Retry
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
        <AlertTriangle className="w-6 h-6 text-amber-500" />
      </div>
      
      <h3 className="text-lg font-medium text-white mb-2">{title}</h3>
      <p className="text-sm text-white/50 max-w-sm mb-6">{message}</p>
      
      {onRetry && (
        <Button
          variant="outline"
          onClick={onRetry}
          className="border-white/20 text-white hover:bg-white/10"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      )}
    </div>
  );
});

ComponentErrorFallback.displayName = 'ComponentErrorFallback';

// ============================================================================
// DEFAULT PAGE ERROR FALLBACK
// ============================================================================

const DefaultPageErrorFallback = ({ 
  error, 
  resetError 
}: { 
  error: Error; 
  resetError: () => void; 
}) => (
  <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
    <div className="w-full max-w-md text-center bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
      <div className="space-y-4">
        <div className="text-4xl">😕</div>
        <h2 className="text-xl font-semibold text-white">Something went wrong</h2>
        <p className="text-sm text-zinc-400">
          {error.message || "An unexpected error occurred"}
        </p>
        <button
          onClick={resetError}
          className="w-full bg-violet-600 hover:bg-violet-700 text-white py-3 px-4 rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  </div>
);

// ============================================================================
// ERROR BOUNDARY (Main Implementation)
// ============================================================================

/**
 * Main error boundary component.
 * Catches JavaScript errors in child components and displays a fallback UI.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
    this.props.onError?.(error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultPageErrorFallback;
      return (
        <FallbackComponent 
          error={this.state.error} 
          resetError={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// SAFE WRAPPER (Inline Error Boundary)
// ============================================================================

/**
 * Inline fallback component for SafeWrapper
 */
const SafeWrapperFallback = ({
  title,
  message,
  compact,
  resetError,
}: {
  title?: string;
  message?: string;
  compact?: boolean;
  error: Error;
  resetError: () => void;
}) => (
  <ComponentErrorFallback
    title={title}
    message={message}
    onRetry={resetError}
    compact={compact}
  />
);

/**
 * Lightweight error boundary wrapper for sections of the UI.
 * Use this to wrap components that might fail without crashing the entire page.
 * 
 * This is a convenience wrapper around ErrorBoundary with a simpler API
 * and inline-friendly fallback UI.
 * 
 * @example
 * <SafeWrapper fallbackTitle="Battle unavailable">
 *   <BattleLobby />
 * </SafeWrapper>
 */
export class SafeWrapper extends Component<SafeWrapperProps, ErrorBoundaryState> {
  constructor(props: SafeWrapperProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[SafeWrapper] Component error:', error);
    console.error('[SafeWrapper] Error info:', errorInfo.componentStack);
    this.props.onError?.(error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <SafeWrapperFallback
          title={this.props.fallbackTitle}
          message={this.props.fallbackMessage}
          compact={this.props.compact}
          error={this.state.error}
          resetError={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// HIGHER-ORDER COMPONENTS & UTILITIES
// ============================================================================

/**
 * HOC to wrap a component with an error boundary
 */
export function withErrorBoundary<T extends Record<string, unknown>>(
  WrappedComponent: React.ComponentType<T>,
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>
) {
  return function WithErrorBoundary(props: T) {
    return (
      <ErrorBoundary fallback={fallback}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
}

/**
 * Page-level error boundary with default full-screen fallback
 */
export function PageErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary fallback={DefaultPageErrorFallback}>
      {children}
    </ErrorBoundary>
  );
}
