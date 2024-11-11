/**
 * Converts various date/time formats to Unix timestamp (milliseconds since epoch)
 * @param {string|Date|number} input - Date input in various formats
 * @returns {number} Unix timestamp in milliseconds
 * @throws {Error} If the input format is invalid or cannot be parsed
 */
const toUnixTimestamp = (input) => {
    // If input is already a number, check if it's a reasonable timestamp
    if (typeof input === 'number') {
        // If it's in seconds (10 digits), convert to milliseconds
        if (input.toString().length === 10) {
            return input * 1000;
        }
        // If it's already in milliseconds (13 digits)
        if (input.toString().length === 13) {
            return input;
        }
    }

    // If input is already a Date object
    if (input instanceof Date) {
        return input.getTime();
    }

    // If input is a string, try various formats
    if (typeof input === 'string') {
        // Remove extra spaces and standardize spacing
        input = input.trim().replace(/\s+/g, ' ');

        // Try parsing ISO format first
        let date = new Date(input);
        if (!isNaN(date.getTime())) {
            return date.getTime();
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

        // Format: "31st October 2024 - 7:30 pm" or "7th November 2024 - 8:00 pm"
        const ordinalDateTimeRegex = /^(\d{1,2})(st|nd|rd|th)\s+([A-Za-z]+)\s+(\d{4})\s*-\s*(\d{1,2}):(\d{2})\s*(am|pm)$/i;
        const ordinalMatch = input.match(ordinalDateTimeRegex);
        if (ordinalMatch) {
            const [_, day, , monthStr, year, hours, minutes, meridiem] = ordinalMatch;
            const month = months[monthStr.toLowerCase()];
            
            if (month !== undefined) {
                let hour = parseInt(hours);
                if (meridiem.toLowerCase() === 'pm' && hour !== 12) hour += 12;
                if (meridiem.toLowerCase() === 'am' && hour === 12) hour = 0;
                
                date = new Date(
                    parseInt(year),
                    month,
                    parseInt(day),
                    hour,
                    parseInt(minutes)
                );
                if (!isNaN(date.getTime())) {
                    return date.getTime();
                }
            }
        }

        // Format: "Tue, 5 Nov 2024" or "Thu, 7 Nov 2024"
        const weekdayDateRegex = /^([A-Za-z]+),\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/i;
        const weekdayMatch = input.match(weekdayDateRegex);
        if (weekdayMatch) {
            const [_, , day, monthStr, year] = weekdayMatch;
            const month = months[monthStr.toLowerCase()];
            
            if (month !== undefined) {
                date = new Date(
                    parseInt(year),
                    month,
                    parseInt(day)
                );
                // Set to start of day
                date.setHours(0, 0, 0, 0);
                if (!isNaN(date.getTime())) {
                    return date.getTime();
                }
            }
        }

        // Format: "1/12/24"
        const shortDateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{2})$/;
        const shortDateMatch = input.match(shortDateRegex);
        if (shortDateMatch) {
            const [_, day, monthStr, yearStr] = shortDateMatch;
            const month = parseInt(monthStr) - 1;
            const year = parseInt('20' + yearStr);
            
            date = new Date(year, month, parseInt(day));
            if (!isNaN(date.getTime())) {
                return date.getTime();
            }
        }

        // Format: "16/11/24 - 23:00 to 17/11/24 - 04:00"
        const dateRangeRegex = /^(\d{2})\/(\d{2})\/(\d{2})\s*-\s*(\d{2}):(\d{2})/;
        const dateRangeMatch = input.match(dateRangeRegex);

        if (dateRangeMatch) {
            const [_, day, monthStr, yearStr, hours, minutes] = dateRangeMatch;
            const month = parseInt(monthStr) - 1;
            const year = parseInt('20' + yearStr);
            
            date = new Date(year, month, parseInt(day), parseInt(hours), parseInt(minutes));
            if (!isNaN(date.getTime())) {
                return date.getTime();
            }
        }

        // Handle relative time formats like "2 days ago", "yesterday", etc.
        const relativeTimeRegex = /^(\d+)?\s*(second|minute|hour|day|week|month|year)s?\s+ago$/i;
        const matches = input.match(relativeTimeRegex);
        if (matches) {
            const [_, amount, unit] = matches;
            const num = amount ? parseInt(amount) : 1;
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

            return now.getTime() - (num * timeUnits[unit]);
        }

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
    }

    throw new Error('Invalid date format');
};

export default toUnixTimestamp;