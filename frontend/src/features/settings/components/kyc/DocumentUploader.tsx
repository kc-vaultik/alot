import { memo, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Image, X, Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { DocumentType } from '../../hooks/useKYCDocuments';

interface DocumentUploaderProps {
  documentType: DocumentType;
  onUpload: (file: File) => Promise<void>;
  isUploading: boolean;
  disabled?: boolean;
}

const documentTypeConfig: Record<DocumentType, {
  title: string;
  description: string;
  acceptedFormats: string;
  icon: typeof FileText;
}> = {
  government_id: {
    title: 'Government ID',
    description: 'Passport, Driver\'s License, or National ID',
    acceptedFormats: 'JPG, PNG, or PDF',
    icon: FileText,
  },
  proof_of_address: {
    title: 'Proof of Address',
    description: 'Utility bill, Bank statement (within 3 months)',
    acceptedFormats: 'JPG, PNG, or PDF',
    icon: FileText,
  },
  selfie: {
    title: 'Selfie Verification',
    description: 'Clear photo of yourself holding your ID',
    acceptedFormats: 'JPG or PNG only',
    icon: Image,
  },
};

export const DocumentUploader = memo<DocumentUploaderProps>(({
  documentType,
  onUpload,
  isUploading,
  disabled,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const config = documentTypeConfig[documentType];
  const Icon = config.icon;

  const acceptedMimeTypes = documentType === 'selfie'
    ? 'image/jpeg,image/png,image/webp'
    : 'image/jpeg,image/png,image/webp,application/pdf';

  const handleFileSelect = (file: File) => {
    // Validate file type
    const allowedTypes = documentType === 'selfie'
      ? ['image/jpeg', 'image/png', 'image/webp']
      : ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    
    if (!allowedTypes.includes(file.type)) {
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return;
    }

    setSelectedFile(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    try {
      await onUpload(selectedFile);
      // Clear state on success
      setSelectedFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      // Error handled by parent
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 flex items-center justify-center">
          <Icon className="w-5 h-5 text-violet-400" />
        </div>
        <div>
          <h3 className="font-medium text-white">{config.title}</h3>
          <p className="text-white/40 text-xs">{config.description}</p>
        </div>
      </div>

      {/* Upload Area */}
      <AnimatePresence mode="wait">
        {!selectedFile ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => !disabled && fileInputRef.current?.click()}
            className={cn(
              'relative border-2 border-dashed rounded-xl p-8',
              'flex flex-col items-center justify-center gap-3',
              'transition-[border-color,background-color] duration-200 cursor-pointer',
              isDragOver
                ? 'border-violet-500 bg-violet-500/10'
                : 'border-white/10 hover:border-white/20 hover:bg-white/5',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
              <Upload className="w-6 h-6 text-white/50" />
            </div>
            <div className="text-center">
              <p className="text-white/70 text-sm">
                <span className="text-violet-400">Click to upload</span> or drag and drop
              </p>
              <p className="text-white/30 text-xs mt-1">
                {config.acceptedFormats} • Max 10MB
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative rounded-xl border border-white/10 overflow-hidden bg-zinc-900/50"
          >
            {/* Preview */}
            {previewUrl ? (
              <div className="aspect-video relative">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-contain bg-black/50"
                />
              </div>
            ) : (
              <div className="aspect-video flex items-center justify-center bg-zinc-800/50">
                <div className="text-center">
                  <FileText className="w-12 h-12 text-white/30 mx-auto mb-2" />
                  <p className="text-white/50 text-sm">{selectedFile.name}</p>
                </div>
              </div>
            )}

            {/* File Info Bar */}
            <div className="p-3 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-white/40 flex-shrink-0" />
                <span className="text-white/70 text-sm truncate">
                  {selectedFile.name}
                </span>
                <span className="text-white/30 text-xs flex-shrink-0">
                  ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={clearSelection}
                disabled={isUploading}
                className="text-white/40 hover:text-white flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Upload Button */}
            <div className="p-3 border-t border-white/5">
              <button
                onClick={handleUpload}
                disabled={isUploading || disabled}
                className={cn(
                  'w-full relative overflow-hidden group',
                  'px-4 py-2 rounded-md font-medium text-white',
                  'bg-gradient-to-r from-violet-600 to-purple-600',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'flex items-center justify-center'
                )}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-violet-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                <span className="relative z-10 flex items-center">
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Upload Document
                    </>
                  )}
                </span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedMimeTypes}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />
    </div>
  );
});

DocumentUploader.displayName = 'DocumentUploader';
