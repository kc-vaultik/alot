import { memo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Check, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

// Validation schema
const profileSchema = z.object({
  display_name: z
    .string()
    .min(1, 'Display name is required')
    .max(50, 'Display name must be less than 50 characters')
    .trim(),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .trim(),
  bio: z
    .string()
    .max(160, 'Bio must be less than 160 characters')
    .optional()
    .or(z.literal('')),
  is_public: z.boolean(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  initialData: {
    display_name?: string | null;
    username?: string | null;
    bio?: string | null;
    is_public?: boolean | null;
  };
  currentUserId?: string;
  onSubmit: (data: ProfileFormData) => void;
  isSubmitting: boolean;
}

export const ProfileForm = memo<ProfileFormProps>(({
  initialData,
  currentUserId,
  onSubmit,
  isSubmitting,
}) => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors, isDirty, isValid },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      display_name: initialData.display_name || '',
      username: initialData.username || '',
      bio: initialData.bio || '',
      is_public: initialData.is_public ?? true,
    },
    mode: 'onChange',
  });

  const isPublic = watch('is_public');
  const username = watch('username');

  // Username uniqueness check
  useEffect(() => {
    const checkUsername = async () => {
      if (!username || username.length < 3 || username === initialData.username) {
        return;
      }

      // Basic validation passed, check uniqueness
      const { data } = await supabase
        .from('collector_profiles')
        .select('user_id')
        .eq('username', username)
        .maybeSingle();

      if (data && data.user_id !== currentUserId) {
        setError('username', {
          type: 'manual',
          message: 'This username is already taken',
        });
      } else {
        // Clear manual error if it was set
        if (errors.username?.type === 'manual') {
          clearErrors('username');
        }
      }
    };

    const debounceTimer = setTimeout(checkUsername, 500);
    return () => clearTimeout(debounceTimer);
  }, [username, initialData.username, currentUserId, setError, clearErrors, errors.username?.type]);

  const handleFormSubmit = handleSubmit((data) => {
    onSubmit(data);
  });

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">
      {/* Display Name */}
      <div className="space-y-2">
        <Label htmlFor="display_name" className="text-white/70">
          Display Name
        </Label>
        <Input
          id="display_name"
          {...register('display_name')}
          placeholder="Your display name"
          className={cn(
            'bg-zinc-800/50 border-white/10 text-white placeholder:text-white/30',
            'focus:border-violet-500/50 focus:ring-violet-500/20',
            errors.display_name && 'border-red-500/50'
          )}
        />
        {errors.display_name && (
          <p className="text-red-400 text-xs flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.display_name.message}
          </p>
        )}
      </div>

      {/* Username */}
      <div className="space-y-2">
        <Label htmlFor="username" className="text-white/70">
          Username
        </Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">@</span>
          <Input
            id="username"
            {...register('username')}
            placeholder="username"
            className={cn(
              'pl-8 bg-zinc-800/50 border-white/10 text-white placeholder:text-white/30',
              'focus:border-violet-500/50 focus:ring-violet-500/20',
              errors.username && 'border-red-500/50'
            )}
          />
        </div>
        {errors.username ? (
          <p className="text-red-400 text-xs flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.username.message}
          </p>
        ) : (
          <p className="text-white/30 text-xs">
            Letters, numbers, and underscores only
          </p>
        )}
      </div>

      {/* Bio */}
      <div className="space-y-2">
        <Label htmlFor="bio" className="text-white/70">
          Bio
        </Label>
        <Textarea
          id="bio"
          {...register('bio')}
          placeholder="Tell others about yourself..."
          rows={3}
          className={cn(
            'bg-zinc-800/50 border-white/10 text-white placeholder:text-white/30',
            'focus:border-violet-500/50 focus:ring-violet-500/20 resize-none',
            errors.bio && 'border-red-500/50'
          )}
        />
        <div className="flex justify-between text-xs">
          {errors.bio ? (
            <p className="text-red-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.bio.message}
            </p>
          ) : (
            <span />
          )}
          <span className={cn(
            'text-white/30',
            (watch('bio')?.length || 0) > 160 && 'text-red-400'
          )}>
            {watch('bio')?.length || 0}/160
          </span>
        </div>
      </div>

      {/* Privacy Toggle */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-800/30 border border-white/5">
        <div>
          <Label htmlFor="is_public" className="text-white font-medium">
            Public Profile
          </Label>
          <p className="text-white/40 text-xs mt-1">
            {isPublic 
              ? 'Anyone can view your profile and collection' 
              : 'Only you can see your profile'}
          </p>
        </div>
        <Switch
          id="is_public"
          checked={isPublic}
          onCheckedChange={(checked) => setValue('is_public', checked, { shouldDirty: true })}
          className="data-[state=checked]:bg-violet-500"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting || !isDirty || !isValid}
        className={cn(
          'relative w-full h-12 rounded-lg overflow-hidden',
          'font-medium text-white',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        {/* Base gradient */}
        <span className="absolute inset-0 bg-gradient-to-r from-violet-600 to-purple-600" />
        {/* Hover overlay */}
        <span className="absolute inset-0 bg-gradient-to-r from-violet-500 to-purple-500 opacity-0 hover:opacity-100 transition-opacity duration-200" />
        {/* Content */}
        <span className="relative z-10 flex items-center justify-center">
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </span>
      </button>
    </form>
  );
});

ProfileForm.displayName = 'ProfileForm';
