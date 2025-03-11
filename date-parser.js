/**
 * Converts various date/time formats to Unix timestamp (milliseconds since epoch)
 * @param {string|Date|number} input - Date input in various formats
 * @returns {number} Unix timestamp in milliseconds
 * @throws {Error} If the input format is invalid or cannot be parsed
 */
const toUnixTimestamp = (input) => {
    // ================ HANDLE NON-STRING INPUTS ================
    // Handle numeric inputs (seconds or milliseconds)
    if (typeof input === 'number') {
      if (input.toString().length === 10) return input * 1000; // Seconds to milliseconds
      if (input.toString().length === 13) return input; // Already milliseconds
      throw new Error('Invalid numeric timestamp format');
    }
  
    // Handle Date objects
    if (input instanceof Date) {
      return input.getTime();
    }
  
    // ================ HANDLE STRING INPUTS ================
    if (typeof input === 'string') {
      // Clean up input
      input = input.trim().replace(/\s+/g, ' ');
      
      // ---- QUICK CHECK FOR STANDARD FORMATS ----
      // Try standard JavaScript date parsing first
      const standardDate = new Date(input);
      if (!isNaN(standardDate.getTime())) {
        return standardDate.getTime();
      }
      
      // Month name to number mapping
      const months = {
        'january': 0, 'jan': 0,
        'february': 1, 'feb': 1,
        'march': 2, 'mar': 2,
        'april': 3, 'apr': 3,
        'may': 4,
        'june': 5, 'jun': 5,
        'july': 6, 'jul': 6,
        'august': 7, 'aug': 7,
        'september': 8, 'sep': 8, 'sept': 8,
        'october': 9, 'oct': 9,
        'november': 10, 'nov': 10,
        'december': 11, 'dec': 11
      };
      
      // ---- HANDLE COMMON DATE/TIME PATTERNS ----
      
      // For date parsing functions
      const parseResult = (match, monthStr, setTime = true) => {
        if (!match) return null;
        
        const day = parseInt(match.groups.day);
        const month = months[monthStr.toLowerCase()];
        
        if (month === undefined) return null;
        
        const year = match.groups.year 
          ? parseInt(match.groups.year) 
          : (match.groups.shortYear ? parseInt('20' + match.groups.shortYear) : new Date().getFullYear());
        
        const date = new Date(year, month, day);
        
        // Set time if available in the format
        if (setTime && match.groups.hour) {
          let hour = parseInt(match.groups.hour);
          const isPM = match.groups.meridiem?.toLowerCase() === 'pm';
          
          if (isPM && hour !== 12) hour += 12;
          if (!isPM && hour === 12) hour = 0;
          
          date.setHours(
            hour, 
            match.groups.minute ? parseInt(match.groups.minute) : 0,
            0, 0
          );
        } else if (!setTime) {
          // Set to start of day if no time provided
          date.setHours(0, 0, 0, 0);
        }
        
        return date.getTime();
      };
      
      // ---- PATTERN 1: DATES WITH ORDINALS AND TIME ----
      // Examples: "31st October 2024 - 7:30 pm", "7th November 2024 - 8:00 pm"
      const ordinalDateTimePattern = /^(?<day>\d{1,2})(?:st|nd|rd|th)\s+(?<monthName>[A-Za-z]+)\s+(?<year>\d{4})\s*[-–—]\s*(?<hour>\d{1,2}):(?<minute>\d{2})\s*(?<meridiem>am|pm)$/i;
      const ordinalMatch = input.match(ordinalDateTimePattern);
      if (ordinalMatch) {
        const result = parseResult(ordinalMatch, ordinalMatch.groups.monthName);
        if (result) return result;
      }
      
      // ---- PATTERN 2: WEEKDAY WITH DATE ----
      // Examples: "Tue, 5 Nov 2024", "Monday 10 March 2025"
      const weekdayDatePattern = /^(?:[A-Za-z]+)(?:,)?\s+(?<day>\d{1,2})\s+(?<monthName>[A-Za-z]+)(?:\s+(?<year>\d{4}))?$/i;
      const weekdayMatch = input.match(weekdayDatePattern);
      if (weekdayMatch) {
        const result = parseResult(weekdayMatch, weekdayMatch.groups.monthName, false);
        if (result) return result;
      }
      
      // ---- PATTERN 3: WEEKDAY WITH DATE AND TIME ----
      // Example: "Fri 14 Mar ― 7:00pm" or "Fri 14 Mar - 7:00 pm"
      const weekdayDateTimePattern = /^(?:[A-Za-z]+)\s+(?<day>\d{1,2})\s+(?<monthName>[A-Za-z]+)(?:\s+[-–—]\s*|\s*[-–—]\s+)(?<hour>\d{1,2}):(?<minute>\d{2})(?:\s*)?(?<meridiem>am|pm)$/i;
      const weekdayTimeMatch = input.match(weekdayDateTimePattern);
      if (weekdayTimeMatch) {
        const result = parseResult(weekdayTimeMatch, weekdayTimeMatch.groups.monthName);
        if (result) return result;
      }
      
      // ---- PATTERN 4: SHORT DATE FORMAT ----
      // Example: "1/12/24"
      const shortDatePattern = /^(?<day>\d{1,2})\/(?<month>\d{1,2})\/(?<shortYear>\d{2})$/;
      const shortDateMatch = input.match(shortDatePattern);
      if (shortDateMatch) {
        const result = parseResult(
          shortDateMatch, 
          // Convert numeric month to name for the parseResult function
          Object.keys(months)[parseInt(shortDateMatch.groups.month) - 1],
          false
        );
        if (result) return result;
      }
      
      // ---- PATTERN 5: SIMPLE DATE FORMAT ----
      // Example: "12 Nov 2024"
      const simpleDatePattern = /^(?<day>\d{1,2})\s+(?<monthName>[A-Za-z]+)\s+(?<year>\d{4})$/i;
      const simpleDateMatch = input.match(simpleDatePattern);
      if (simpleDateMatch) {
        const result = parseResult(simpleDateMatch, simpleDateMatch.groups.monthName, false);
        if (result) return result;
      }
      
      // ---- PATTERN 6: SHORT DATE WITH TIME (ASSUME CURRENT YEAR) ----
      // Example: "14th Nov - 6pm"
      const shortDateTimePattern = /^(?<day>\d{1,2})(?:st|nd|rd|th)?\s+(?<monthName>[A-Za-z]+)(?:\s+[-–—]\s*|\s*[-–—]\s+)(?<hour>\d{1,2})(?::(?<minute>\d{2}))?\s*(?<meridiem>am|pm)$/i;
      const shortDateTimeMatch = input.match(shortDateTimePattern);
      if (shortDateTimeMatch) {
        const result = parseResult(shortDateTimeMatch, shortDateTimeMatch.groups.monthName);
        if (result) return result;
      }
      
      // ---- SPECIAL CASES ----
      
      // Handle "yesterday" and "today"
      if (input.toLowerCase() === 'yesterday') {
        const date = new Date();
        date.setDate(date.getDate() - 1);
        date.setHours(0, 0, 0, 0);
        return date.getTime();
      }
      if (input.toLowerCase() === 'today') {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        return date.getTime();
      }
      
      // Handle relative time (e.g., "2 days ago")
      const relativeTimePattern = /^(?<amount>\d+)?\s*(?<unit>second|minute|hour|day|week|month|year)s?\s+ago$/i;
      const relativeMatch = input.match(relativeTimePattern);
      if (relativeMatch) {
        const amount = relativeMatch.groups.amount ? parseInt(relativeMatch.groups.amount) : 1;
        const unit = relativeMatch.groups.unit.toLowerCase();
        const now = new Date();
        
        const timeUnits = {
          second: 1000,
          minute: 60 * 1000,
          hour: 60 * 60 * 1000,
          day: 24 * 60 * 60 * 1000,
          week: 7 * 24 * 60 * 60 * 1000,
          month: 30 * 24 * 60 * 60 * 1000,
          year: 365 * 24 * 60 * 60 * 1000
        };
  
        return now.getTime() - (amount * timeUnits[unit]);
      }
    }
  
    throw new Error('Invalid date format');
  };
  
  export default toUnixTimestamp;