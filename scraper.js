import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';

// Add these functions to your code
function parseHopeDate(dateString) {
  // Parse "31st October 2024 - 7:30 pm" format
  const [dateWithDay, time] = dateString.split(' - ');
  const [day, month, year] = dateWithDay.split(' ');
  const [hours, minutes] = time.split(':').map(Number);
  const monthMap = {
    'January': 0, 'February': 1, 'March': 2, 'April': 3, 'May': 4, 'June': 5,
    'July': 6, 'August': 7, 'September': 8, 'October': 9, 'November': 10, 'December': 11
  };

  const date = new Date(year, monthMap[month], parseInt(day.replace(/\D/g, '')), hours, minutes);
  return date.getTime() / 1000; // Convert to Unix timestamp
}

function parseGDSDate(dateString) {
  // Parse "Wed, 30 Oct 2024" format
  const [dayOfWeek, dayOfMonth, month, year] = dateString.split(', ')[1].split(' ');
  const monthMap = {
    'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
    'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
  };

  const date = new Date(year, monthMap[month], parseInt(dayOfMonth));
  return date.getTime() / 1000; // Convert to Unix timestamp
}

const scrapeSites = async () => {
  const allEvents = [];

  // Hope & Ruin
  const hopeRuinEvents = await scrapeHopeRuin();
  allEvents.push(...hopeRuinEvents);

  // Green Door Store
  const greenDoorEvents = await scrapeGreenDoor();
  allEvents.push(...greenDoorEvents);

  // Sort all events by date
  allEvents.sort((a, b) => a.dateUnix - b.dateUnix);

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
    const dateUnix = parseHopeDate(date); // Convert date to Unix timestamp

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
    const dateUnix = parseGDSDate(date); // Convert date to Unix timestamp

    return { title, date, venue, link, dateUnix };
  }).get();
};

// Start the scraping
scrapeSites();