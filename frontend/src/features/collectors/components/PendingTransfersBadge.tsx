/**
 * @fileoverview Badge component showing pending transfers with a collector
 */

import { memo } from 'react';
import { Gift, ArrowLeftRight } from 'lucide-react';
import { usePendingTransfers } from '../hooks/data';

interface PendingTransfersBadgeProps {
  collectorUserId: string;
  variant?: 'compact' | 'detailed';
}

export const PendingTransfersBadge = memo(({ collectorUserId, variant = 'compact' }: PendingTransfersBadgeProps) => {
  const { data: transfers, isLoading } = usePendingTransfers(collectorUserId);

  if (isLoading || !transfers) return null;

  const totalIncoming = transfers.total_incoming;
  const totalOutgoing = transfers.total_outgoing;

  if (totalIncoming === 0 && totalOutgoing === 0) return null;

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2">
        {totalIncoming > 0 && (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-light">
            <Gift className="w-3 h-3" />
            <span>{totalIncoming} incoming</span>
          </div>
        )}
        {totalOutgoing > 0 && (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-light">
            <ArrowLeftRight className="w-3 h-3" />
            <span>{totalOutgoing} pending</span>
          </div>
        )}
      </div>
    );
  }

  // Detailed variant
  return (
    <div className="bg-white/5 rounded-xl p-4 border border-white/5 space-y-3 backdrop-blur-sm">
      <h4 className="text-white/70 text-xs font-light">Pending Transfers</h4>
      
      {transfers.incoming_gifts > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/50 flex items-center gap-2 font-light">
            <Gift className="w-4 h-4 text-pink-400/80" />
            Gifts from this collector
          </span>
          <span className="text-pink-400 font-light">{transfers.incoming_gifts}</span>
        </div>
      )}
      
      {transfers.incoming_swaps > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/50 flex items-center gap-2 font-light">
            <ArrowLeftRight className="w-4 h-4 text-blue-400/80" />
            Swap offers from this collector
          </span>
          <span className="text-blue-400 font-light">{transfers.incoming_swaps}</span>
        </div>
      )}
      
      {transfers.outgoing_gifts > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/50 flex items-center gap-2 font-light">
            <Gift className="w-4 h-4 text-pink-400/40" />
            Your gifts to this collector
          </span>
          <span className="text-white/50 font-light">{transfers.outgoing_gifts}</span>
        </div>
      )}
      
      {transfers.outgoing_swaps > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/50 flex items-center gap-2 font-light">
            <ArrowLeftRight className="w-4 h-4 text-blue-400/40" />
            Your swap offers to this collector
          </span>
          <span className="text-white/50 font-light">{transfers.outgoing_swaps}</span>
        </div>
      )}
    </div>
  );
});

PendingTransfersBadge.displayName = 'PendingTransfersBadge';
