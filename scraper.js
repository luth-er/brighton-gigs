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
  const url = "https://www.eventim-light.com/uk/a/63e65b596d6acd63f8b70fee/iframe/";
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);

  return $('.v-card.v-card--link').map((_, element) => {
    const title = $(element).find(".v-card-title").text().trim();
    const date = $(element).find(".event__date").text().trim();
    const venue = 'Concorde 2';
    const link = $(element).find(".v-btn").attr('href');

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