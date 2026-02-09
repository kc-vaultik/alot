import { memo, useState, useRef } from 'react';
import { Camera, Loader2, User, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AvatarUploaderProps {
  currentAvatarUrl?: string | null;
  onUploadComplete: (url: string) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-16 h-16',
  md: 'w-24 h-24',
  lg: 'w-32 h-32',
};

const iconSizes = {
  sm: 'w-6 h-6',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
};

export const AvatarUploader = memo<AvatarUploaderProps>(({
  currentAvatarUrl,
  onUploadComplete,
  size = 'lg',
  className,
}) => {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a JPG, PNG, WebP, or GIF image');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    // Show preview immediately
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    setIsUploading(true);
    try {
      // Generate unique file path
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${user.id}/avatar_${Date.now()}.${fileExt}`;

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { 
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Add cache-busting timestamp
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      
      onUploadComplete(publicUrl);
      toast.success('Avatar uploaded');
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast.error('Failed to upload avatar');
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const clearPreview = () => {
    setPreviewUrl(null);
  };

  const displayUrl = previewUrl || currentAvatarUrl;

  return (
    <div className={cn('relative inline-block', className)}>
      <button
        type="button"
        onClick={handleClick}
        disabled={isUploading}
        className={cn(
          'relative rounded-full overflow-hidden',
          'bg-gradient-to-br from-cyan-500/20 via-violet-500/20 to-purple-600/20',
          'border-2 border-white/10 hover:border-violet-500/50',
          'transition-[border-color] duration-200 group',
          sizeClasses[size],
          isUploading && 'opacity-70 cursor-not-allowed'
        )}
      >
        {displayUrl ? (
          <img
            src={displayUrl}
            alt="Avatar"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <User className={cn('text-white/50', iconSizes[size])} />
          </div>
        )}
        
        {/* Overlay */}
        <div className={cn(
          'absolute inset-0 flex items-center justify-center',
          'bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity',
          isUploading && 'opacity-100'
        )}>
          {isUploading ? (
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          ) : (
            <Camera className="w-6 h-6 text-white" />
          )}
        </div>
      </button>

      {/* Clear preview button */}
      {previewUrl && !isUploading && (
        <button
          type="button"
          onClick={clearPreview}
          className="absolute -top-1 -right-1 p-1 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Helper text */}
      <p className="text-white/30 text-xs text-center mt-2">
        Click to upload
      </p>
    </div>
  );
});

AvatarUploader.displayName = 'AvatarUploader';
