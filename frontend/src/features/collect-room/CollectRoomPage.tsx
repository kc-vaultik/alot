/**
 * @fileoverview Collect Room Page
 * @description Main page component for the Collect Room feature where users can
 * purchase mystery cards, reveal collectibles, battle other collectors, and
 * manage their vault collection.
 */

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { PageErrorBoundary, SafeWrapper } from '@/components/shared';
import { CollectRoomProvider, useCollectRoom } from './context/CollectRoomContext';
import { useSpendCredits } from './hooks/actions';
import { useRoomEntryReturn } from '@/features/rooms/hooks';
import { RoomEntryRevealScreen } from '@/features/rooms/components/entry';
import {
  CollectRoomBackground,
  OpeningOverlay,
  LoadingScreen,
  SealedPack,
  CardEmerge,
  CardReveal,
  GoldenReveal,
  PurchaseModal,
  VaultView,
  BattlesHubView,
  BottomNavigation,
} from './components';
import type { NavTab } from './components';

function CollectRoomContent() {
  const [activeTab, setActiveTab] = useState<NavTab>('collect');
  const location = useLocation();

  // Room entry return flow (from Stripe checkout)
  const { isProcessing, entryData, showReveal, clearReveal } = useRoomEntryReturn();

  const {
    screen,
    setScreen,
    currentCard,
    latestCard,
    queueLength,
    hasCardsToReveal,
    reveals,
    credits,
    isLoading,
    isOpening,
    handleUnseal,
    handleReveal,
    handleAddToCollection,
    handleUnboxAnother,
    handleViewCollection,
    handleFreePullSuccess,
    handleDemoGolden,
    purchaseOpen,
    setPurchaseOpen,
    refetchCredits,
    refetchReveals,
  } = useCollectRoom();
  const { spendCredits } = useSpendCredits();
  const totalPoints = credits?.universal || 0;

  const handleSpendPoints = async (points: number, productKey: string, _progressGained: number) => {
    const result = await spendCredits(productKey, points);
    if (result.success) {
      refetchCredits();
    }
  };

  // Allow deep-linking into Rooms via ?tab=rooms (preserves lovable token params)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'rooms' || tab === 'battles') {
      setActiveTab('battles');
      setScreen('sealed');
    }
  }, [location.search, setScreen]);

  // Handle tab navigation
  const handleTabChange = (tab: NavTab) => {
    setActiveTab(tab);
    if (tab === 'collect') {
      setScreen('sealed');
    } else if (tab === 'vault') {
      setScreen('collection');
    } else if (tab === 'battles') {
      setScreen('sealed'); // Reset screen to prevent vault sync interference
    }
  };

  // Sync activeTab when screen changes to 'collection' (e.g., from reveal flow)
  useEffect(() => {
    if (screen === 'collection' && activeTab !== 'vault') {
      setActiveTab('vault');
    }
  }, [screen, activeTab]);

  // Calculate redeem progress for the room's product
  const getRedeemProgress = () => {
    if (!entryData?.product?.id || !credits?.products) return undefined;
    
    const productCredit = credits.products.find(
      (pc) => pc.product_class_id === entryData.product?.id
    );
    
    if (!productCredit) return undefined;
    
    // Target is the retail value in cents (retail_value_usd * 100)
    const targetCents = (entryData.product.retail_value_usd || 0) * 100;
    if (targetCents <= 0) return undefined;
    
    return {
      current: productCredit.credits,
      target: targetCents,
    };
  };

  // PRIORITY 1: Show room entry reveal animation (takes precedence over everything)
  if (showReveal && entryData) {
    return (
      <RoomEntryRevealScreen
        room={entryData.room}
        product={entryData.product}
        creditsEarned={entryData.creditsEarned}
        userTotalCredits={entryData.userTotalCredits}
        totalRoomCredits={entryData.totalRoomCredits}
        redeemProgress={getRedeemProgress()}
        onComplete={clearReveal}
      />
    );
  }

  // PRIORITY 2: Show processing indicator while waiting for room entry data
  if (isProcessing) {
    return (
      <div className="h-[100dvh] bg-zinc-950 flex items-center justify-center">
        <div className="text-center text-foreground">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto mb-4" />
          <p className="text-lg">Processing your purchase...</p>
        </div>
      </div>
    );
  }

  // PRIORITY 3: Show loading screen only during initial data load
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Check if we're in a card reveal flow (should hide bottom nav)
  const isRevealFlow = screen === 'emerge' || screen === 'reveal' || screen === 'golden';

  return (
    <div className="h-[100dvh] bg-zinc-950 overflow-hidden relative flex flex-col isolate">
      {/* Opaque blocker layer - blocks any fixed elements from other pages */}
      <div className="fixed inset-0 bg-zinc-950 -z-30 pointer-events-none" />
      
      <Helmet>
        <title>Collect Room | Play, Battle & Win Collectibles</title>
        <meta name="description" content="Play, battle and win Mystery Cards. Unlock progress toward owning authenticated collectibles from top brands." />
      </Helmet>

      <CollectRoomBackground />
      <OpeningOverlay isOpening={isOpening} />

      {/* Main viewport content - z-[10] above background; min-h-0 enables inner scrolling */}
      <div className="relative flex-1 min-h-0 z-[10] overflow-y-auto overflow-x-hidden">
        <SafeWrapper fallbackTitle="Purchase failed" compact>
          <PurchaseModal isOpen={purchaseOpen} onClose={() => setPurchaseOpen(false)} />
        </SafeWrapper>

        <AnimatePresence mode="wait">
          {/* Rooms Hub Tab */}
          {activeTab === 'battles' && !isRevealFlow && (
            <motion.div
              key="rooms-hub"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full min-h-0 flex flex-col"
            >
              <SafeWrapper fallbackTitle="Rooms unavailable">
                <BattlesHubView />
              </SafeWrapper>
            </motion.div>
          )}

          {/* Collect Tab - Mystery Card */}
          {activeTab === 'collect' && screen === 'sealed' && (
            <div className="h-full">
              <SealedPack key="sealed" availableCards={queueLength} />
            </div>
          )}

          {screen === 'emerge' && currentCard && (
            <CardEmerge key="emerge" card={currentCard} onReveal={handleReveal} />
          )}

          {screen === 'reveal' && currentCard && (
            <SafeWrapper fallbackTitle="Reveal error" fallbackMessage="Unable to display card. Your card has been saved.">
              <CardReveal key="reveal" card={currentCard} onContinue={handleViewCollection} onUnboxAnother={handleUnboxAnother} />
            </SafeWrapper>
          )}

          {screen === 'golden' && currentCard && (
            <SafeWrapper fallbackTitle="Golden reveal error" fallbackMessage="Your golden card has been saved to your vault.">
              <GoldenReveal key="golden" card={currentCard} onClaim={handleAddToCollection} />
            </SafeWrapper>
          )}

          {/* Vault Tab - also show when screen is 'collection' (from reveal flow) */}
          {(activeTab === 'vault' || screen === 'collection') && !isRevealFlow && (
            <motion.div
              key="vault"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="h-full"
            >
              <VaultView
                collection={reveals}
                onUnboxAnother={() => handleTabChange('collect')}
                latestCard={latestCard ?? undefined}
                totalPoints={totalPoints}
                onSpendPoints={handleSpendPoints}
                isLoading={isLoading}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Navigation - Always visible except during reveal flow, z-[20] to be above content */}
      {!isRevealFlow && (
        <div className="z-[20]">
          <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
        </div>
      )}
    </div>
  );
}

/**
 * CollectRoomPage - Main entry point for the Collect Room feature
 * Wraps content in context provider and error boundary for resilience
 */
export default function CollectRoomPage() {
  return (
    <PageErrorBoundary>
      <CollectRoomProvider>
        <CollectRoomContent />
      </CollectRoomProvider>
    </PageErrorBoundary>
  );
}
