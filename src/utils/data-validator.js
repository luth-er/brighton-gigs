/**
 * Data validation utilities for event data
 */

const validateEvent = (event) => {
  const errors = [];
  
  // Required fields
  if (!event.title || typeof event.title !== 'string' || event.title.trim().length === 0) {
    errors.push('Missing or invalid title');
  }
  
  if (!event.date || typeof event.date !== 'string' || event.date.trim().length === 0) {
    errors.push('Missing or invalid date string');
  }
  
  if (!event.venue || typeof event.venue !== 'string' || event.venue.trim().length === 0) {
    errors.push('Missing or invalid venue');
  }
  
  // Optional but validated if present
  if (event.link !== undefined && event.link !== null) {
    if (typeof event.link !== 'string' || !isValidUrl(event.link)) {
      errors.push('Invalid link URL');
    }
  }
  
  // Date parsing validation
  if (event.dateUnix === null) {
    errors.push(`Date parsing failed for: "${event.date}"`);
  } else if (event.dateUnix !== undefined && event.dateUnix !== null) {
    if (typeof event.dateUnix !== 'number' || event.dateUnix < 0) {
      errors.push('Invalid dateUnix format');
    }
    
    // Check for obviously wrong dates (before 2020 or more than 2 years in future)
    const eventDate = new Date(event.dateUnix);
    const now = new Date();
    const twoYearsFromNow = new Date(now.getFullYear() + 2, now.getMonth(), now.getDate());
    const year2020 = new Date('2020-01-01');
    
    if (eventDate < year2020) {
      errors.push(`Event date too far in past: ${eventDate.toISOString()}`);
    }
    
    if (eventDate > twoYearsFromNow) {
      errors.push(`Event date too far in future: ${eventDate.toISOString()}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    event: {
      ...event,
      title: event.title?.trim(),
      date: event.date?.trim(),
      venue: event.venue?.trim(),
      link: event.link?.trim()
    }
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

const validateEvents = (events) => {
  const results = {
    valid: [],
    invalid: [],
    stats: {
      total: events.length,
      validCount: 0,
      invalidCount: 0,
      errors: {}
    }
  };
  
  events.forEach((event, index) => {
    const validation = validateEvent(event);
    
    if (validation.valid) {
      results.valid.push(validation.event);
      results.stats.validCount++;
    } else {
      results.invalid.push({
        index,
        event,
        errors: validation.errors
      });
      results.stats.invalidCount++;
      
      // Track error frequency
      validation.errors.forEach(error => {
        results.stats.errors[error] = (results.stats.errors[error] || 0) + 1;
      });
    }
  });
  
  return results;
};

export { validateEvent, validateEvents };