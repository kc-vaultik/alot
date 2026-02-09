// App-wide Constants
// Centralized configuration values used across multiple features

export const APP_CONFIG = {
  NAME: 'Alot!',
  DEFAULT_STALE_TIME: 30_000,
} as const;

// Regex patterns
export const PATTERNS = {
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const;

// Routes
export const ROUTES = {
  HOME: '/',
  COLLECT_ROOM: '/collect-room',
  AUTH: '/auth',
  SETTINGS: '/settings',
} as const;

// Storage keys
export const STORAGE_KEYS = {
  AUTH_REDIRECT: 'auth_redirect_to',
} as const;

// Re-export messaging constants for convenience
export { ECONOMY_MESSAGING, formatStashCredits, formatVaultCredits } from './messaging';
