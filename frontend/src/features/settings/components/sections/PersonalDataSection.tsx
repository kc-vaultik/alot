import { useState } from 'react';
import { User, Plus } from 'lucide-react';
import { SettingsLayout } from '../SettingsLayout';
import { SettingsSection } from '../SettingsSection';
import { AvatarUploader } from '../profile/AvatarUploader';
import { ProfileForm } from '../profile/ProfileForm';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMyProfile } from '@/features/collectors';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export const PersonalDataSection = () => {
  const { user } = useAuth();
  const { profile, isLoading, updateProfile, isUpdating, createProfile, isCreating } = useMyProfile();
  const [newUsername, setNewUsername] = useState('');

  const handleAvatarUpload = (url: string) => {
    updateProfile({ avatar_url: url });
  };

  const handleProfileUpdate = (data: {
    display_name: string;
    username: string;
    bio?: string;
    is_public: boolean;
  }) => {
    updateProfile({
      display_name: data.display_name,
      username: data.username,
      bio: data.bio || null,
      is_public: data.is_public,
    });
  };

  const handleCreateProfile = () => {
    if (newUsername.length >= 3) {
      createProfile({ 
        username: newUsername,
        display_name: newUsername,
      });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <SettingsLayout title="Personal Data">
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </SettingsLayout>
    );
  }

  // No profile - show creation flow
  if (!profile) {
    return (
      <SettingsLayout title="Personal Data">
        <SettingsSection
          title="Create Your Profile"
          description="Set up your collector profile to start trading and connecting"
        >
          <div className="space-y-6">
            <div className="flex flex-col items-center py-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500/20 via-violet-500/20 to-purple-600/20 flex items-center justify-center border border-white/10 mb-4">
                <User className="w-10 h-10 text-white/50" />
              </div>
              <p className="text-white/60 text-sm text-center">
                You don't have a profile yet. Create one to get started!
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-username" className="text-white/70">
                  Choose a username
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">@</span>
                  <Input
                    id="new-username"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="username"
                    className="pl-8 bg-zinc-800/50 border-white/10 text-white placeholder:text-white/30"
                    maxLength={30}
                  />
                </div>
                <p className="text-white/30 text-xs">
                  Min 3 characters. Letters, numbers, and underscores only.
                </p>
              </div>

              <button
                onClick={handleCreateProfile}
                disabled={newUsername.length < 3 || isCreating}
                className={cn(
                  'relative w-full h-12 rounded-lg overflow-hidden',
                  'font-medium text-white',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {/* Base gradient */}
                <span className="absolute inset-0 bg-gradient-to-r from-violet-600 to-purple-600" />
                {/* Hover overlay - opacity transition instead of gradient change */}
                <span className="absolute inset-0 bg-gradient-to-r from-violet-500 to-purple-500 opacity-0 hover:opacity-100 transition-opacity duration-200" />
                {/* Content */}
                <span className="relative z-10 flex items-center justify-center">
                  {isCreating ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Profile
                    </>
                  )}
                </span>
              </button>
            </div>
          </div>
        </SettingsSection>
      </SettingsLayout>
    );
  }

  // Has profile - show edit form
  return (
    <SettingsLayout title="Personal Data">
      <div className="space-y-6">
        {/* Avatar Section */}
        <SettingsSection
          title="Profile Picture"
          description="Upload a photo to personalize your profile"
        >
          <div className="flex flex-col items-center py-4">
            <AvatarUploader
              currentAvatarUrl={profile.avatar_url}
              onUploadComplete={handleAvatarUpload}
              size="lg"
            />
          </div>
        </SettingsSection>

        {/* Profile Details Section */}
        <SettingsSection
          title="Profile Details"
          description="Update your public profile information"
        >
          <ProfileForm
            initialData={{
              display_name: profile.display_name,
              username: profile.username,
              bio: profile.bio,
              is_public: profile.is_public,
            }}
            currentUserId={user?.id}
            onSubmit={handleProfileUpdate}
            isSubmitting={isUpdating}
          />
        </SettingsSection>

        {/* Account Info (Read-only) */}
        <SettingsSection
          title="Account Information"
          description="This information cannot be changed"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-800/30 border border-white/5">
              <div>
                <p className="text-white/50 text-xs">Email Address</p>
                <p className="text-white font-medium">{user?.email}</p>
              </div>
              <div className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                <span className="text-green-400 text-xs">Verified</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-800/30 border border-white/5">
              <div>
                <p className="text-white/50 text-xs">Member Since</p>
                <p className="text-white font-medium">
                  {profile.created_at 
                    ? new Date(profile.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'Unknown'}
                </p>
              </div>
            </div>
          </div>
        </SettingsSection>
      </div>
    </SettingsLayout>
  );
};
