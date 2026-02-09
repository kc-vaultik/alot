/**
 * @fileoverview Gift/Swap State Hook
 * Manages all state and logic for the gift/swap flow
 */

import { useState, useEffect, useCallback } from 'react';
import type { CollectCard } from '@/features/collect-room/types';
import { getRarityTier, getRarityLabel } from '@/utils/styling';
import { useCardTransfers } from '@/features/collect-room/hooks/actions';
import { toast } from 'sonner';
import type { CollectorListItem } from '@/features/collectors/types';

export type ModalStep = 'confirm' | 'generating' | 'success' | 'error';

interface UseGiftSwapStateOptions {
  card: CollectCard;
  mode: 'gift' | 'swap';
  preselectedCollector?: { user_id: string; username: string; display_name?: string | null };
  onConfirm: (mode: 'gift' | 'swap') => void;
  onClose: () => void;
}

export function useGiftSwapState({
  card,
  mode,
  preselectedCollector,
  onConfirm,
  onClose,
}: UseGiftSwapStateOptions) {
  const [step, setStep] = useState<ModalStep>('confirm');
  const [copied, setCopied] = useState(false);
  const [claimToken, setClaimToken] = useState<string | null>(null);
  const [transferId, setTransferId] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [selectedCollector, setSelectedCollector] = useState<CollectorListItem | null>(
    preselectedCollector ? {
      user_id: preselectedCollector.user_id,
      username: preselectedCollector.username,
      display_name: preselectedCollector.display_name,
      avatar_url: null,
      card_count: 0,
      score: 0,
    } : null
  );

  const { createGiftTransfer, createSwapOffer, cancelTransfer, isLoading } = useCardTransfers();

  // Generate the shareable link
  const shareableLink = claimToken 
    ? `${window.location.origin}/collect-room/claim/${claimToken}`
    : '';

  // Calculate time remaining
  useEffect(() => {
    if (!expiresAt) return;

    const updateTimeRemaining = () => {
      const now = new Date();
      const expiry = new Date(expiresAt);
      const diff = expiry.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('Expired');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeRemaining(`${days}d ${hours}h remaining`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m remaining`);
      } else {
        setTimeRemaining(`${minutes}m remaining`);
      }
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 60000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  // Handle creating the transfer
  const handleCreateTransfer = useCallback(async () => {
    setStep('generating');
    setErrorMessage(null);

    const revealId = card.card_id;
    const toUserId = selectedCollector?.user_id;

    const result = mode === 'gift' 
      ? await createGiftTransfer(revealId, toUserId)
      : await createSwapOffer(revealId, toUserId);

    if (result.success && result.claim_token) {
      setClaimToken(result.claim_token);
      setTransferId(result.transfer_id || null);
      setExpiresAt(result.expires_at || null);
      setStep('success');
      
      const recipientName = selectedCollector?.display_name || selectedCollector?.username;
      toast.success(
        mode === 'gift' 
          ? (recipientName ? `Gift sent to ${recipientName}!` : 'Gift link created!')
          : (recipientName ? `Swap offer sent to ${recipientName}!` : 'Swap link created!')
      );
    } else {
      setErrorMessage(result.error || 'Failed to create transfer');
      setStep('error');
    }
  }, [card.card_id, mode, selectedCollector, createGiftTransfer, createSwapOffer]);

  // Handle canceling the transfer
  const handleCancelTransfer = useCallback(async () => {
    if (!transferId) return;

    const result = await cancelTransfer(transferId);
    if (result.success) {
      toast.success('Transfer cancelled');
      onClose();
    } else {
      toast.error(result.error || 'Failed to cancel transfer');
    }
  }, [transferId, cancelTransfer, onClose]);

  // Handle copying the link
  const handleCopyLink = useCallback(async () => {
    if (!shareableLink) return;
    await navigator.clipboard.writeText(shareableLink);
    setCopied(true);
    toast.success('Link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  }, [shareableLink]);

  // Handle sharing
  const handleShare = useCallback(async () => {
    const tier = getRarityTier(card.rarity_score);
    const shareText = mode === 'gift' 
      ? `🎁 I'm gifting you my ${getRarityLabel(tier)} - ${card.brand} ${card.model}! Claim it here:`
      : `🔄 Want to swap cards? I'm offering my ${getRarityLabel(tier)} - ${card.brand} ${card.model}. Check it out:`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: mode === 'gift' ? 'Collect Room Gift' : 'Collect Room Swap Offer',
          text: shareText,
          url: shareableLink,
        });
      } catch {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  }, [card, mode, shareableLink, handleCopyLink]);

  // Handle confirming and close
  const handleConfirmAndClose = useCallback(() => {
    onConfirm(mode);
  }, [mode, onConfirm]);

  // Retry from error state
  const handleRetry = useCallback(() => {
    setStep('confirm');
  }, []);

  return {
    // State
    step,
    copied,
    claimToken,
    shareableLink,
    timeRemaining,
    errorMessage,
    selectedCollector,
    isLoading,
    
    // Setters
    setSelectedCollector,
    
    // Actions
    handleCreateTransfer,
    handleCancelTransfer,
    handleCopyLink,
    handleShare,
    handleConfirmAndClose,
    handleRetry,
  };
}
