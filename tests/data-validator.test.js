import { describe, it, expect } from 'vitest';
import { validateEvent, validateEvents } from '../src/utils/data-validator.js';

describe('Data Validator', () => {
  describe('validateEvent', () => {
    const validEvent = {
      title: 'Test Event',
      date: '4th September 2025 at 7:30 pm',
      venue: 'Test Venue',
      link: 'https://example.com/event',
      dateUnix: 1757010600000
    };

    it('should validate a correct event', () => {
      const result = validateEvent(validEvent);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject events with missing title', () => {
      const event = { ...validEvent, title: '' };
      const result = validateEvent(event);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing or invalid title');
    });

    it('should reject events with null dateUnix', () => {
      const event = { ...validEvent, dateUnix: null };
      const result = validateEvent(event);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Date parsing failed for: "4th September 2025 at 7:30 pm"');
    });

    it('should reject events with dates too far in the past', () => {
      const event = { ...validEvent, dateUnix: new Date('2019-01-01').getTime() };
      const result = validateEvent(event);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Event date too far in past'))).toBe(true);
    });

    it('should reject events with dates too far in the future', () => {
      const event = { ...validEvent, dateUnix: new Date('2030-01-01').getTime() };
      const result = validateEvent(event);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Event date too far in future'))).toBe(true);
    });

    it('should reject events with invalid URLs', () => {
      const event = { ...validEvent, link: 'not-a-url' };
      const result = validateEvent(event);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid link URL');
    });

    it('should accept events without links', () => {
      const event = { ...validEvent };
      delete event.link;
      const result = validateEvent(event);
      expect(result.valid).toBe(true);
    });

    it('should trim whitespace from fields', () => {
      const event = {
        title: '  Test Event  ',
        date: '  4th September 2025 at 7:30 pm  ',
        venue: '  Test Venue  ',
        link: '  https://example.com/event  ',
        dateUnix: 1757010600000
      };
      const result = validateEvent(event);
      expect(result.valid).toBe(true);
      expect(result.event.title).toBe('Test Event');
      expect(result.event.date).toBe('4th September 2025 at 7:30 pm');
      expect(result.event.venue).toBe('Test Venue');
      expect(result.event.link).toBe('https://example.com/event');
    });
  });

  describe('validateEvents', () => {
    const validEvents = [
      {
        title: 'Event 1',
        date: '4th September 2025 at 7:30 pm',
        venue: 'Venue 1',
        link: 'https://example.com/event1',
        dateUnix: 1757010600000
      },
      {
        title: 'Event 2',
        date: '5th September 2025 at 8:00 pm',
        venue: 'Venue 2',
        link: 'https://example.com/event2',
        dateUnix: 1757095200000
      }
    ];

    const invalidEvents = [
      {
        title: '',
        date: 'invalid date',
        venue: 'Venue 1',
        dateUnix: null
      }
    ];

    it('should validate multiple valid events', () => {
      const result = validateEvents(validEvents);
      expect(result.stats.total).toBe(2);
      expect(result.stats.validCount).toBe(2);
      expect(result.stats.invalidCount).toBe(0);
      expect(result.valid).toHaveLength(2);
      expect(result.invalid).toHaveLength(0);
    });

    it('should handle mixed valid and invalid events', () => {
      const mixedEvents = [...validEvents, ...invalidEvents];
      const result = validateEvents(mixedEvents);
      expect(result.stats.total).toBe(3);
      expect(result.stats.validCount).toBe(2);
      expect(result.stats.invalidCount).toBe(1);
      expect(result.valid).toHaveLength(2);
      expect(result.invalid).toHaveLength(1);
    });

    it('should track error frequency', () => {
      const result = validateEvents(invalidEvents);
      expect(result.stats.errors['Missing or invalid title']).toBe(1);
      expect(result.stats.errors['Date parsing failed for: "invalid date"']).toBe(1);
    });
  });
});