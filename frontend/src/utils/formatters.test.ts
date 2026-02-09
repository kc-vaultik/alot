import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  formatCents,
  formatCurrency,
  formatCompactNumber,
  formatTimeRemaining,
  formatTimeRemainingSimple,
  formatLockTime,
  formatCountdown,
} from './formatters';

describe('formatters', () => {
  describe('formatCents', () => {
    it('formats cents to dollars', () => {
      expect(formatCents(1000)).toBe('$10');
      expect(formatCents(12345)).toBe('$123.45');
    });

    it('adds thousands separator', () => {
      expect(formatCents(100000)).toBe('$1,000');
      expect(formatCents(1234567)).toBe('$12,345.67');
    });

    it('handles zero', () => {
      expect(formatCents(0)).toBe('$0');
    });
  });

  describe('formatCurrency', () => {
    it('formats USD by default', () => {
      expect(formatCurrency(1000)).toBe('$1,000');
      expect(formatCurrency(0)).toBe('$0');
    });

    it('formats large numbers', () => {
      expect(formatCurrency(1234567)).toBe('$1,234,567');
    });

    it('rounds decimals', () => {
      expect(formatCurrency(1234.56)).toBe('$1,235');
    });
  });

  describe('formatCompactNumber', () => {
    it('returns number as-is for values under 1000', () => {
      expect(formatCompactNumber(0)).toBe('0');
      expect(formatCompactNumber(999)).toBe('999');
    });

    it('formats thousands with K', () => {
      expect(formatCompactNumber(1000)).toBe('1.0K');
      expect(formatCompactNumber(1500)).toBe('1.5K');
      expect(formatCompactNumber(999999)).toBe('1000.0K');
    });

    it('formats millions with M', () => {
      expect(formatCompactNumber(1000000)).toBe('1.0M');
      expect(formatCompactNumber(1500000)).toBe('1.5M');
    });

    it('formats billions with B', () => {
      expect(formatCompactNumber(1000000000)).toBe('1.0B');
      expect(formatCompactNumber(2500000000)).toBe('2.5B');
    });
  });

  describe('formatTimeRemaining', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns "Ended" for past dates', () => {
      const result = formatTimeRemaining('2024-01-15T11:00:00Z');
      expect(result.time).toBe('Ended');
      expect(result.isLockingSoon).toBe(false);
    });

    it('formats days and hours', () => {
      const result = formatTimeRemaining('2024-01-17T14:00:00Z');
      expect(result.time).toBe('2d 2h');
    });

    it('formats hours and minutes', () => {
      const result = formatTimeRemaining('2024-01-15T15:30:00Z');
      expect(result.time).toBe('3h 30m');
    });

    it('formats minutes and seconds', () => {
      const result = formatTimeRemaining('2024-01-15T12:05:30Z');
      expect(result.time).toBe('5m 30s');
    });

    it('formats seconds only', () => {
      const result = formatTimeRemaining('2024-01-15T12:00:45Z');
      expect(result.time).toBe('45s');
    });

    it('detects locking soon', () => {
      // Lock in 20 minutes, end in 2 hours
      const result = formatTimeRemaining(
        '2024-01-15T14:00:00Z',
        '2024-01-15T12:20:00Z'
      );
      expect(result.isLockingSoon).toBe(true);
    });

    it('does not flag locking soon if over 30 minutes', () => {
      const result = formatTimeRemaining(
        '2024-01-15T14:00:00Z',
        '2024-01-15T13:00:00Z'
      );
      expect(result.isLockingSoon).toBe(false);
    });
  });

  describe('formatTimeRemainingSimple', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns just the time string', () => {
      expect(formatTimeRemainingSimple('2024-01-15T15:30:00Z')).toBe('3h 30m');
    });
  });

  describe('formatCountdown', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns empty string for null', () => {
      expect(formatCountdown(null)).toBe('');
    });

    it('returns 00:00:00 for past dates', () => {
      expect(formatCountdown(new Date('2024-01-15T11:00:00Z'))).toBe('00:00:00');
    });

    it('formats with zero padding', () => {
      expect(formatCountdown(new Date('2024-01-15T13:05:09Z'))).toBe('01:05:09');
    });

    it('handles multi-hour countdowns', () => {
      expect(formatCountdown(new Date('2024-01-15T22:30:45Z'))).toBe('10:30:45');
    });
  });
});
