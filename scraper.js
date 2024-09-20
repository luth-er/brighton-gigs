import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';

const scrapeSites = async () => {
  const allEvents = [];

  // Hope & Ruin
  const hopeRuinEvents = await scrapeHopeRuin();
  allEvents.push(...hopeRuinEvents);

  // Green Door Store
  const greenDoorEvents = await scrapeGreenDoor();
  allEvents.push(...greenDoorEvents);

  // Sort all events by date
  allEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

  // Write all events to a JSON file
  await fs.writeFile('events.json', JSON.stringify(allEvents, null, 2));

  console.log('Data has been written to events.json');
};

const parseDate = (dateString) => {
	let parsedDate;
  
	// Try parsing Hope & Ruin format
	parsedDate = parse(dateString, 'do MMMM yyyy - h:mm a', new Date());

	if (!isNaN(parsedDate)) return format(parsedDate, 'yyyy-MM-dd');
  
	// Try parsing Green Door Store format
	parsedDate = parse(dateString, 'EEE, d MMM yyyy', new Date());
	if (!isNaN(parsedDate)) return format(parsedDate, 'yyyy-MM-dd');
  
	// If none of the above worked, return the original string
	console.warn(`Unable to parse date: ${dateString}`);
	return dateString;
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

    return { title, date, venue, link };
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

    return { title, date, venue, link };
  }).get();
};

// Start the scraping
scrapeSites();