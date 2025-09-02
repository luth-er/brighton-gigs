/**
 * Data validation utilities for event data
 */

const validateEvent = (event, context = {}) => {
  const errors = [];
  const warnings = [];
  
  // Enhanced error context
  const errorContext = {
    venue: event.venue || context.venue || 'unknown',
    scraper: context.scraper || 'unknown',
    timestamp: new Date().toISOString(),
    originalData: { ...event }
  };
  
  // Required fields with detailed error messages
  if (!event.title || typeof event.title !== 'string' || event.title.trim().length === 0) {
    errors.push({
      type: 'missing_title',
      message: 'Missing or invalid title',
      field: 'title',
      value: event.title,
      context: errorContext
    });
  } else if (event.title.trim().length < 3) {
    warnings.push({
      type: 'short_title',
      message: 'Title is very short (less than 3 characters)',
      field: 'title',
      value: event.title,
      context: errorContext
    });
  }
  
  if (!event.date || typeof event.date !== 'string' || event.date.trim().length === 0) {
    errors.push({
      type: 'missing_date',
      message: 'Missing or invalid date string',
      field: 'date',
      value: event.date,
      context: errorContext
    });
  }
  
  if (!event.venue || typeof event.venue !== 'string' || event.venue.trim().length === 0) {
    errors.push({
      type: 'missing_venue',
      message: 'Missing or invalid venue',
      field: 'venue',
      value: event.venue,
      context: errorContext
    });
  }
  
  // Optional but validated if present
  if (event.link !== undefined && event.link !== null) {
    if (typeof event.link !== 'string') {
      errors.push({
        type: 'invalid_link_type',
        message: 'Link must be a string',
        field: 'link',
        value: event.link,
        context: errorContext
      });
    } else if (event.link.trim().length > 0 && !isValidUrl(event.link)) {
      errors.push({
        type: 'invalid_link_url',
        message: 'Invalid link URL format',
        field: 'link',
        value: event.link,
        context: errorContext
      });
    }
  }
  
  // Date parsing validation with enhanced context
  if (event.dateUnix === null) {
    errors.push({
      type: 'date_parsing_failed',
      message: `Date parsing failed for: "${event.date}"`,
      field: 'dateUnix',
      value: event.dateUnix,
      originalDate: event.date,
      context: errorContext
    });
  } else if (event.dateUnix !== undefined && event.dateUnix !== null) {
    if (typeof event.dateUnix !== 'number' || event.dateUnix < 0) {
      errors.push({
        type: 'invalid_dateunix_format',
        message: 'Invalid dateUnix format - must be positive number',
        field: 'dateUnix',
        value: event.dateUnix,
        context: errorContext
      });
    } else {
      // Check for obviously wrong dates (before 2020 or more than 2 years in future)
      const eventDate = new Date(event.dateUnix);
      const now = new Date();
      const twoYearsFromNow = new Date(now.getFullYear() + 2, now.getMonth(), now.getDate());
      const year2020 = new Date('2020-01-01');
      
      if (eventDate < year2020) {
        errors.push({
          type: 'date_too_old',
          message: `Event date too far in past: ${eventDate.toISOString()}`,
          field: 'dateUnix',
          value: event.dateUnix,
          eventDate: eventDate.toISOString(),
          context: errorContext
        });
      }
      
      if (eventDate > twoYearsFromNow) {
        errors.push({
          type: 'date_too_future',
          message: `Event date too far in future: ${eventDate.toISOString()}`,
          field: 'dateUnix',
          value: event.dateUnix,
          eventDate: eventDate.toISOString(),
          context: errorContext
        });
      }
      
      // Check if event is in the past (warning, not error)
      if (eventDate < now) {
        const daysPast = Math.floor((now - eventDate) / (1000 * 60 * 60 * 24));
        if (daysPast > 1) {
          warnings.push({
            type: 'past_event',
            message: `Event is ${daysPast} days in the past`,
            field: 'dateUnix',
            value: event.dateUnix,
            daysPast,
            context: errorContext
          });
        }
      }
    }
  }
  
  // Detect potential duplicates based on title similarity
  if (event.title && event.title.trim().length > 0) {
    const normalizedTitle = event.title.toLowerCase().trim();
    if (context.existingTitles) {
      const similarTitles = context.existingTitles.filter(existingTitle => {
        const similarity = calculateTitleSimilarity(normalizedTitle, existingTitle.toLowerCase());
        return similarity > 0.8 && normalizedTitle !== existingTitle.toLowerCase();
      });
      
      if (similarTitles.length > 0) {
        warnings.push({
          type: 'potential_duplicate',
          message: 'Event title similar to existing events',
          field: 'title',
          value: event.title,
          similarTitles,
          context: errorContext
        });
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    event: {
      ...event,
      title: event.title?.trim(),
      date: event.date?.trim(),
      venue: event.venue?.trim(),
      link: event.link?.trim()
    },
    context: errorContext
  };
};

const isValidUrl = (string) => {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

// Helper function to calculate title similarity using Levenshtein distance
const calculateTitleSimilarity = (str1, str2) => {
  const matrix = [];
  const len1 = str1.length;
  const len2 = str2.length;

  if (len1 === 0) return len2 === 0 ? 1 : 0;
  if (len2 === 0) return 0;

  // Initialize matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,     // deletion
        matrix[i][j - 1] + 1,     // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  const distance = matrix[len1][len2];
  return 1 - distance / Math.max(len1, len2);
};

const validateEvents = (events, context = {}) => {
  const results = {
    valid: [],
    invalid: [],
    warnings: [],
    stats: {
      total: events.length,
      validCount: 0,
      invalidCount: 0,
      warningCount: 0,
      errors: {},
      warningTypes: {},
      venue: context.venue || 'unknown',
      scraper: context.scraper || 'unknown'
    }
  };
  
  // Collect existing titles for duplicate detection
  const existingTitles = events.map(event => event.title).filter(Boolean);
  
  events.forEach((event, index) => {
    const validationContext = {
      ...context,
      existingTitles: existingTitles.slice(0, index), // Only check against previous events
      eventIndex: index
    };
    
    const validation = validateEvent(event, validationContext);
    
    if (validation.valid) {
      results.valid.push(validation.event);
      results.stats.validCount++;
    } else {
      results.invalid.push({
        index,
        event,
        errors: validation.errors,
        warnings: validation.warnings || [],
        context: validation.context
      });
      results.stats.invalidCount++;
      
      // Track error frequency with enhanced details
      validation.errors.forEach(error => {
        const errorKey = typeof error === 'string' ? error : error.type || error.message;
        results.stats.errors[errorKey] = (results.stats.errors[errorKey] || 0) + 1;
      });
    }
    
    // Track warnings separately (events can be valid but have warnings)
    if (validation.warnings && validation.warnings.length > 0) {
      results.warnings.push({
        index,
        event,
        warnings: validation.warnings,
        context: validation.context
      });
      results.stats.warningCount++;
      
      validation.warnings.forEach(warning => {
        const warningKey = warning.type || warning.message;
        results.stats.warningTypes[warningKey] = (results.stats.warningTypes[warningKey] || 0) + 1;
      });
    }
  });
  
  return results;
};

export { validateEvent, validateEvents };