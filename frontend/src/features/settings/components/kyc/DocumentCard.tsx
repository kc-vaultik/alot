import { memo } from 'react';
import { FileText, CheckCircle, Clock, XCircle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { KYCDocument } from '../../hooks/useKYCDocuments';

interface DocumentCardProps {
  document: KYCDocument;
  onDelete?: (id: string) => void;
  isDeleting?: boolean;
}

const documentTypeLabels: Record<string, string> = {
  government_id: 'Government ID',
  proof_of_address: 'Proof of Address',
  selfie: 'Selfie Verification',
};

const statusConfig = {
  pending: {
    icon: Clock,
    label: 'Pending Review',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    iconColor: 'text-blue-400',
  },
  approved: {
    icon: CheckCircle,
    label: 'Approved',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20',
    iconColor: 'text-green-400',
  },
  rejected: {
    icon: XCircle,
    label: 'Rejected',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20',
    iconColor: 'text-red-400',
  },
};

export const DocumentCard = memo<DocumentCardProps>(({ document, onDelete, isDeleting }) => {
  const config = statusConfig[document.status];
  const StatusIcon = config.icon;
  const canDelete = document.status === 'pending';

  return (
    <div
      className={cn(
        'relative rounded-xl border p-4',
        'bg-zinc-900/50',
        config.borderColor
      )}
    >
      <div className="flex items-start gap-4">
        {/* Document Icon */}
        <div className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
          config.bgColor
        )}>
          <FileText className={cn('w-6 h-6', config.iconColor)} />
        </div>

        {/* Document Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-white truncate">
              {documentTypeLabels[document.document_type] || document.document_type}
            </h3>
            <div className={cn(
              'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs',
              config.bgColor
            )}>
              <StatusIcon className={cn('w-3 h-3', config.iconColor)} />
              <span className={config.iconColor}>{config.label}</span>
            </div>
          </div>
          
          <p className="text-white/40 text-sm truncate mb-2">
            {document.file_name}
          </p>

          <p className="text-white/30 text-xs">
            Uploaded {format(new Date(document.submitted_at), 'MMM d, yyyy')}
          </p>

          {/* Rejection Reason */}
          {document.status === 'rejected' && document.rejection_reason && (
            <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-red-400 text-sm">
                <span className="font-medium">Reason: </span>
                {document.rejection_reason}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {canDelete && onDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(document.id)}
              disabled={isDeleting}
              className="text-white/40 hover:text-red-400 hover:bg-red-500/10"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
});

DocumentCard.displayName = 'DocumentCard';
