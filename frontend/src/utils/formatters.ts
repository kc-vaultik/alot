/**
 * @fileoverview Shared formatting utilities across all features
 */

/**
 * Format cents to dollar string
 * @param cents - Amount in cents
 * @returns Formatted currency string (e.g., "$1,234")
 */
export function formatCents(cents: number): string {
  return `$${(cents / 100).toLocaleString()}`;
}

/**
 * Format currency value for display
 * @param value - Numeric value (in dollars)
 * @param currency - Currency code (default: USD)
 * @returns Formatted currency string
 */
export function formatCurrency(value: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format large numbers with K/M/B suffixes
 * @param value - Numeric value
 * @returns Formatted string with suffix
 */
export function formatCompactNumber(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toString();
}

/**
 * Format time remaining with optional lock status
 * @param endAt - ISO date string for end time
 * @param lockAt - Optional ISO date string for lock time
 * @returns Object with formatted time and lock status
 */
export function formatTimeRemaining(
  endAt: string,
  lockAt?: string
): { time: string; isLockingSoon: boolean } {
  const end = new Date(endAt).getTime();
  const lock = lockAt ? new Date(lockAt).getTime() : null;
  const now = Date.now();
  const diff = end - now;
  const lockDiff = lock ? lock - now : null;

  if (diff <= 0) return { time: 'Ended', isLockingSoon: false };

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  let time: string;
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    time = `${days}d ${hours % 24}h`;
  } else if (hours > 0) {
    time = `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    time = `${minutes}m ${seconds}s`;
  } else {
    time = `${seconds}s`;
  }

  // Check if locking within 30 minutes
  const isLockingSoon = lockDiff !== null && lockDiff > 0 && lockDiff < 30 * 60 * 1000;

  return { time, isLockingSoon };
}

/**
 * Format time remaining as simple string (convenience wrapper)
 * @param endAt - ISO date string for end time
 * @returns Formatted time string
 */
export function formatTimeRemainingSimple(endAt: string): string {
  return formatTimeRemaining(endAt).time;
}

/**
 * Format lock time for display
 * @param date - ISO date string
 * @returns Formatted date string (e.g., "Jan 15, 3:30 PM")
 */
export function formatLockTime(date: string): string {
  return new Date(date).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Format countdown time for timers
 * @param nextAvailable - Date when next action is available
 * @returns Formatted countdown string (HH:MM:SS)
 */
export function formatCountdown(nextAvailable: Date | null): string {
  if (!nextAvailable) return '';
  const now = new Date();
  const diff = nextAvailable.getTime() - now.getTime();
  if (diff <= 0) return '00:00:00';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
