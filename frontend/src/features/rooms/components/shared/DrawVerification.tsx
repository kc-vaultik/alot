/**
 * @fileoverview Provably Fair Draw Verification Component
 * Allows users to verify past prize room draws
 */

import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, CheckCircle, XCircle, Copy, ExternalLink, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface DrawVerificationProps {
  roomId: string;
  drawId?: string;
}

interface DrawVerificationData {
  success: boolean;
  draw_id: string;
  room_id: string;
  is_valid: boolean;
  total_tickets: number;
  winning_ticket: number;
  drawn_at: string;
  server_seed: string;
  client_seed: string;
  verification_hash: string;
}

export const DrawVerification = memo(function DrawVerification({ roomId, drawId }: DrawVerificationProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationData, setVerificationData] = useState<DrawVerificationData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    if (!drawId) {
      setError('No draw ID available');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc('verify_lottery_draw', {
        p_draw_id: drawId,
      });

      if (rpcError) throw rpcError;

      const result = data as unknown as DrawVerificationData;
      if (!result.success) {
        setError('Failed to verify draw');
        return;
      }

      setVerificationData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <div className="rounded-2xl bg-white/[0.02] border-4 border-white shadow-sticker overflow-hidden transform rotate-[0.5deg]">
      <button
        onClick={() => {
          setIsExpanded(!isExpanded);
          if (!isExpanded && !verificationData && drawId) {
            handleVerify();
          }
        }}
        className="w-full flex items-center justify-between p-4 hover:bg-white/[0.03] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 border-2 border-emerald-400/30">
            <Shield className="w-5 h-5 text-emerald-400" strokeWidth={2.5} />
          </div>
          <div className="text-left">
            <p className="font-display text-base text-white tracking-wide">PROVABLY FAIR</p>
            <p className="text-xs text-white/50">Verify this LOT draw was random</p>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-white/50 transition-transform ${isExpanded ? 'rotate-180' : ''}`} strokeWidth={2.5} />
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/10"
          >
            <div className="p-4 space-y-4">
              {isVerifying ? (
                <div className="flex items-center justify-center py-6">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-emerald-500 border-t-transparent" />
                  <span className="ml-2 text-sm text-white/60">Verifying...</span>
                </div>
              ) : error ? (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <XCircle className="w-4 h-4 text-red-400" />
                  <span className="text-sm text-red-400">{error}</span>
                </div>
              ) : verificationData ? (
                <>
                  {/* Verification Status */}
                  <div className={`flex items-center gap-2 p-3 rounded-xl border-2 ${
                    verificationData.is_valid 
                      ? 'bg-emerald-500/10 border-emerald-400/40' 
                      : 'bg-red-500/10 border-red-400/40'
                  }`}>
                    {verificationData.is_valid ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-emerald-400" strokeWidth={2.5} />
                        <span className="font-display text-sm text-emerald-400">DRAW VERIFIED ✓</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 text-red-400" strokeWidth={2.5} />
                        <span className="font-display text-sm text-red-400">VERIFICATION FAILED</span>
                      </>
                    )}
                  </div>

                  {/* Draw Details */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-white/40">Total Tickets</span>
                      <span className="text-sm text-white font-mono">{verificationData.total_tickets}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-white/40">Winning Ticket</span>
                      <span className="text-sm text-emerald-400 font-mono">#{verificationData.winning_ticket}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-white/40">Draw Time</span>
                      <span className="text-sm text-white/70">
                        {new Date(verificationData.drawn_at).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Seeds (Expandable) */}
                  <div className="space-y-2">
                    <p className="font-display text-xs text-white/60 tracking-wider">VERIFICATION DATA</p>
                    
                    {/* Server Seed */}
                    <div className="p-2.5 rounded-xl bg-white/5 border-2 border-white/10">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-white/40 font-medium">Server Seed</span>
                        <button
                          onClick={() => copyToClipboard(verificationData.server_seed, 'Server seed')}
                          className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <Copy className="w-3 h-3 text-white/40" strokeWidth={2.5} />
                        </button>
                      </div>
                      <p className="text-[10px] text-white/60 font-mono break-all">
                        {verificationData.server_seed}
                      </p>
                    </div>

                    {/* Client Seed */}
                    <div className="p-2.5 rounded-xl bg-white/5 border-2 border-white/10">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-white/40 font-medium">Client Seed</span>
                        <button
                          onClick={() => copyToClipboard(verificationData.client_seed, 'Client seed')}
                          className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <Copy className="w-3 h-3 text-white/40" strokeWidth={2.5} />
                        </button>
                      </div>
                      <p className="text-[10px] text-white/60 font-mono break-all">
                        {verificationData.client_seed}
                      </p>
                    </div>
                  </div>

                  {/* How to Verify */}
                  <div className="p-3 rounded-xl bg-hype-blue/10 border-2 border-hype-blue/30">
                    <p className="font-display text-[11px] text-hype-blue mb-1">HOW TO VERIFY:</p>
                    <ol className="text-[10px] text-blue-300/80 space-y-0.5 list-decimal list-inside font-medium">
                      <li>SHA256(server_seed + client_seed + "0") = combined_seed</li>
                      <li>First 8 hex chars → decimal → mod total_tickets + 1</li>
                      <li>Result should equal winning ticket #{verificationData.winning_ticket}</li>
                    </ol>
                  </div>
                </>
              ) : !drawId ? (
                <p className="text-sm text-white/40 text-center py-4">
                  Draw not yet completed
                </p>
              ) : (
                <Button
                  onClick={handleVerify}
                  variant="outline"
                  className="w-full"
                >
                  Verify Draw
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default DrawVerification;