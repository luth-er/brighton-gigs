import puppeteer from "puppeteer";
import fs from 'fs/promises';

const scrapeSites = async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
  });

  const allEvents = [];

  // Hope & Ruin
  const hopeRuinEvents = await scrapeHopeRuin(browser);
  allEvents.push(...hopeRuinEvents);

  // Green Door Store
  const greenDoorEvents = await scrapeGreenDoor(browser);
  allEvents.push(...greenDoorEvents);

  // Add more scraping functions for other sites here

  await browser.close();

  // Sort all events by date
  allEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

  // Write all events to a JSON file
  await fs.writeFile('events.json', JSON.stringify(allEvents, null, 2));

  console.log('Data has been written to events.json');
};

// Hope & Ruin Scraper
const scrapeHopeRuin = async (browser) => {
  const page = await browser.newPage();

  await page.goto("https://www.hope.pub/events/", {
    waitUntil: "domcontentloaded",
  });

  const events = await page.evaluate(() => {
    const eventList = document.querySelectorAll(".events-list-alternate__card");

    return Array.from(eventList).map((event) => {
      const title = event.querySelector(".heading-link").innerText;
      const date  = event.querySelector(".meta--date").innerText;
      const venue = 'Hope & Ruin';
      const link  = event.querySelector(".card__button").href;

      return { title, date, venue, link };
    });
  });

  await page.close();
  return events;
};

// Green Door Store Scraper
const scrapeGreenDoor = async (browser) => {
  const page = await browser.newPage();

  await page.goto("https://thegreendoorstore.co.uk/events/", {
    waitUntil: "domcontentloaded",
  });

  const events = await page.evaluate(() => {
    const eventList = document.querySelectorAll(".event-card");

    return Array.from(eventList).map((event) => {
      const title = event.querySelector(".event-card__title").innerText;
      const date  = event.querySelector(".event-card__date").innerText;
      const venue = 'Green Door Store';
      const link  = event.querySelector(".event-card__link").href;

      return { title, date, venue, link };
    });
  });

  await page.close();
  return events;
};

// Start the scraping
scrapeSites();