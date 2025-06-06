import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';
import toUnixTimestamp from './date-parser.js';

const parseEventDate = (date, eventTitle) => {
  try {
    return toUnixTimestamp(date);
  } catch (error) {
    console.error(`Error parsing date for event "${eventTitle}": ${error.message}`);
    return null;
  }
};

const fetchAndParseHTML = async (url) => {
  const { data } = await axios.get(url);
  return cheerio.load(data);
};

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
const scrapePatterns = async () => {
  const url = "https://patternsbrighton.com/club";
  const $ = await fetchAndParseHTML(url);

  return $('article').map((_, element) => {
    const title = $(element).find(".dice_event-title").text().trim();
    const date = $(element).find("time").text().trim();
    const venue = 'Patterns';
    const link = $(element).find(".dice_event-title").attr('href');
    const dateUnix = parseEventDate(date, title);

    return { title, date, venue, link, dateUnix };
  }).get();
};

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

// Start the scraping
scrapeSites();