import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';
import toUnixTimestamp from './utils/date-parser.js';
import { validateEvents } from './utils/data-validator.js';

const parseEventDate = (date, eventTitle) => {
  try {
    return toUnixTimestamp(date);
  } catch (error) {
    console.error(`Error parsing date for event "${eventTitle}": ${error.message}`);
    return null;
  }
};

const fetchAndParseHTML = async (url, timeout = 10000) => {
  try {
    const { data } = await axios.get(url, { timeout });
    return cheerio.load(data);
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      throw new Error(`Request timeout (${timeout}ms) for ${url}`);
    }
    throw new Error(`Failed to fetch ${url}: ${error.message}`);
  }
};

const scrapeSites = async () => {
  const allEvents = [];
  const scrapeStats = {
    successful: 0,
    failed: 0,
    venues: {}
  };

  const venues = [
    { name: 'Hope & Ruin', scraper: scrapeHopeRuin },
    { name: 'Green Door Store', scraper: scrapeGreenDoor },
    { name: 'Concorde 2', scraper: scrapeConcordeTwo },
    { name: 'Chalk', scraper: scrapeChalk },
    { name: 'Folklore Rooms', scraper: scrapeFolkloreRooms },
    { name: 'Prince Albert', scraper: scrapePrinceAlbert },
    { name: 'Pipeline', scraper: scrapePipeline }
  ];

  // Process each venue with error isolation
  for (const venue of venues) {
    try {
      console.log(`Scraping ${venue.name}...`);
      const rawEvents = await venue.scraper();
      
      if (rawEvents && rawEvents.length > 0) {
        // Validate events
        const validation = validateEvents(rawEvents);
        
        if (validation.valid.length > 0) {
          allEvents.push(...validation.valid);
        }
        
        scrapeStats.successful++;
        scrapeStats.venues[venue.name] = { 
          status: 'success', 
          events: validation.valid.length,
          invalidEvents: validation.invalid.length,
          rawEvents: rawEvents.length,
          validationErrors: validation.stats.errors
        };
        
        console.log(`✓ ${venue.name}: ${validation.valid.length}/${rawEvents.length} valid events`);
        
        if (validation.invalid.length > 0) {
          console.log(`  ⚠ ${validation.invalid.length} events failed validation`);
        }
      } else {
        scrapeStats.venues[venue.name] = { status: 'no_events', events: 0 };
        console.log(`⚠ ${venue.name}: No events found`);
      }
    } catch (error) {
      scrapeStats.failed++;
      scrapeStats.venues[venue.name] = { status: 'error', error: error.message, events: 0 };
      console.error(`✗ ${venue.name} failed: ${error.message}`);
    }
  }
  
  // Add more venues as needed...

  // Sort all events by date
  allEvents.sort((a, b) => {
    if (a.dateUnix === null && b.dateUnix === null) return 0;
    if (a.dateUnix === null) return 1;
    if (b.dateUnix === null) return -1;
    return a.dateUnix - b.dateUnix;
  });

  // Write all events to a JSON file
  await fs.writeFile('./data/events.json', JSON.stringify(allEvents, null, 2));
  
  // Write scraping statistics
  await fs.writeFile('./data/scrape-stats.json', JSON.stringify({
    timestamp: new Date().toISOString(),
    totalEvents: allEvents.length,
    nullDates: allEvents.filter(e => e.dateUnix === null).length,
    ...scrapeStats
  }, null, 2));

  console.log(`\n=== Scraping Summary ===`);
  console.log(`Total events: ${allEvents.length}`);
  console.log(`Successful venues: ${scrapeStats.successful}`);
  console.log(`Failed venues: ${scrapeStats.failed}`);
  console.log(`Events with parsing issues: ${allEvents.filter(e => e.dateUnix === null).length}`);
  console.log('Data written to events.json and scrape-stats.json');
};

// Scrape Hope & Ruin
const scrapeHopeRuin = async () => {
  const url = "https://www.hope.pub/events/";
  const $ = await fetchAndParseHTML(url);

  return $('.events-list-alternate__card').map((_, element) => {
    const title = $(element).find(".heading-link").text().trim();
    const date = $(element).find(".meta--date").text().trim();
    const venue = 'Hope & Ruin';
    const link = $(element).find(".card__button").attr('href');
    const dateUnix = parseEventDate(date, title);

    return { title, date, venue, link, dateUnix };
  }).get();
};

// Scrape Green Door Store
const scrapeGreenDoor = async () => {
  const url = "https://thegreendoorstore.co.uk/events/";
  const $ = await fetchAndParseHTML(url);

  return $('.event-card').map((_, element) => {
    const title = $(element).find(".event-card__title").text().trim();
    const date = $(element).find(".event-card__date").text().trim();
    const venue = 'Green Door Store';
    const link = $(element).find(".event-card__link").attr('href');
    const dateUnix = parseEventDate(date, title);

    return { title, date, venue, link, dateUnix };
  }).get();
};

// Scrape Concorde 2
const scrapeConcordeTwo = async () => {
  const url = "https://www.gigseekr.com/uk/en/brighton/concorde-2/venue/jk";
  const $ = await fetchAndParseHTML(url);

  return $('.event-container .basic-event').map((_, element) => {
    const day   = $(element).find(".date-container .day").text().trim();
    const month = $(element).find(".date-container .month").text().trim();
    const year  = $(element).find(".date-container .year").text().trim();
    const title = $(element).find(".details h3 a").text().trim();
    const date  = `${day} ${month} ${year}`;
    const venue = 'Concorde 2';
    const link  = 'https://www.gigseekr.com' + $(element).find(".details h3 a").attr('href');
    const dateUnix = parseEventDate(date, title);

    return { title, date, venue, link, dateUnix };
  }).get();
};

// Scrape Chalk
const scrapeChalk = async () => {
  const url = "https://www.gigseekr.com/uk/en/brighton/chalk/venue/8kq";
  const $ = await fetchAndParseHTML(url);

  return $('.event-container .basic-event').map((_, element) => {
    const day   = $(element).find(".date-container .day").text().trim();
    const month = $(element).find(".date-container .month").text().trim();
    const year  = $(element).find(".date-container .year").text().trim();
    const title = $(element).find(".details h3 a").text().trim();
    const date  = `${day} ${month} ${year}`;
    const venue = 'Chalk';
    const link  = 'https://www.gigseekr.com' + $(element).find(".details h3 a").attr('href');
    const dateUnix = parseEventDate(date, title);

    return { title, date, venue, link, dateUnix };
  }).get();
};

// Scrape Patterns
// const scrapePatterns = async () => {
//   const url = "https://patternsbrighton.com/club";
//   const $ = await fetchAndParseHTML(url);

//   return $('article').map((_, element) => {
//     const title = $(element).find(".dice_event-title").text().trim();
//     const date = $(element).find("time").text().trim();
//     const venue = 'Patterns';
//     const link = $(element).find(".dice_event-title").attr('href');
//     const dateUnix = parseEventDate(date, title);

//     return { title, date, venue, link, dateUnix };
//   }).get();
// };

// Scrape Folklore Rooms
const scrapeFolkloreRooms = async () => {
  const url = "https://wegottickets.com/location/23904";
  const $ = await fetchAndParseHTML(url);

  return $('.content.block-group.chatterbox-margin').map((_, element) => {
    const title = $(element).find("h2 a").text().trim();
    const date = $(element).find(".venue-details tr:nth-child(1) td").text().trim();
    const venue = 'Folklore Rooms';
    const link = $(element).find(".button").attr('href');
    const dateUnix = parseEventDate(date, title);

    return { title, date, venue, link, dateUnix };
  }).get();
};

// Scrape Prince Albert
const scrapePrinceAlbert = async () => {
  const url = "https://www.gigseekr.com/uk/en/brighton/the-prince-albert/venue/6a";
  const $ = await fetchAndParseHTML(url);

  return $('.event-container .basic-event').map((_, element) => {
    const day   = $(element).find(".date-container .day").text().trim();
    const month = $(element).find(".date-container .month").text().trim();
    const year  = $(element).find(".date-container .year").text().trim();
    const title = $(element).find(".details h3 a").text().trim();
    const date  = `${day} ${month} ${year}`;
    const venue = 'Prince Albert';
    const link  = 'https://www.gigseekr.com' + $(element).find(".details h3 a").attr('href');
    const dateUnix = parseEventDate(date, title);

    return { title, date, venue, link, dateUnix };
  }).get();
};

// Scrape Pipeline
const scrapePipeline = async () => {
  const url = "https://wegottickets.com/location/20025";
  const $ = await fetchAndParseHTML(url);

  return $('.content.block-group.chatterbox-margin').map((_, element) => {
    const title = $(element).find("h2 a").text().trim();
    const date = $(element).find(".venue-details tr:nth-child(1) td").text().trim();
    const venue = 'Pipeline';
    const link = $(element).find(".button").attr('href');
    const dateUnix = parseEventDate(date, title);

    return { title, date, venue, link, dateUnix };
  }).get();
};

// Start the scraping
scrapeSites();