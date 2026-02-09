import { memo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Settings,
  UserPlus,
  UserMinus,
  Gift,
  RefreshCw,
  Trophy,
  Swords,
  Package,
  Heart,
  Award,
  Sparkles,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useCollectorProfile, useCollectorCollection, useMyProfile } from '../hooks/data';
import { useCollectorConnections } from '../hooks/mutations';
import { CollectorScoreBadge } from './CollectorScoreBadge';
import { EditProfileModal } from './EditProfileModal';
import { PendingTransfersBadge } from './PendingTransfersBadge';
import { StatBox } from './shared';
import { CollectionModal, CardSelectionModal } from './modals';
import { useMyReveals } from '@/features/collect-room/hooks/data';
import { GiftSwapModal } from '@/features/collect-room/components/purchase/gift-swap';
import type { CollectCard } from '@/features/collect-room/types';
import { cn } from '@/lib/utils';

export const CollectorProfilePage = memo(function CollectorProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFullCollection, setShowFullCollection] = useState(false);
  const [giftSwapMode, setGiftSwapMode] = useState<'gift' | 'swap' | null>(null);
  const [selectedCardForTransfer, setSelectedCardForTransfer] = useState<CollectCard | null>(null);

  const { data: profile, isLoading, error } = useCollectorProfile(userId);
  const { data: collection } = useCollectorCollection(userId);
  const { follow, unfollow, isFollowing: isFollowLoading, isUnfollowing } = useCollectorConnections();
  const { profile: myProfile } = useMyProfile();
  const { data: myCards } = useMyReveals();

  const isOwnProfile = profile?.is_own_profile || myProfile?.user_id === userId;

  const handleFollow = () => {
    if (!userId) return;
    if (!isAuthenticated) {
      toast.error('Sign in to follow collectors');
      navigate('/');
      return;
    }
    if (profile?.is_following) {
      unfollow(userId);
    } else {
      follow(userId);
    }
  };

  const handleOpenGiftSwap = (mode: 'gift' | 'swap') => {
    if (!isAuthenticated) {
      toast.error('Sign in to gift or swap');
      navigate('/');
      return;
    }
    if (myCards && myCards.length > 0) {
      setGiftSwapMode(mode);
    }
  };

  const handleSelectCard = (card: CollectCard) => {
    setSelectedCardForTransfer(card);
  };

  const handleCloseGiftSwap = () => {
    setGiftSwapMode(null);
    setSelectedCardForTransfer(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
        <p className="text-white/60 mb-4">Profile not found</p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 rounded-lg bg-violet-500/20 text-violet-400"
        >
          Go Back
        </button>
      </div>
    );
  }

  const profileDisplayName = profile.display_name || profile.username;

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-zinc-950/95 backdrop-blur-md border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 text-white/60 hover:bg-white/5 hover:text-white transition-all text-sm font-light"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>
          
          <h1 className="text-white font-light text-sm">Profile</h1>
          
          {isOwnProfile ? (
            <button
              onClick={() => setShowEditModal(true)}
              className="p-2 rounded-full border border-white/10 text-white/60 hover:bg-white/5 hover:text-white transition-all"
            >
              <Settings className="w-4 h-4" />
            </button>
          ) : (
            <div className="w-9" />
          )}
        </div>
      </div>

      {/* Profile Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto px-4 py-6"
      >
        {/* Avatar & Basic Info */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-600/20 flex items-center justify-center overflow-hidden border border-white/10">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white/80 font-light text-3xl">
                  {profileDisplayName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="absolute -bottom-2 -right-2">
              <CollectorScoreBadge score={profile.score} size="md" showLabel />
            </div>
          </div>

          <h2 className="text-white font-light text-xl mb-1">{profileDisplayName}</h2>
          <p className="text-white/50 text-sm font-light mb-2">@{profile.username}</p>
          
          {profile.bio && (
            <p className="text-white/60 text-sm font-light max-w-sm">{profile.bio}</p>
          )}

          {/* Follower Stats */}
          <div className="flex gap-6 mt-4">
            <div className="text-center">
              <p className="text-white font-light">{profile.follower_count}</p>
              <p className="text-white/50 text-xs font-light">Followers</p>
            </div>
            <div className="text-center">
              <p className="text-white font-light">{profile.following_count}</p>
              <p className="text-white/50 text-xs font-light">Following</p>
            </div>
          </div>

          {/* Action Buttons */}
          {!isOwnProfile && (
            <div className="flex gap-2 sm:gap-3 mt-6">
              <button
                onClick={handleFollow}
                disabled={!isAuthenticated || isFollowLoading || isUnfollowing}
                className={cn(
                  'flex items-center gap-2 px-5 py-2 rounded-full font-light transition-all border',
                  !isAuthenticated
                    ? 'bg-white/5 border-white/10 text-white/40 cursor-not-allowed'
                    : profile.is_following
                      ? 'bg-white/5 border-white/10 text-white/70 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400'
                      : 'bg-gradient-to-r from-violet-500 to-purple-600 border-transparent text-white hover:from-violet-600 hover:to-purple-700'
                )}
              >
                {!isAuthenticated ? (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span className="text-sm">Sign in to follow</span>
                  </>
                ) : profile.is_following ? (
                  <>
                    <UserMinus className="w-4 h-4" />
                    <span className="text-sm">Unfollow</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span className="text-sm">Follow</span>
                  </>
                )}
              </button>

              <button
                onClick={() => handleOpenGiftSwap('gift')}
                disabled={!isAuthenticated}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-full transition-all border',
                  !isAuthenticated
                    ? 'bg-white/5 border-white/10 text-white/30 cursor-not-allowed'
                    : 'bg-pink-500/10 border-pink-500/30 text-pink-400 hover:bg-pink-500/20'
                )}
                title={isAuthenticated ? 'Gift a card' : 'Sign in to gift'}
              >
                <Gift className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleOpenGiftSwap('swap')}
                disabled={!isAuthenticated}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-full transition-all border',
                  !isAuthenticated
                    ? 'bg-white/5 border-white/10 text-white/30 cursor-not-allowed'
                    : 'bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20'
                )}
                title={isAuthenticated ? 'Offer a swap' : 'Sign in to swap'}
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Pending Transfers Notification */}
          {!isOwnProfile && isAuthenticated && userId && (
            <div className="mt-4">
              <PendingTransfersBadge collectorUserId={userId} variant="detailed" />
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6">
          <StatBox icon={<Package className="w-5 h-5" />} label="Cards" value={profile.stats.card_count} />
          <StatBox icon={<Swords className="w-5 h-5" />} label="Battles" value={`${profile.stats.battles_won}W/${profile.stats.battles_lost}L`} />
          <StatBox icon={<RefreshCw className="w-5 h-5" />} label="Swaps" value={profile.stats.swaps_completed} />
          <StatBox icon={<Heart className="w-5 h-5" />} label="Gifts" value={profile.stats.gifts_given} />
          <StatBox icon={<Award className="w-5 h-5" />} label="Redeemed" value={profile.stats.redemptions} />
          <StatBox icon={<Trophy className="w-5 h-5" />} label="Value" value={`$${Math.round(profile.stats.collection_value).toLocaleString()}`} />
        </div>

        {/* Collection Preview */}
        {collection && collection.cards.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-light flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-400/80" />
                Collection ({collection.card_count} cards)
              </h3>
              <button
                onClick={() => setShowFullCollection(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 text-white/60 hover:bg-white/5 hover:text-white transition-all text-xs font-light"
              >
                <Eye className="w-3.5 h-3.5" />
                View All
              </button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {collection.cards.slice(0, 8).map((card) => (
                <div
                  key={card.id}
                  className="aspect-square rounded-xl bg-white/5 border border-white/5 overflow-hidden hover:border-white/10 transition-all"
                >
                  {card.product.image_url ? (
                    <img src={card.product.image_url} alt={card.product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/30 text-xs font-light">
                      {card.product.name.charAt(0)}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {collection.cards.length > 8 && (
              <p className="text-white/40 text-sm text-center mt-2">+{collection.cards.length - 8} more cards</p>
            )}
          </div>
        )}
      </motion.div>

      {/* Modals */}
      {isOwnProfile && <EditProfileModal isOpen={showEditModal} onClose={() => setShowEditModal(false)} />}

      <AnimatePresence>
        {showFullCollection && collection && (
          <CollectionModal
            collection={collection}
            profileName={profileDisplayName}
            onClose={() => setShowFullCollection(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {giftSwapMode && !selectedCardForTransfer && (
          <CardSelectionModal
            mode={giftSwapMode}
            recipientName={profileDisplayName}
            cards={myCards || []}
            onSelectCard={handleSelectCard}
            onClose={handleCloseGiftSwap}
          />
        )}
      </AnimatePresence>

      {selectedCardForTransfer && giftSwapMode && profile && (
        <GiftSwapModal
          card={selectedCardForTransfer}
          mode={giftSwapMode}
          onClose={handleCloseGiftSwap}
          onConfirm={handleCloseGiftSwap}
          preselectedCollector={{
            user_id: profile.user_id,
            username: profile.username,
            display_name: profile.display_name,
          }}
        />
      )}
    </div>
  );
});
