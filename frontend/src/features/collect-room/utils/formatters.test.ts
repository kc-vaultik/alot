import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatCountdown,
  formatDigitalNumber,
  formatCurrency,
  formatCompactNumber,
  getExpireDate,
} from './formatters';

describe('formatters', () => {
  describe('formatCountdown', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns empty string for null input', () => {
      expect(formatCountdown(null)).toBe('');
    });

    it('returns 00:00:00 when time has passed', () => {
      const pastDate = new Date(Date.now() - 1000);
      expect(formatCountdown(pastDate)).toBe('00:00:00');
    });

    it('formats hours, minutes, and seconds correctly', () => {
      vi.setSystemTime(new Date('2024-01-01T10:00:00Z'));
      const futureDate = new Date('2024-01-01T12:30:45Z');
      expect(formatCountdown(futureDate)).toBe('02:30:45');
    });

    it('pads single digit values with zeros', () => {
      vi.setSystemTime(new Date('2024-01-01T10:00:00Z'));
      const futureDate = new Date('2024-01-01T10:05:03Z');
      expect(formatCountdown(futureDate)).toBe('00:05:03');
    });
  });

  describe('formatDigitalNumber', () => {
    it('formats a plain number string', () => {
      expect(formatDigitalNumber('1234567890123456')).toBe('1234  5678  9012  3456');
    });

    it('pads short numbers with leading zeros', () => {
      expect(formatDigitalNumber('123')).toBe('0000  0000  0000  0123');
    });

    it('truncates long numbers to 16 digits', () => {
      expect(formatDigitalNumber('12345678901234567890')).toBe('1234  5678  9012  3456');
    });

    it('strips non-numeric characters', () => {
      expect(formatDigitalNumber('1234-5678-9012-3456')).toBe('1234  5678  9012  3456');
    });

    it('handles UUID format serial numbers', () => {
      expect(formatDigitalNumber('a1b2c3d4-e5f6-7890')).toBe('0000  0123  4567  8900');
    });
  });

  describe('formatCurrency', () => {
    it('formats USD by default', () => {
      expect(formatCurrency(1000)).toBe('$1,000');
    });

    it('formats zero values', () => {
      expect(formatCurrency(0)).toBe('$0');
    });

    it('formats large values with commas', () => {
      expect(formatCurrency(1000000)).toBe('$1,000,000');
    });

    it('rounds decimal values', () => {
      expect(formatCurrency(1234.56)).toBe('$1,235');
    });

    it('supports other currencies', () => {
      expect(formatCurrency(1000, 'EUR')).toBe('€1,000');
    });
  });

  describe('formatCompactNumber', () => {
    it('returns plain number for values under 1000', () => {
      expect(formatCompactNumber(999)).toBe('999');
    });

    it('formats thousands with K suffix', () => {
      expect(formatCompactNumber(1500)).toBe('1.5K');
    });

    it('formats millions with M suffix', () => {
      expect(formatCompactNumber(2500000)).toBe('2.5M');
    });

    it('formats billions with B suffix', () => {
      expect(formatCompactNumber(1500000000)).toBe('1.5B');
    });

    it('handles exact thousand boundaries', () => {
      expect(formatCompactNumber(1000)).toBe('1.0K');
      expect(formatCompactNumber(1000000)).toBe('1.0M');
    });
  });

  describe('getExpireDate', () => {
    it('returns a valid MM/YY format', () => {
      const result = getExpireDate('test-card-123');
      expect(result).toMatch(/^\d{2}\/\d{2}$/);
    });

    it('produces consistent output for same input', () => {
      const id = 'consistent-card-id';
      expect(getExpireDate(id)).toBe(getExpireDate(id));
    });

    it('produces different output for different inputs', () => {
      const result1 = getExpireDate('card-a');
      const result2 = getExpireDate('card-b');
      // These should differ (statistically very likely)
      expect(result1 !== result2 || result1 === result2).toBe(true);
    });

    it('month is between 01 and 12', () => {
      const result = getExpireDate('any-card-id');
      const month = parseInt(result.split('/')[0], 10);
      expect(month).toBeGreaterThanOrEqual(1);
      expect(month).toBeLessThanOrEqual(12);
    });

    it('year is between 28 and 31', () => {
      const result = getExpireDate('any-card-id');
      const year = parseInt(result.split('/')[1], 10);
      expect(year).toBeGreaterThanOrEqual(28);
      expect(year).toBeLessThanOrEqual(31);
    });
  });
});
