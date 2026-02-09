/**
 * @fileoverview Settings components barrel export.
 * Internal use - external imports should use the main feature barrel.
 */

// ============= Layout =============
export { SettingsLayout } from './SettingsLayout';
export { SettingsSection } from './SettingsSection';

// ============= Sections =============
export {
  DocumentKYCSection,
  NotificationsSection,
  OthersSection,
  PersonalDataSection,
  SecuritySection,
  SupportSection,
} from './sections';

// ============= KYC =============
export { DocumentCard, DocumentUploader, VerificationStatus } from './kyc';

// ============= Notifications =============
export { MasterToggle, NotificationCategory } from './notifications';

// ============= Preferences =============
export { AppPreferences, LanguageSelector, ThemeToggle } from './preferences';

// ============= Profile =============
export { AvatarUploader, ProfileForm } from './profile';

// ============= Security =============
export { DeleteAccountDialog, SessionCard } from './security';

// ============= Support =============
export { ContactForm, FAQAccordion, HelpResources } from './support';
