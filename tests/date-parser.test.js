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

  describe('DD/MM/YY HH:MMam/pm formats', () => {
    it('should parse basic DD/MM/YY format with PM time', () => {
      const result = toUnixTimestamp('05/09/25 7:30pm');
      const expected = new Date(2025, 8, 5, 19, 30, 0, 0).getTime(); // Sept 5, 2025 7:30 PM
      expect(result).toBe(expected);
    });

    it('should parse DD/MM/YY format with AM time', () => {
      const result = toUnixTimestamp('15/12/24 11:45am');
      const expected = new Date(2024, 11, 15, 11, 45, 0, 0).getTime(); // Dec 15, 2024 11:45 AM
      expect(result).toBe(expected);
    });

    it('should handle 12 PM (noon)', () => {
      const result = toUnixTimestamp('01/01/25 12:00pm');
      const expected = new Date(2025, 0, 1, 12, 0, 0, 0).getTime(); // Jan 1, 2025 12:00 PM
      expect(result).toBe(expected);
    });

    it('should handle 12 AM (midnight)', () => {
      const result = toUnixTimestamp('01/01/25 12:00am');
      const expected = new Date(2025, 0, 1, 0, 0, 0, 0).getTime(); // Jan 1, 2025 12:00 AM
      expect(result).toBe(expected);
    });

    it('should handle single digit day and month', () => {
      const result = toUnixTimestamp('1/3/25 9:15pm');
      const expected = new Date(2025, 2, 1, 21, 15, 0, 0).getTime(); // Mar 1, 2025 9:15 PM
      expect(result).toBe(expected);
    });

    it('should handle case insensitive meridiem', () => {
      const result1 = toUnixTimestamp('05/09/25 7:30PM');
      const result2 = toUnixTimestamp('05/09/25 7:30Am');
      const expected1 = new Date(2025, 8, 5, 19, 30, 0, 0).getTime();
      const expected2 = new Date(2025, 8, 5, 7, 30, 0, 0).getTime();
      expect(result1).toBe(expected1);
      expect(result2).toBe(expected2);
    });

    it('should handle leap year correctly', () => {
      const result = toUnixTimestamp('29/02/24 3:45pm'); // 2024 is a leap year
      const expected = new Date(2024, 1, 29, 15, 45, 0, 0).getTime();
      expect(result).toBe(expected);
    });

    it('should reject invalid dates gracefully', () => {
      // These should not match the pattern and fall through to error
      expect(() => toUnixTimestamp('32/01/25 7:30pm')).toThrow('Invalid date format'); // Invalid day
      expect(() => toUnixTimestamp('15/13/25 7:30pm')).toThrow('Invalid date format'); // Invalid month
      expect(() => toUnixTimestamp('29/02/25 7:30pm')).toThrow('Invalid date format'); // Invalid leap year date
      expect(() => toUnixTimestamp('31/04/25 7:30pm')).toThrow('Invalid date format'); // April only has 30 days
    });

    it('should handle edge cases with spacing', () => {
      const result1 = toUnixTimestamp('05/09/25  7:30pm'); // Extra space
      const result2 = toUnixTimestamp('05/09/25 7:30 pm'); // Space before meridiem
      const expected = new Date(2025, 8, 5, 19, 30, 0, 0).getTime();
      expect(result1).toBe(expected);
      expect(result2).toBe(expected);
    });

    it('should reject formats that do not match exactly', () => {
      // These should not match our specific pattern
      expect(() => toUnixTimestamp('05-09-25 7:30pm')).toThrow('Invalid date format'); // Wrong separators
      expect(() => toUnixTimestamp('05/09/2025 7:30pm')).toThrow('Invalid date format'); // 4-digit year
      expect(() => toUnixTimestamp('05/09/25 7pm')).toThrow('Invalid date format'); // Missing minutes
      expect(() => toUnixTimestamp('5/9/25 25:30pm')).toThrow('Invalid date format'); // Invalid hour
    });
  });
});