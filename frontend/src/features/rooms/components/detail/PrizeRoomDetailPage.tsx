/**
 * @fileoverview Lot detail page - "The Arena"
 * Design: "Digital Vandalism" - game show vibe with spotlight effects
 */

import { memo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Layers, Sparkles, Trophy, Info } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { FundingProgressBar } from './FundingProgressBar';
import { ParticipantList } from './ParticipantList';
import { OddsCalculator } from './OddsCalculator';
import { CountdownTimer } from './CountdownTimer';
import { EntryPurchaseModal } from '../entry/EntryPurchaseModal';
import { TriviaSection, TriviaChallengeModal } from '../trivia';
import { useProductQuestions } from '../../hooks/data/useProductQuestions';
import { useIsPurchaseUnlocked } from '../../hooks/data/useTriviaAttempts';
import { ROOM_TIERS, ECONOMY_MESSAGING } from '../../constants';
import { formatCents } from '../../utils';
import type { Room, RoomTier } from '../../types';
import collectRoomPack from '@/assets/collect-room-pack.png';

interface PrizeRoomDetailPageProps {
  room: Room;
  product?: {
    id: string;
    name: string;
    brand: string;
    image_url: string | null;
    retail_value_usd: number;
    category: string;
  } | null;
  participants?: Array<{
    user_id: string;
    username?: string;
    display_name?: string;
    avatar_url?: string;
    entries: number;
    rank: number;
  }>;
  userEntry?: {
    entries: number;
    amount_spent_cents: number;
  } | null;
  totalEntries?: number;
  isLoading?: boolean;
  onBack: () => void;
}

export const PrizeRoomDetailPage = memo(function PrizeRoomDetailPage({
  room,
  product,
  participants = [],
  userEntry,
  totalEntries = 0,
  isLoading,
  onBack,
}: PrizeRoomDetailPageProps) {
  const { user } = useAuth();
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showTriviaChallenge, setShowTriviaChallenge] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  // Check trivia gate status
  const { data: questions } = useProductQuestions(product?.id);
  const { isUnlocked } = useIsPurchaseUnlocked(room.id);
  const hasQuestions = questions && questions.length > 0;
  const tierConfig = ROOM_TIERS[room.tier as RoomTier];
  
  // Show product retail value as the funding goal (not the 2.5x internal target)
  const productValueCents = product ? product.retail_value_usd * 100 : (room.tier_cap_cents || 0);
  
  const isFunded = room.status === 'FUNDED' || (room.escrow_balance_cents >= productValueCents);
  const isDrawing = room.status === 'DRAWING';
  const isSettled = room.status === 'SETTLED';
  const isExpired = room.status === 'EXPIRED';
  const canEnter = room.status === 'OPEN' && !isFunded;

  const userEntries = userEntry?.entries || 0;

  // Check if user is winner
  const isWinner = isSettled && room.winner_user_id === user?.id;

  // Generate a lot number from the room ID (first 4 chars as hex -> decimal, mod 9999)
  const lotNumber = parseInt(room.id.replace(/-/g, '').substring(0, 4), 16) % 9999 + 1;

  // Handle buy button click - gate with trivia if needed
  const handleBuyClick = useCallback(() => {
    // If no questions or already unlocked, go directly to purchase
    if (!hasQuestions || isUnlocked) {
      setShowPurchaseModal(true);
    } else {
      // Show trivia challenge first
      setShowTriviaChallenge(true);
    }
  }, [hasQuestions, isUnlocked]);

  // Handle trivia success - close trivia and open purchase
  const handleTriviaSuccess = useCallback(() => {
    setShowTriviaChallenge(false);
    setShowPurchaseModal(true);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
      {/* Header - Chunky sticker style */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/30">
        <div className="flex items-center gap-3 p-4">
          <button
            onClick={onBack}
            className="p-2 rounded-xl hover:bg-muted transition-colors border-2 border-border"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="flex-1 flex items-center gap-2">
            <span className={`px-3 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r ${tierConfig.color} text-black border-2 border-white shadow-sticker`}>
              {tierConfig.name}
            </span>
            {room.is_mystery && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-accent-blue/20 text-accent-blue border border-accent-blue/50">
                Mystery
              </span>
            )}
          </div>
          <button
            onClick={() => setShowHowItWorks(!showHowItWorks)}
            className="p-2 rounded-xl hover:bg-muted transition-colors border-2 border-border"
          >
            <Info className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Product image - Spotlight effect */}
      <div className="relative h-56 flex items-center justify-center overflow-hidden">
        {/* Layered gradient background - Hype Pack colors */}
        <div className="absolute inset-0 bg-background" />
        <div className="absolute -inset-6 bg-gradient-to-br from-primary/30 via-accent-blue/20 to-primary/30 blur-2xl" />
        <div className="absolute -inset-3 bg-gradient-to-br from-accent-blue/20 via-transparent to-primary/20 blur-xl" />
        
        {room.is_mystery && !product ? (
          <div className="relative h-full p-4 z-10">
            <img 
              src={collectRoomPack} 
              alt="Mystery Pack"
              className="h-full object-contain drop-shadow-2xl"
            />
            <Sparkles className="absolute top-4 right-4 w-8 h-8 text-primary animate-pulse" />
          </div>
        ) : product?.image_url ? (
          <img 
            src={product.image_url} 
            alt={product.name}
            className="max-h-48 object-contain z-10 drop-shadow-2xl"
          />
        ) : (
          <Trophy className="w-20 h-20 text-muted-foreground z-10" />
        )}

        {/* Status overlay */}
        {(isDrawing || isSettled || isExpired) && (
          <div className={`absolute inset-0 flex flex-col items-center justify-center ${
            isDrawing ? 'bg-primary/30' : isSettled ? 'bg-hype-green/20' : 'bg-destructive/20'
          } backdrop-blur-sm`}>
            <span className={`font-display text-2xl ${
              isDrawing ? 'text-primary' : isSettled ? 'text-hype-green' : 'text-destructive'
            }`}>
              {isDrawing ? '🎲 DRAWING...' : isSettled ? '🏆 WINNER!' : '⏰ EXPIRED'}
            </span>
            {isWinner && (
              <span className="text-lg text-hype-green mt-2 font-bold">YOU WON ALOT!</span>
            )}
          </div>
        )}

        {/* LOT # badge - bottom left */}
        <div className="absolute bottom-3 left-3 px-4 py-2 rounded-xl bg-card/90 backdrop-blur-sm border-2 border-white shadow-sticker">
          <span className="font-display text-foreground">LOT #{lotNumber}</span>
        </div>

        {/* Value badge - bottom right */}
        {product && (
          <div className="absolute bottom-3 right-3 px-4 py-2 rounded-xl bg-card/90 backdrop-blur-sm border-2 border-white shadow-sticker">
            <span className="font-display text-foreground">{formatCents(productValueCents)}</span>
          </div>
        )}
      </div>

      {/* Content - add bottom padding for fixed CTA + nav bar */}
      <div className="p-4 pb-44">
        {/* How it works */}
        <AnimatePresence>
          {showHowItWorks && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-4"
            >
              <div className="p-4 rounded-2xl bg-primary/10 border-2 border-primary/30 shadow-sticker">
                <h4 className="font-display text-primary mb-3">HOW LOTS WORK</h4>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p className="flex items-start gap-2">
                    <span className="text-primary font-bold">1.</span>
                    <span>Buy entries to join ({ECONOMY_MESSAGING.ENTRIES.perDollar}). More entries = higher chance to win.</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-primary font-bold">2.</span>
                    <span>Once the lot is fully funded, a random winner is drawn.</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-primary font-bold">3.</span>
                    <span>{ECONOMY_MESSAGING.WINNER.message.split('.')[0]}. {ECONOMY_MESSAGING.LOSER.message}</span>
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Countdown timer */}
        {room.deadline_at && !isSettled && !isExpired && (
          <CountdownTimer 
            deadline={room.deadline_at} 
            label={isFunded ? 'Draw In' : 'Funding Deadline'}
          />
        )}

        {/* Funding progress - show product value as target */}
        <FundingProgressBar
          currentCents={room.escrow_balance_cents}
          targetCents={productValueCents}
          productName={room.is_mystery ? 'Mystery Lot' : product?.name}
        />

        {/* Odds calculator - only if user has entered */}
        {user && (
          <OddsCalculator
            userEntries={userEntries}
            totalEntries={totalEntries}
            productValueCents={productValueCents}
            onBuyMore={canEnter ? () => setShowPurchaseModal(true) : undefined}
          />
        )}

        {/* Trivia Section - Boost Your Odds! */}
        {user && userEntries > 0 && product?.id && (room.status === 'OPEN' || room.status === 'FUNDED') && (
          <TriviaSection
            roomId={room.id}
            productClassId={product.id}
            className="mb-4"
          />
        )}

        {/* Participant list */}
        <ParticipantList
          participants={participants}
          totalEntries={totalEntries}
          currentUserId={user?.id}
          isLoading={isLoading}
        />

        {/* Non-winner options for expired lots */}
        {isExpired && userEntry && !isWinner && (
          <div className="rounded-2xl p-5 bg-warning/10 border-2 border-warning/40 shadow-sticker mb-4">
            <h4 className="font-display text-warning mb-2">LOT CLOSED</h4>
            <p className="text-sm text-muted-foreground mb-4">
              This lot didn't hit its target. You can request a 98% refund (2% platform fee).
            </p>
            <div className="flex gap-2">
              <button className="flex-1 py-3 rounded-xl bg-muted text-foreground text-sm font-bold hover:bg-muted/80 transition-colors border-2 border-border">
                Request Refund
              </button>
              <button className="flex-1 py-3 rounded-xl gradient-hype text-white text-sm font-bold hover:shadow-lg transition-all border-2 border-white shadow-sticker">
                Get Credits
              </button>
            </div>
          </div>
        )}

        {/* Winner celebration */}
        {isWinner && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="rounded-2xl p-6 bg-gradient-to-br from-hype-green/20 to-emerald-500/20 border-4 border-white shadow-sticker mb-4 text-center"
          >
            <div className="text-6xl mb-3">🎉</div>
            <h3 className="font-display text-2xl text-hype-green mb-2">YOU WON ALOT!</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Congratulations! You've won {product?.name || 'this prize'}.
            </p>
            <button className="px-8 py-4 rounded-2xl gradient-volt text-black font-display text-lg hover:shadow-lg transition-all border-4 border-white shadow-sticker">
              CLAIM YOUR PRIZE
            </button>
          </motion.div>
        )}
      </div>

      {/* Fixed bottom action - BIG tilted button */}
      {canEnter && (
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border/30">
          <motion.button
            onClick={handleBuyClick}
            className="w-full py-5 rounded-2xl gradient-hype text-white font-display text-xl hover:shadow-lg hover:shadow-primary/30 transition-all border-4 border-white shadow-sticker tilt-right-sm"
            whileHover={{ scale: 1.02, rotate: 0 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="flex items-center justify-center gap-3">
              <Layers className="w-6 h-6" strokeWidth={2.5} />
              {userEntries > 0 ? 'GET MORE ENTRIES' : 'GET IN ON THIS LOT'}
            </span>
          </motion.button>
        </div>
      )}

      {/* Trivia challenge modal - gate before purchase */}
      {product?.id && (
        <TriviaChallengeModal
          isOpen={showTriviaChallenge}
          onClose={() => setShowTriviaChallenge(false)}
          onSuccess={handleTriviaSuccess}
          roomId={room.id}
          productClassId={product.id}
        />
      )}

      {/* Purchase modal */}
      <EntryPurchaseModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        room={room}
        product={product}
        currentEntries={userEntries}
        totalEntries={totalEntries}
      />
    </div>
  );
});
