/**
 * @fileoverview Success Step
 * Shows shareable link after successful transfer creation
 */

import { memo } from 'react';
import { Clock, Copy, Check, Share2, XCircle } from 'lucide-react';

interface SuccessStepProps {
  mode: 'gift' | 'swap';
  shareableLink: string;
  timeRemaining: string;
  copied: boolean;
  isLoading: boolean;
  onCopyLink: () => void;
  onShare: () => void;
  onCancelTransfer: () => void;
  onConfirmAndClose: () => void;
}

export const SuccessStep = memo(({
  mode,
  shareableLink,
  timeRemaining,
  copied,
  isLoading,
  onCopyLink,
  onShare,
  onCancelTransfer,
  onConfirmAndClose,
}: SuccessStepProps) => {
  return (
    <>
      {/* Expiry countdown */}
      <div className="flex items-center justify-center gap-2 text-white/60 text-sm">
        <Clock className="w-4 h-4" />
        <span>{timeRemaining}</span>
      </div>

      {/* Link display */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
        <p className="text-white/40 text-xs mb-2 uppercase tracking-wider">Shareable Link</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-xs text-white/80 truncate bg-black/30 px-3 py-2 rounded-lg">
            {shareableLink}
          </code>
          <button
            onClick={onCopyLink}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors flex-shrink-0"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4 text-white/60" />
            )}
          </button>
        </div>
      </div>

      {/* Share buttons */}
      <div className="flex gap-3">
        <button
          onClick={onCopyLink}
          className="flex-1 py-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors font-medium flex items-center justify-center gap-2"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied!' : 'Copy Link'}
        </button>
        <button
          onClick={onShare}
          className={`flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
            mode === 'gift'
              ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600'
              : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600'
          }`}
        >
          <Share2 className="w-4 h-4" />
          Share
        </button>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onCancelTransfer}
          disabled={isLoading}
          className="flex-1 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <XCircle className="w-4 h-4" />
          Cancel Transfer
        </button>
        <button
          onClick={onConfirmAndClose}
          className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white transition-all text-sm font-medium"
        >
          Done
        </button>
      </div>
    </>
  );
});

SuccessStep.displayName = 'SuccessStep';
