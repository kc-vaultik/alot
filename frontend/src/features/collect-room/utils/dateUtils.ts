/**
 * @fileoverview Date manipulation utilities for the Collect Room feature.
 * @module features/collect-room/utils/dateUtils
 */

/**
 * Returns the next midnight (00:00:00) in local time.
 * Useful for calculating time until daily reset.
 * 
 * @returns Date object set to tomorrow at 00:00:00 local time
 * 
 * @example
 * const nextReset = getNextMidnight();
 * const msUntilReset = nextReset.getTime() - Date.now();
 */
export function getNextMidnight(): Date {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow;
}

/**
 * Returns today's date in ISO format (YYYY-MM-DD).
 * Useful for date-based keys and comparisons.
 * 
 * @returns Date string in YYYY-MM-DD format
 * 
 * @example
 * const today = getTodayISODate(); // "2024-01-15"
 */
export function getTodayISODate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Creates a promise that resolves after the specified milliseconds.
 * Useful for adding delays in async flows.
 * 
 * @param ms - Number of milliseconds to wait
 * @returns Promise that resolves after the delay
 * 
 * @example
 * await sleep(1000); // Wait 1 second
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
