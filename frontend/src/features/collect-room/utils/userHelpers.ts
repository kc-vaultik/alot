/**
 * @fileoverview User-related helper utilities
 */

/**
 * Get display name for a user
 * @param user - User object from auth context
 * @returns User display name or fallback 'Collector'
 */
export function getUserDisplayName(user: { 
  user_metadata?: { full_name?: string }; 
  email?: string | null;
} | null): string {
  if (!user) return 'Collector';
  return user.user_metadata?.full_name || user.email?.split('@')[0] || 'Collector';
}

/**
 * Get initials from a display name
 * @param name - Full name or display name
 * @returns Up to 2 character initials
 */
export function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Mask email for privacy display
 * @param email - Full email address
 * @returns Masked email (e.g., "j***@gmail.com")
 */
export function maskEmail(email: string | null | undefined): string {
  if (!email) return '';
  const [local, domain] = email.split('@');
  if (!domain) return email;
  if (local.length <= 1) return `${local}***@${domain}`;
  return `${local[0]}***@${domain}`;
}
