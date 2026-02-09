/**
 * @fileoverview Settings feature public exports.
 * External features should import from here.
 */

// ============= Components =============
export {
  // Layout
  SettingsLayout,
  SettingsSection,
  // Sections
  DocumentKYCSection,
  NotificationsSection,
  OthersSection,
  PersonalDataSection,
  SecuritySection,
  SupportSection,
  // KYC
  DocumentCard,
  DocumentUploader,
  VerificationStatus,
  // Notifications
  MasterToggle,
  NotificationCategory,
  // Preferences
  AppPreferences,
  LanguageSelector,
  ThemeToggle,
  // Profile
  AvatarUploader,
  ProfileForm,
  // Security
  DeleteAccountDialog,
  SessionCard,
  // Support
  ContactForm,
  FAQAccordion,
  HelpResources,
} from './components';

// Hooks
export { useUserSettings } from './hooks/useUserSettings';
export { useKYCDocuments } from './hooks/useKYCDocuments';

// Types
export type { 
  SettingsMenuItem,
  UserSession,
  SettingsSectionId,
} from './types';

export type {
  UserNotificationSettings,
} from './hooks/useUserSettings';

export type {
  KYCDocument,
  DocumentType,
  DocumentStatus,
  VerificationStatus as VerificationStatusType,
} from './hooks/useKYCDocuments';
