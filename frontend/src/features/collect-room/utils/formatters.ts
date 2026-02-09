/**
 * @fileoverview Formatting utilities for Collect Room
 * Re-exports shared formatters and adds feature-specific utilities
 */

// Re-export shared formatters
export {
  formatCurrency,
  formatCompactNumber,
  formatCountdown,
} from '@/utils/formatters';

/**
 * Format serial number as digital display number
 * @param serialNumber - Raw serial number string
 * @returns Formatted 16-digit display string with spacing
 */
export function formatDigitalNumber(serialNumber: string): string {
  const numbers = serialNumber.replace(/\D/g, '').padStart(16, '0').slice(0, 16);
  return `${numbers.slice(0, 4)}  ${numbers.slice(4, 8)}  ${numbers.slice(8, 12)}  ${numbers.slice(12, 16)}`;
}

/**
 * Generate expire date based on card id
 * @param cardId - Card identifier
 * @returns Formatted expire date (MM/YY)
 */
export function getExpireDate(cardId: string): string {
  const hash = cardId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const month = (hash % 12) + 1;
  const year = 28 + (hash % 4);
  return `${month.toString().padStart(2, '0')}/${year}`;
}
