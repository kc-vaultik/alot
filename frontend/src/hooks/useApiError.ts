/**
 * @fileoverview Shared hook for consistent API error handling
 * 
 * Provides standardized error handling patterns for hooks that make API calls.
 */

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: unknown;
}

interface UseApiErrorOptions {
  /** Log errors to console/logger */
  logErrors?: boolean;
  /** Show toast notifications for errors */
  showToast?: boolean;
  /** Custom error message prefix */
  context?: string;
}

interface UseApiErrorReturn {
  /** Current error state */
  error: ApiError | null;
  /** Clear the current error */
  clearError: () => void;
  /** Handle an error (logs, shows toast, sets state) */
  handleError: (error: unknown, customMessage?: string) => void;
  /** Wrap an async function with error handling */
  withErrorHandling: <T>(
    fn: () => Promise<T>,
    options?: { successMessage?: string; errorMessage?: string }
  ) => Promise<T | null>;
}

/**
 * Normalize various error types into a consistent ApiError format
 */
function normalizeError(error: unknown): ApiError {
  // Already an ApiError-like object
  if (error && typeof error === 'object' && 'message' in error) {
    const e = error as { message?: string; code?: string; status?: number; details?: unknown };
    return {
      message: e.message || 'An unknown error occurred',
      code: e.code,
      status: e.status,
      details: e.details,
    };
  }

  // Standard Error
  if (error instanceof Error) {
    return {
      message: error.message,
      code: error.name,
    };
  }

  // String error
  if (typeof error === 'string') {
    return { message: error };
  }

  // Unknown
  return { message: 'An unknown error occurred' };
}

/**
 * Hook for consistent API error handling across the application.
 * 
 * @example
 * const { error, handleError, withErrorHandling } = useApiError({ context: 'UserProfile' });
 * 
 * // Option 1: Manual handling
 * try {
 *   await fetchData();
 * } catch (e) {
 *   handleError(e, 'Failed to load profile');
 * }
 * 
 * // Option 2: Wrapped handling
 * const result = await withErrorHandling(
 *   () => fetchData(),
 *   { errorMessage: 'Failed to load profile' }
 * );
 */
export function useApiError(options: UseApiErrorOptions = {}): UseApiErrorReturn {
  const { logErrors = true, showToast = true, context = 'API' } = options;
  const [error, setError] = useState<ApiError | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleError = useCallback(
    (rawError: unknown, customMessage?: string) => {
      const normalized = normalizeError(rawError);
      const displayMessage = customMessage || normalized.message;

      setError(normalized);

      if (logErrors) {
        logger.error(`[${context}] ${displayMessage}`, {
          code: normalized.code,
          status: normalized.status,
          details: normalized.details,
        });
      }

      if (showToast) {
        toast.error(displayMessage);
      }
    },
    [context, logErrors, showToast]
  );

  const withErrorHandling = useCallback(
    async <T,>(
      fn: () => Promise<T>,
      fnOptions?: { successMessage?: string; errorMessage?: string }
    ): Promise<T | null> => {
      clearError();
      try {
        const result = await fn();
        if (fnOptions?.successMessage && showToast) {
          toast.success(fnOptions.successMessage);
        }
        return result;
      } catch (e) {
        handleError(e, fnOptions?.errorMessage);
        return null;
      }
    },
    [clearError, handleError, showToast]
  );

  return {
    error,
    clearError,
    handleError,
    withErrorHandling,
  };
}

/**
 * Type guard to check if a value is an API error response
 */
export function isApiErrorResponse(value: unknown): value is { error: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'error' in value &&
    typeof (value as { error: unknown }).error === 'string'
  );
}

/**
 * Extract error message from various response formats
 */
export function extractErrorMessage(response: unknown, fallback = 'An error occurred'): string {
  if (isApiErrorResponse(response)) {
    return response.error;
  }
  
  if (response && typeof response === 'object' && 'message' in response) {
    return String((response as { message: unknown }).message);
  }
  
  if (typeof response === 'string') {
    return response;
  }
  
  return fallback;
}
