import { describe, it, expect } from 'vitest';
import toUnixTimestamp from '../src/utils/date-parser.js';

describe('Date Parser', () => {
  describe('Hope & Ruin formats', () => {
    it('should parse ordinal dates with "at" connector', () => {
      const result = toUnixTimestamp('4th September 2025 at 7:30 pm');
      expect(result).toBe(1757010600000); // Sept 4, 2025 7:30 PM
    });

    it('should parse ordinal dates with dash connector', () => {
      const result = toUnixTimestamp('31st October 2024 - 7:30 pm');
      const expected = new Date(2024, 9, 31, 19, 30, 0, 0).getTime();
      expect(result).toBe(expected);
    });
  });

  describe('Weekday formats', () => {
    it('should parse Green Door Store format', () => {
      const result = toUnixTimestamp('Tue, 2 Sep 2025');
      expect(result).toBe(1756767600000); // Sept 2, 2025 start of day
    });

    it('should parse weekday with time', () => {
      const result = toUnixTimestamp('Fri 14 Mar - 7:00pm');
      const currentYear = new Date().getFullYear();
      const expected = new Date(currentYear, 2, 14, 19, 0, 0, 0).getTime();
      expect(result).toBe(expected);
    });
  });

  describe('GigSeekr formats', () => {
    it('should parse uppercase month format', () => {
      const result = toUnixTimestamp('04 SEP 2025');
      expect(result).toBe(1756940400000); // Sept 4, 2025
    });

    it('should parse simple date format', () => {
      const result = toUnixTimestamp('12 Nov 2024');
      const expected = new Date(2024, 10, 12, 0, 0, 0, 0).getTime();
      expect(result).toBe(expected);
    });
  });

  describe('Pipeline/WeGotTickets formats', () => {
    it('should parse full weekday format', () => {
      const result = toUnixTimestamp('Saturday 6th September, 2025');
      expect(result).toBe(1757113200000); // Sept 6, 2025
    });

    it('should parse Tuesday format', () => {
      const result = toUnixTimestamp('Tuesday 16th September, 2025');
      expect(result).toBe(1757977200000); // Sept 16, 2025
    });
  });

  describe('Error handling', () => {
    it('should throw error for invalid formats', () => {
      expect(() => toUnixTimestamp('invalid date')).toThrow('Invalid date format');
    });

    it('should throw error for empty strings', () => {
      expect(() => toUnixTimestamp('')).toThrow('Invalid date format');
    });

    it('should throw error for null input', () => {
      expect(() => toUnixTimestamp(null)).toThrow('Invalid date format');
    });
  });

  describe('Numeric inputs', () => {
    it('should handle Unix timestamps in seconds', () => {
      const result = toUnixTimestamp(1609459200); // Jan 1, 2021
      expect(result).toBe(1609459200000);
    });

    it('should handle Unix timestamps in milliseconds', () => {
      const result = toUnixTimestamp(1609459200000);
      expect(result).toBe(1609459200000);
    });
  });

  describe('Date objects', () => {
    it('should handle Date objects', () => {
      const date = new Date(2025, 8, 4); // Sept 4, 2025
      const result = toUnixTimestamp(date);
      expect(result).toBe(date.getTime());
    });
  });

  describe('Standard formats', () => {
    it('should handle ISO date strings', () => {
      const isoString = '2025-09-04T19:30:00.000Z';
      const result = toUnixTimestamp(isoString);
      const expected = new Date(isoString).getTime();
      expect(result).toBe(expected);
    });
  });
});