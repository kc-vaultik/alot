/**
 * @fileoverview Room Entry Reveal Flow
 * 
 * Unified reveal flow for room credit purchases using shared animation components.
 * Handles both mystery and non-mystery rooms with consistent UX.
 */

import { memo, useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { HelpCircle, Coins, Trophy } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { 
  CardEmergeAnimation, 
  CardRevealAnimation, 
  RevealSuccessScreen,
  type RevealAuraColors,
} from '@/components/shared/reveal';
import { ROOM_TIERS } from '../../constants';
import type { Room, RoomProduct, RoomTier } from '../../types';

type RevealPhase = 'emerge' | 'reveal' | 'success';

interface RoomEntryRevealFlowProps {
  room: Room;
  product: RoomProduct | null;
  creditsEarned: number;
  userTotalCredits: number;
  totalRoomCredits: number;
  redeemProgress?: {
    current: number;
    target: number;
  };
  onComplete: () => void;
}

/**
 * Get aura colors based on room tier
 */
function getAuraForTier(tier: RoomTier, isMystery: boolean): RevealAuraColors {
  if (isMystery) {
    return {
      primary: 'from-violet-500 to-purple-600',
      glow: 'bg-violet-500/30',
      particles: 'bg-violet-400',
      gradient: 'from-violet-500 to-purple-600',
      text: 'text-violet-400',
      glowColor: 'rgba(139, 92, 246, 0.5)',
    };
  }

  const tierColors: Record<RoomTier, RevealAuraColors> = {
    ICON: {
      primary: 'from-zinc-400 to-zinc-300',
      glow: 'bg-zinc-400/30',
      particles: 'bg-zinc-300',
      gradient: 'from-zinc-400 to-zinc-300',
      text: 'text-zinc-300',
      glowColor: 'rgba(161, 161, 170, 0.5)',
    },
    RARE: {
      primary: 'from-blue-500 to-cyan-400',
      glow: 'bg-blue-500/30',
      particles: 'bg-cyan-400',
      gradient: 'from-blue-500 to-cyan-400',
      text: 'text-cyan-400',
      glowColor: 'rgba(34, 211, 238, 0.5)',
    },
    GRAIL: {
      primary: 'from-violet-500 to-purple-400',
      glow: 'bg-violet-500/30',
      particles: 'bg-purple-400',
      gradient: 'from-violet-500 to-purple-400',
      text: 'text-violet-400',
      glowColor: 'rgba(139, 92, 246, 0.5)',
    },
    MYTHIC: {
      primary: 'from-amber-500 to-yellow-400',
      glow: 'bg-amber-500/30',
      particles: 'bg-amber-400',
      gradient: 'from-amber-500 to-yellow-400',
      text: 'text-amber-400',
      glowColor: 'rgba(251, 191, 36, 0.5)',
    },
  };

  return tierColors[tier] || tierColors.RARE;
}

/**
 * Map room tier to card reveal tier
 */
function mapTierToCardTier(tier: RoomTier): 'icon' | 'rare' | 'grail' | 'mythic' {
  return tier.toLowerCase() as 'icon' | 'rare' | 'grail' | 'mythic';
}

export const RoomEntryRevealFlow = memo(function RoomEntryRevealFlow({
  room,
  product,
  creditsEarned,
  userTotalCredits,
  totalRoomCredits,
  redeemProgress,
  onComplete,
}: RoomEntryRevealFlowProps) {
  const [phase, setPhase] = useState<RevealPhase>('emerge');
  
  const tierConfig = ROOM_TIERS[room.tier as RoomTier];
  const isMystery = room.is_mystery ?? false;
  const aura = getAuraForTier(room.tier as RoomTier, isMystery);

  const winChance = totalRoomCredits > 0 
    ? ((userTotalCredits / totalRoomCredits) * 100).toFixed(2) 
    : '0.00';

  const handleEmergeReveal = useCallback(() => {
    setPhase('reveal');
  }, []);

  const handleRevealComplete = useCallback(() => {
    setPhase('success');
  }, []);

  // Badge for the emerge animation
  const emergeBadge = isMystery ? (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-500/20 border border-violet-400/30">
      <HelpCircle className="w-3.5 h-3.5 text-violet-400" />
      <span className="text-xs font-medium text-violet-300">Mystery</span>
    </div>
  ) : tierConfig ? (
    <div className={`px-3 py-1.5 rounded-full ${tierConfig.bgColor} border ${tierConfig.borderColor}`}>
      <span className={`text-xs font-medium bg-gradient-to-r ${tierConfig.color} text-transparent bg-clip-text`}>
        {tierConfig.name}
      </span>
    </div>
  ) : null;

  // Center icon for emerge animation
  const emergeIcon = isMystery ? (
    <span className="text-5xl font-bold text-violet-300">?</span>
  ) : (
    <Coins className="w-12 h-12 text-white/70" />
  );

  // Calculate redeem progress percentage
  const redeemPercentage = redeemProgress 
    ? Math.min((redeemProgress.current / redeemProgress.target) * 100, 100)
    : 0;

  // Custom content for the reveal phase - show credits info
  const creditsInfoContent = (
    <div className="w-full max-w-sm bg-zinc-900/50 rounded-xl p-4 border border-white/10 mb-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Credits Added</p>
          <p className={`text-2xl font-bold ${aura.text}`}>+{creditsEarned}</p>
        </div>
        <div className="text-center">
          <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Your Total</p>
          <p className="text-2xl font-bold text-white">{userTotalCredits}</p>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-white/10 text-center">
        <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Win Chance</p>
        <p className={`text-lg font-semibold ${aura.text}`}>{winChance}%</p>
      </div>
      
      {/* Redeem Progress Bar */}
      {redeemProgress && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <div className="flex items-center justify-between mb-2">
            <p className="text-white/40 text-xs uppercase tracking-wider">Redeem Progress</p>
            <p className="text-xs text-white/60">
              {redeemProgress.current} / {redeemProgress.target}
            </p>
          </div>
          <div className="relative">
            <Progress 
              value={redeemPercentage} 
              className="h-2 bg-white/10"
            />
            <div 
              className={`absolute inset-0 h-2 rounded-full bg-gradient-to-r ${aura.gradient} opacity-80`}
              style={{ width: `${redeemPercentage}%` }}
            />
          </div>
          <p className="text-xs text-white/40 mt-1 text-center">
            {redeemPercentage >= 100 
              ? '✨ Ready to redeem!' 
              : `${(100 - redeemPercentage).toFixed(0)}% more to redeem`}
          </p>
        </div>
      )}
    </div>
  );

  return (
    <AnimatePresence mode="wait">
      {/* Phase 1: Card emerges face-down */}
      {phase === 'emerge' && (
        <CardEmergeAnimation
          key="emerge"
          onReveal={handleEmergeReveal}
          gradientColors={aura.gradient}
          borderGlow={aura.primary}
          glowColor={aura.glowColor}
          ambientBg={`bg-gradient-to-br ${aura.glow}`}
          centerIcon={emergeIcon}
          badge={emergeBadge}
          title={isMystery ? 'Mystery Room Entry!' : 'Your credits are ready...'}
          subtitle="Tap to reveal"
          hint={product?.name || 'See your entry'}
          productImageUrl={product?.image_url || null}
        />
      )}

      {/* Phase 2: Card flips to reveal */}
      {phase === 'reveal' && (
        <CardRevealAnimation
          key="reveal"
          productImageUrl={product?.image_url}
          productName={product?.name || 'Room Entry'}
          productBrand={product?.brand}
          productValue={product?.retail_value_usd}
          digitalNumber={`${creditsEarned} Credits Earned`}
          expireDate={`Total: ${userTotalCredits} credits`}
          tier={mapTierToCardTier(room.tier as RoomTier)}
          aura={aura}
          confettiCount={15}
          primaryButtonText="View Details"
          onPrimaryAction={handleRevealComplete}
          customContent={creditsInfoContent}
        />
      )}

      {/* Phase 3: Success screen with stats */}
      {phase === 'success' && (
        <RevealSuccessScreen
          key="success"
          icon="🪙"
          title={`${creditsEarned} Credits Added!`}
          subtitle={`Competing for ${product?.name || 'the prize'}`}
          stats={[
            { label: 'Your Credits', value: userTotalCredits, colorClass: aura.text },
            { label: 'Win Chance', value: `${winChance}%`, colorClass: aura.text },
          ]}
          progress={{
            value: parseFloat(winChance),
            colorClass: aura.gradient,
          }}
          infoText={`${totalRoomCredits} total credits in room`}
          primaryButtonText="Back to Room"
          onPrimaryAction={onComplete}
          ambientGlow={aura.primary}
          buttonGradient={aura.gradient}
        />
      )}
    </AnimatePresence>
  );
});
