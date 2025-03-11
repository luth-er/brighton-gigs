import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';
import toUnixTimestamp from './date-parser.js';

const scrapeSites = async () => {
  const allEvents = [];

  // Hope & Ruin
  const hopeRuinEvents = await scrapeHopeRuin();
  allEvents.push(...hopeRuinEvents);

  // Green Door Store
  const greenDoorEvents = await scrapeGreenDoor();
  allEvents.push(...greenDoorEvents);

  // Concorde 2
  const concordeTwoEvents = await scrapeConcordeTwo();
  allEvents.push(...concordeTwoEvents);

  // Chalk
  const chalkEvents = await scrapeChalk();
  allEvents.push(...chalkEvents);

  // Patterns
  const patternsEvents = await scrapePatterns();
  allEvents.push(...patternsEvents);

  // Folklore Rooms
  // const folkloreRoomsEvents = await scrapeFolkloreRooms();
  // allEvents.push(...folkloreRoomsEvents);

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

// Scrape Hope & Ruin
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

// Scrape Green Door Store
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

// Scrape Concorde 2
const scrapeConcordeTwo = async () => {
  const url = "https://www.gigseekr.com/uk/en/brighton/concorde-2/venue/jk";
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);

  return $('.event-container .basic-event').map((_, element) => {
    const day   = $(element).find(".date-container .day").text().trim();
    const month = $(element).find(".date-container .month").text().trim();
    const year  = $(element).find(".date-container .year").text().trim();
    const title = $(element).find(".details h3 a").text().trim();
    const date  = `${day} ${month} ${year}`;
    const venue = 'Concorde 2';
    const link  = 'https://www.gigseekr.com' + $(element).find(".details h3 a").attr('href');

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

// Scrape Chalk
const scrapeChalk = async () => {
  const url = "https://chalkvenue.com/live";
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);

  return $('.bg-chalkBlue').map((_, element) => {
    const title = $(element).find("a h2").text().trim();
    console.log(title);
    const date = $(element).find("a p.text-base").text().trim();
    const venue = 'Chalk';
    const link = $(element).find("a").attr('href');

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

// Scrape Patterns
const scrapePatterns = async () => {
  const url = "https://patternsbrighton.com/club";
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);

  return $('article').map((_, element) => {
    const title = $(element).find(".dice_event-title").text().trim();
    const date = $(element).find("time").text().trim();
    const venue = 'Patterns';
    const link = $(element).find(".dice_event-title").attr('href');

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

// // Scrape Folklore Rooms.
// const scrapeFolkloreRooms = async () => {
//   const url = "https://www.thefolklorerooms.co.uk/listings";
//   const { data } = await axios.get(url);
//   const $ = cheerio.load(data);

//   return $('.Zc7IjY').map((_, element) => {
//     const title = $(element).find("h2").text().trim();
//     const date = $(element).find(".HcOXKn p span span span").text().trim();
//     const venue = 'Folklore Rooms';
//     const link = $(element).find(".wixui-button").attr('href');

// // Handle Folklore Rooms date format directly
//     // Format: "Tuesday 11 March 2025"
//     let dateUnix = null;
    
//     if (date) {
//       try {
//         // Parse the date directly for the format "Tuesday 11 March 2025"
//         const folkloreRegex = /^([A-Za-z]+)\s+(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/i;
//         const match = date.match(folkloreRegex);
        
//         if (match) {
//           const [_, weekday, day, monthStr, year] = match;
          
//           // Month name to number mapping
//           const months = {
//             'january': 0, 'jan': 0,
//             'february': 1, 'feb': 1,
//             'march': 2, 'mar': 2,
//             'april': 3, 'apr': 3,
//             'may': 4,
//             'june': 5, 'jun': 5,
//             'july': 6, 'jul': 6,
//             'august': 7, 'aug': 7,
//             'september': 8, 'sep': 8, 'sept': 8,
//             'october': 9, 'oct': 9,
//             'november': 10, 'nov': 10,
//             'december': 11, 'dec': 11
//           };
          
//           const month = months[monthStr.toLowerCase()];
          
//           if (month !== undefined) {
//             const folklore_date = new Date(parseInt(year), month, parseInt(day));
//             dateUnix = folklore_date.getTime();
//             console.log(`Successfully parsed Folklore date: ${folklore_date.toISOString()}`);
//           } else {
//             console.error(`Could not recognize month: ${monthStr}`);
//           }
//         } else {
//           console.error(`Date doesn't match expected format: ${date}`);
//         }
//       } catch (error) {
//         console.error(`Error parsing Folklore date: ${error.message}`);
//       }
      
//       // If direct parsing failed, try using the standard parser as fallback
//       if (!dateUnix) {
//         try {
//           dateUnix = toUnixTimestamp(date);
//         } catch (error) {
//           console.error(`Fallback date parsing failed: ${error.message}`);
//           dateUnix = null;
//         }
//       }
//     }

//     return { title, date, venue, link, dateUnix };
//   }).get();
// }

// Start the scraping
scrapeSites();