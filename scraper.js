import puppeteer from "puppeteer";
import fs from 'fs/promises';

// Hope & Ruin
const getHopeRuin = async () => {

	const browser = await puppeteer.launch({
	  headless: false,
	  defaultViewport: null,
	});
  
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
  
	// Display the quotes
	console.log('Hope & Ruin', events );
  
	// Close the browser
	await browser.close();

	 // Write the events to a JSON file
	 await fs.writeFile('events.json', JSON.stringify(events, null, 2));

	 console.log('Data has been written to events.json');
  };

// Start the scraping

getHopeRuin();