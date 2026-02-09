/**
 * @fileoverview Generating Step
 * Loading state while creating transfer
 */

import { memo } from 'react';
import { Loader2 } from 'lucide-react';

interface GeneratingStepProps {
  mode: 'gift' | 'swap';
}

export const GeneratingStep = memo(({ mode }: GeneratingStepProps) => {
  return (
    <div className="py-8 flex flex-col items-center gap-4">
      <Loader2 className={`w-10 h-10 animate-spin ${mode === 'gift' ? 'text-pink-400' : 'text-blue-400'}`} />
      <p className="text-white/60 text-sm">Creating your {mode} link...</p>
    </div>
  );
});

GeneratingStep.displayName = 'GeneratingStep';
