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

  // Folklore Rooms
  const folkloreRoomsEvents = await scrapeFolkloreRooms();
  allEvents.push(...folkloreRoomsEvents);

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

const scrapeChalk = async () => {
  const url = "https://chalkvenue.com/live";
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);

  return $('.grid.grid-cols-1.items-start.gap-6 .grid.h-full.grid-cols-2.gap-x-4.gap-y-3.p-3.bg-chalkBlue').map((_, element) => {
    const title = $(element).find("h2.text-xl.font-semibold.uppercase.text-white").text().trim();
    console.log(title);
    const date = $(element).find(".text-base").text().trim();
    const venue = 'Chalk';
    const link = $(element).find("a.col-span-2.text-center").attr('href');

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

// Scrape Folklore Rooms.
const scrapeFolkloreRooms = async () => {
  const url = "https://www.thefolklorerooms.co.uk/listings";
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);

  return $('.Zc7IjY').map((_, element) => {
    const title = $(element).find("h2").text().trim();
    const date = $(element).find(".HcOXKn p span span span").text().trim();
    const venue = 'Folklore Rooms';
    const link = $(element).find(".wixui-button").attr('href');

    // Clean up the date format if needed
    // Sometimes the date might have extra information or formatting
    // that our parser can't handle directly
    date = date.replace(/\s+/g, ' ').trim(); // Normalize whitespace

    let dateUnix;
    try {
      dateUnix = toUnixTimestamp(date); // Convert date to Unix timestamp
    } catch (error) {
      console.error(`Error parsing date for event "${title}": ${error.message}`);
      dateUnix = null;
    }

    return { title, date, venue, link, dateUnix };
  }).get();
}

// Start the scraping
scrapeSites();