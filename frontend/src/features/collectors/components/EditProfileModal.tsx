import { memo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2, Eye, EyeOff } from 'lucide-react';
import { useMyProfile } from '../hooks/data';
import { cn } from '@/lib/utils';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditProfileModal = memo(function EditProfileModal({
  isOpen,
  onClose,
}: EditProfileModalProps) {
  const { profile, updateProfile, isUpdating } = useMyProfile();
  
  const [formData, setFormData] = useState({
    username: '',
    display_name: '',
    bio: '',
    is_public: true,
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        username: profile.username || '',
        display_name: profile.display_name || '',
        bio: profile.bio || '',
        is_public: profile.is_public ?? true,
      });
    }
  }, [profile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(formData);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-[10%] sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md z-50"
          >
            <div className="bg-zinc-950 border border-white/10 rounded-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/5">
                <h2 className="text-white font-light text-lg">Edit Profile</h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full border border-white/10 hover:bg-white/5 transition-all"
                >
                  <X className="w-4 h-4 text-white/60" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-4 space-y-4">
                {/* Username */}
                <div>
                  <label className="block text-white/60 text-xs font-light mb-1.5">Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50 font-light transition-all"
                    placeholder="username"
                    required
                    minLength={3}
                    maxLength={30}
                  />
                  <p className="text-white/40 text-xs font-light mt-1">3-30 characters, alphanumeric only</p>
                </div>

                {/* Display Name */}
                <div>
                  <label className="block text-white/60 text-xs font-light mb-1.5">Display Name</label>
                  <input
                    type="text"
                    value={formData.display_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50 font-light transition-all"
                    placeholder="Your Name"
                    maxLength={50}
                  />
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-white/60 text-xs font-light mb-1.5">Bio</label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50 resize-none font-light transition-all"
                    placeholder="Tell others about your collection..."
                    rows={3}
                    maxLength={160}
                  />
                  <p className="text-white/40 text-xs font-light mt-1">{formData.bio.length}/160</p>
                </div>

                {/* Privacy Toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-3">
                    {formData.is_public ? (
                      <Eye className="w-5 h-5 text-violet-400" />
                    ) : (
                      <EyeOff className="w-5 h-5 text-white/40" />
                    )}
                    <div>
                      <p className="text-white text-sm font-light">Public Profile</p>
                      <p className="text-white/50 text-xs font-light">
                        {formData.is_public ? 'Anyone can see your profile' : 'Only you can see your profile'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, is_public: !prev.is_public }))}
                    className={cn(
                      'w-12 h-7 rounded-full transition-all relative',
                      formData.is_public ? 'bg-gradient-to-r from-violet-500 to-purple-600' : 'bg-white/10'
                    )}
                  >
                    <div
                      className={cn(
                        'absolute top-1 w-5 h-5 rounded-full bg-white transition-transform',
                        formData.is_public ? 'left-6' : 'left-1'
                      )}
                    />
                  </button>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-light hover:from-violet-600 hover:to-purple-700 transition-all disabled:opacity-50"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span className="text-sm">Save Changes</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});
