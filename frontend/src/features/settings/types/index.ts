// Settings feature types

// Re-export from hooks for convenience
export type { UserNotificationSettings } from '../hooks/useUserSettings';
export type { KYCDocument, DocumentType, DocumentStatus, VerificationStatus } from '../hooks/useKYCDocuments';

export interface SettingsMenuItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  path: string;
}

export interface UserSession {
  id: string;
  user_id: string;
  device_info?: string;
  ip_address?: string;
  user_agent?: string;
  is_current: boolean;
  last_active_at: string;
  created_at: string;
}

export type SettingsSectionId = 
  | 'personal-data' 
  | 'documents' 
  | 'security' 
  | 'notifications' 
  | 'support' 
  | 'others';
