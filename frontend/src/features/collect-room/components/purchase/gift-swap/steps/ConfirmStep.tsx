/**
 * @fileoverview Confirm Step
 * Initial confirmation step for gift/swap flow
 */

import { memo } from 'react';
import { AlertTriangle, Link2 } from 'lucide-react';
import { CollectorSelector } from '@/features/collectors/components/CollectorSelector';
import type { CollectorListItem } from '@/features/collectors/types';

interface ConfirmStepProps {
  mode: 'gift' | 'swap';
  selectedCollector: CollectorListItem | null;
  isLoading: boolean;
  onSelectCollector: (collector: CollectorListItem | null) => void;
  onCreateTransfer: () => void;
}

export const ConfirmStep = memo(({
  mode,
  selectedCollector,
  isLoading,
  onSelectCollector,
  onCreateTransfer,
}: ConfirmStepProps) => {
  return (
    <>
      {/* Collector selector */}
      <CollectorSelector 
        onSelect={onSelectCollector} 
        selectedCollector={selectedCollector} 
      />

      {/* Warning */}
      <div className="bg-amber-500/10 border border-amber-400/20 rounded-xl p-4 flex gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-amber-400 font-medium text-sm">Important</p>
          <p className="text-amber-400/70 text-xs mt-1">
            {mode === 'gift' 
              ? selectedCollector 
                ? `Only ${selectedCollector.display_name || selectedCollector.username} can claim this gift. Once claimed, the card will be permanently transferred.`
                : "Once your friend claims the gift, the card will be permanently transferred to their vault. This action cannot be undone."
              : selectedCollector
                ? `Only ${selectedCollector.display_name || selectedCollector.username} can accept this swap. Both cards will be exchanged automatically.`
                : "When someone accepts your swap offer, both cards will be exchanged automatically. Make sure you're happy with the trade."
            }
          </p>
        </div>
      </div>

      <p className="text-white/60 text-sm text-center">
        {selectedCollector 
          ? `${selectedCollector.display_name || selectedCollector.username} will be notified and can claim directly.`
          : mode === 'gift' 
            ? "Generate a link to share with your friend. The link will be valid for 7 days."
            : "Generate a swap link. Your friend can offer one of their cards in exchange."
        }
      </p>

      <button
        onClick={onCreateTransfer}
        disabled={isLoading}
        className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50 ${
          mode === 'gift'
            ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600'
            : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600'
        }`}
      >
        <Link2 className="w-5 h-5" />
        {selectedCollector 
          ? `Send ${mode === 'gift' ? 'Gift' : 'Swap Offer'} to ${selectedCollector.username}`
          : `Generate ${mode === 'gift' ? 'Gift' : 'Swap'} Link`
        }
      </button>
    </>
  );
});

ConfirmStep.displayName = 'ConfirmStep';
