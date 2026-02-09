/**
 * @fileoverview Error Step
 * Displays error message with retry option
 */

import { memo } from 'react';
import { XCircle } from 'lucide-react';

interface ErrorStepProps {
  errorMessage: string | null;
  onRetry: () => void;
}

export const ErrorStep = memo(({ errorMessage, onRetry }: ErrorStepProps) => {
  return (
    <>
      <div className="bg-red-500/10 border border-red-400/20 rounded-xl p-4 flex gap-3">
        <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-red-400 font-medium text-sm">Error</p>
          <p className="text-red-400/70 text-xs mt-1">{errorMessage}</p>
        </div>
      </div>

      <button
        onClick={onRetry}
        className="w-full py-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors font-medium"
      >
        Try Again
      </button>
    </>
  );
});

ErrorStep.displayName = 'ErrorStep';
