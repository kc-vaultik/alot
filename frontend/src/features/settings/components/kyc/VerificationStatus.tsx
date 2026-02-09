import { memo } from 'react';
import { CheckCircle, Clock, XCircle, AlertTriangle, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { VerificationStatus as VerificationStatusType } from '../../hooks/useKYCDocuments';

interface VerificationStatusProps {
  status: VerificationStatusType;
  className?: string;
}

const statusConfig: Record<VerificationStatusType, {
  icon: typeof CheckCircle;
  label: string;
  description: string;
  bgColor: string;
  borderColor: string;
  iconColor: string;
  textColor: string;
}> = {
  not_started: {
    icon: Shield,
    label: 'Not Verified',
    description: 'Upload documents to verify your identity',
    bgColor: 'bg-zinc-500/10',
    borderColor: 'border-zinc-500/20',
    iconColor: 'text-zinc-400',
    textColor: 'text-zinc-400',
  },
  incomplete: {
    icon: AlertTriangle,
    label: 'Incomplete',
    description: 'Additional documents required',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
    iconColor: 'text-amber-400',
    textColor: 'text-amber-400',
  },
  pending: {
    icon: Clock,
    label: 'Pending Review',
    description: 'Your documents are being reviewed',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    iconColor: 'text-blue-400',
    textColor: 'text-blue-400',
  },
  verified: {
    icon: CheckCircle,
    label: 'Verified',
    description: 'Your identity has been verified',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20',
    iconColor: 'text-green-400',
    textColor: 'text-green-400',
  },
  rejected: {
    icon: XCircle,
    label: 'Rejected',
    description: 'Please re-upload your documents',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20',
    iconColor: 'text-red-400',
    textColor: 'text-red-400',
  },
};

export const VerificationStatus = memo<VerificationStatusProps>(({ status, className }) => {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className={cn(
      'flex items-center gap-4 p-4 rounded-xl border',
      config.bgColor,
      config.borderColor,
      className
    )}>
      <div className={cn(
        'w-12 h-12 rounded-full flex items-center justify-center',
        config.bgColor
      )}>
        <Icon className={cn('w-6 h-6', config.iconColor)} />
      </div>
      <div className="flex-1">
        <p className={cn('font-medium', config.textColor)}>
          {config.label}
        </p>
        <p className="text-white/50 text-sm">
          {config.description}
        </p>
      </div>
    </div>
  );
});

VerificationStatus.displayName = 'VerificationStatus';
