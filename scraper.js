import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';




/**
 * Converts various date/time formats to Unix timestamp (milliseconds since epoch)
 * @param {string|Date|number} input - Date input in various formats
 * @returns {number} Unix timestamp in milliseconds
 * @throws {Error} If the input format is invalid or cannot be parsed
 */
function toUnixTimestamp(input) {
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
}


// Add these functions to your code
// function parseHopeDate(dateString) {
//   // Parse "31st October 2024 - 7:30 pm" format
//   const [dateWithDay, time] = dateString.split(' - ');
//   const [day, month, year] = dateWithDay.split(' ');
//   const [hours, minutes] = time.split(':').map(Number);
//   const monthMap = {
//     'January': 0, 'February': 1, 'March': 2, 'April': 3, 'May': 4, 'June': 5,
//     'July': 6, 'August': 7, 'September': 8, 'October': 9, 'November': 10, 'December': 11
//   };

//   const date = new Date(year, monthMap[month], parseInt(day.replace(/\D/g, '')), hours, minutes);
//   return date.getTime() / 1000; // Convert to Unix timestamp
// }

// function parseGDSDate(dateString) {
//   // Parse "Wed, 30 Oct 2024" format
//   const [dayOfWeek, dayOfMonth, month, year] = dateString.split(', ')[1].split(' ');
//   const monthMap = {
//     'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
//     'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
//   };

//   const date = new Date(year, monthMap[month], parseInt(dayOfMonth));
//   return date.getTime() / 1000; // Convert to Unix timestamp
// }

const scrapeSites = async () => {
  const allEvents = [];

  // Hope & Ruin
  const hopeRuinEvents = await scrapeHopeRuin();
  allEvents.push(...hopeRuinEvents);

  // Green Door Store
  const greenDoorEvents = await scrapeGreenDoor();
  allEvents.push(...greenDoorEvents);

  // Sort all events by date
  allEvents.sort((a, b) => {
    if (a.dateUnix === null && b.dateUnix === null) return 0;
    if (a.dateUnix === null) return 1;
    if (b.dateUnix === null) return -1;
    return a.dateUnix - b.dateUnix;
  });

  // Write all events to a JSON file
  await fs.writeFile('events.json', JSON.stringify(allEvents, null, 2));

  console.log('Data has been written to events.json');
};

const scrapeHopeRuin = async () => {
  const url = "https://www.hope.pub/events/";
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);

  return $('.events-list-alternate__card').map((_, element) => {
    const title = $(element).find(".heading-link").text().trim();
    const date = $(element).find(".meta--date").text().trim();
    const venue = 'Hope & Ruin';
    const link = $(element).find(".card__button").attr('href');

    let dateUnix;
    try {
      dateUnix = toUnixTimestamp(date); // Convert date to Unix timestamp
    } catch (error) {
      console.error(`Error parsing date for event "${title}": ${error.message}`);
      dateUnix = null;
    }

    return { title, date, venue, link, dateUnix };
  }).get();
};

const scrapeGreenDoor = async () => {
  const url = "https://thegreendoorstore.co.uk/events/";
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);

  return $('.event-card').map((_, element) => {
    const title = $(element).find(".event-card__title").text().trim();
    const date = $(element).find(".event-card__date").text().trim();
    const venue = 'Green Door Store';
    const link = $(element).find(".event-card__link").attr('href');

    let dateUnix;
    try {
      dateUnix = toUnixTimestamp(date); // Convert date to Unix timestamp
    } catch (error) {
      console.error(`Error parsing date for event "${title}": ${error.message}`);
      dateUnix = null;
    }

    return { title, date, venue, link, dateUnix };
  }).get();
};

// Start the scraping
scrapeSites();