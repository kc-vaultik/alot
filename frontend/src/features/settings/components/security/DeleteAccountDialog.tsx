import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Loader2, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface DeleteAccountDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  userEmail: string;
}

export const DeleteAccountDialog = memo<DeleteAccountDialogProps>(({
  isOpen,
  onClose,
  onConfirm,
  userEmail,
}) => {
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const expectedText = 'DELETE';
  const isConfirmValid = confirmText === expectedText;

  const handleConfirm = async () => {
    if (!isConfirmValid) return;
    
    setIsDeleting(true);
    setError(null);
    
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (isDeleting) return;
    setConfirmText('');
    setError(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md rounded-2xl bg-zinc-900 border border-red-500/20 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 pb-0">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-white">
                    Delete Account
                  </h2>
                  <p className="text-white/50 text-sm mt-1">
                    This action cannot be undone
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  disabled={isDeleting}
                  className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                <p className="text-red-400 text-sm">
                  <strong>Warning:</strong> Deleting your account will permanently remove:
                </p>
                <ul className="mt-2 space-y-1 text-white/60 text-sm list-disc list-inside">
                  <li>Your profile and all personal data</li>
                  <li>Your card collection and history</li>
                  <li>All pending transfers and swaps</li>
                  <li>Your room entries and rewards</li>
                </ul>
              </div>

              <div className="space-y-2">
                <Label className="text-white/70">
                  Account to be deleted
                </Label>
                <div className="p-3 rounded-lg bg-zinc-800/50 border border-white/10">
                  <p className="text-white font-medium">{userEmail}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-delete" className="text-white/70">
                  Type <span className="text-red-400 font-mono">DELETE</span> to confirm
                </Label>
                <Input
                  id="confirm-delete"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                  placeholder="DELETE"
                  disabled={isDeleting}
                  className={cn(
                    'bg-zinc-800/50 border-white/10 text-white placeholder:text-white/30',
                    'focus:border-red-500/50 focus:ring-red-500/20 font-mono'
                  )}
                />
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 pt-0 flex gap-3">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isDeleting}
                className="flex-1 border-white/10 text-white hover:bg-white/5"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={!isConfirmValid || isDeleting}
                className={cn(
                  'flex-1',
                  'bg-red-600 hover:bg-red-500',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Account
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

DeleteAccountDialog.displayName = 'DeleteAccountDialog';
