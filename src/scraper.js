import fs from 'fs/promises';
import BaseScraper from './scrapers/BaseScraper.js';
import { validateEvents } from './utils/data-validator.js';
import { globalRateLimiter } from './utils/rate-limiter.js';

// Individual venue scraper classes extending BaseScraper
class HopeRuinScraper extends BaseScraper {
  constructor() {
    super('Hope & Ruin', 'https://www.hope.pub/gigs-in-the-venue/');
  }

  async scrape() {
    return globalRateLimiter.execute(async () => {
      const $ = await this.fetchAndParseHTML(this.baseUrl);

      // Extract JSON-LD structured data from script tags
      const events = [];
      $('script[type="application/ld+json"]').each((_, element) => {
        try {
          const jsonData = JSON.parse($(element).html());

          // Handle both single event and array of events
          const eventData = Array.isArray(jsonData) ? jsonData : [jsonData];

          eventData.forEach(data => {
            if (data['@type'] === 'Event') {
              const title = data.name?.trim() || '';
              const startDate = data.startDate || '';
              const link = data.url || '';

              // Parse ISO 8601 date format (YYYY-MM-DDTHH:MM)
              const dateUnix = this.parseEventDate(startDate, title);

              events.push(this.createEvent({
                title,
                date: startDate,
                link,
                dateUnix
              }));
            }
          });
        } catch (error) {
          console.warn(`Hope & Ruin - Failed to parse JSON-LD: ${error.message}`);
        }
      });

      return events;
    }, { domain: 'hope.pub', priority: 1 });
  }
}

class GreenDoorScraper extends BaseScraper {
  constructor() {
    super('Green Door Store', 'https://thegreendoorstore.co.uk/events/');
  }

  async scrape() {
    return globalRateLimiter.execute(async () => {
      const $ = await this.fetchAndParseHTML(this.baseUrl);
      
      return $('.event-card').map((_, element) => {
        const title = $(element).find('.event-card__title').text().trim();
        const date = $(element).find('.event-card__date').text().trim();
        const link = $(element).find('.event-card__link').attr('href');
        const dateUnix = this.parseEventDate(date, title);
        
        return this.createEvent({ title, date, link, dateUnix });
      }).get();
    }, { domain: 'thegreendoorstore.co.uk', priority: 1 });
  }
}

class ConcordeTwoScraper extends BaseScraper {
  constructor() {
    super('Concorde 2', 'https://www.concorde2.co.uk/whats-on?type=live');
  }

  async scrape() {
    return globalRateLimiter.execute(async () => {
      const $ = await this.fetchAndParseHTML(this.baseUrl);
      
      return $('a.block.group').map((_, element) => {
        const title = $(element).find('h3').text().trim();
        const date = $(element).find('datetime').text().trim();
        const link = $(element).attr('href');
        const dateUnix = this.parseEventDate(date, title);
        
        return this.createEvent({ title, date, link, dateUnix });
      }).get();
    }, { domain: 'concorde2.co.uk', priority: 1 });
  }
}

class ChalkScraper extends BaseScraper {
  constructor() {
    super('Chalk', 'https://www.gigseekr.com/uk/en/brighton/chalk/venue/8kq');
  }

  async scrape() {
    return globalRateLimiter.execute(async () => {
      const $ = await this.fetchAndParseHTML(this.baseUrl);
      
      return $('.event-container .basic-event').map((_, element) => {
        const day = $(element).find('.date-container .day').text().trim();
        const month = $(element).find('.date-container .month').text().trim();
        const year = $(element).find('.date-container .year').text().trim();
        const title = $(element).find('.details h3 a').text().trim();
        const date = `${day} ${month} ${year}`;
        const link = 'https://www.gigseekr.com' + $(element).find('.details h3 a').attr('href');
        const dateUnix = this.parseEventDate(date, title);
        
        return this.createEvent({ title, date, link, dateUnix });
      }).get();
    }, { domain: 'gigseekr.com', priority: 1 });
  }
}

class FolkloreRoomsScraper extends BaseScraper {
  constructor() {
    super('Folklore Rooms', 'https://wegottickets.com/location/23904');
  }

  async scrape() {
    return globalRateLimiter.execute(async () => {
      const $ = await this.fetchAndParseHTML(this.baseUrl);

      // Extract JSON-LD structured data from script tags
      const events = [];
      $('script[type="application/ld+json"]').each((_, element) => {
        try {
          const jsonData = JSON.parse($(element).html());

          // Handle both single event and array of events
          const eventData = Array.isArray(jsonData) ? jsonData : [jsonData];

          eventData.forEach(data => {
            if (data['@type'] === 'MusicEvent') {
              const title = data.name?.trim() || '';
              const startDate = data.startDate || '';
              const link = data.url || '';

              // Parse ISO 8601 date format
              const dateUnix = this.parseEventDate(startDate, title);

              events.push(this.createEvent({
                title,
                date: startDate,
                link,
                dateUnix
              }));
            }
          });
        } catch (error) {
          console.warn(`Folklore Rooms - Failed to parse JSON-LD: ${error.message}`);
        }
      });

      return events;
    }, { domain: 'wegottickets.com', priority: 1 });
  }
}

class PrinceAlbertScraper extends BaseScraper {
  constructor() {
    super('Prince Albert', 'https://www.gigseekr.com/uk/en/brighton/the-prince-albert/venue/6a');
  }

  async scrape() {
    return globalRateLimiter.execute(async () => {
      const $ = await this.fetchAndParseHTML(this.baseUrl);
      
      return $('.event-container .basic-event').map((_, element) => {
        const day = $(element).find('.date-container .day').text().trim();
        const month = $(element).find('.date-container .month').text().trim();
        const year = $(element).find('.date-container .year').text().trim();
        const title = $(element).find('.details h3 a').text().trim();
        const date = `${day} ${month} ${year}`;
        const link = 'https://www.gigseekr.com' + $(element).find('.details h3 a').attr('href');
        const dateUnix = this.parseEventDate(date, title);
        
        return this.createEvent({ title, date, link, dateUnix });
      }).get();
    }, { domain: 'gigseekr.com', priority: 1 });
  }
}

class PipelineScraper extends BaseScraper {
  constructor() {
    super('Pipeline', 'https://wegottickets.com/location/20025');
  }

  async scrape() {
    return globalRateLimiter.execute(async () => {
      const $ = await this.fetchAndParseHTML(this.baseUrl);

      // Extract JSON-LD structured data from script tags
      const events = [];
      $('script[type="application/ld+json"]').each((_, element) => {
        try {
          const jsonData = JSON.parse($(element).html());

          // Handle both single event and array of events
          const eventData = Array.isArray(jsonData) ? jsonData : [jsonData];

          eventData.forEach(data => {
            if (data['@type'] === 'MusicEvent') {
              const title = data.name?.trim() || '';
              const startDate = data.startDate || '';
              const link = data.url || '';

              // Parse ISO 8601 date format
              const dateUnix = this.parseEventDate(startDate, title);

              events.push(this.createEvent({
                title,
                date: startDate,
                link,
                dateUnix
              }));
            }
          });
        } catch (error) {
          console.warn(`Pipeline - Failed to parse JSON-LD: ${error.message}`);
        }
      });

      return events;
    }, { domain: 'wegottickets.com', priority: 1 });
  }
}

class QuartersScraper extends BaseScraper {
  constructor() {
    super('Quarters', 'https://quartersbrighton.co.uk/whatson');
  }

  async scrape() {
    return globalRateLimiter.execute(async () => {
      const $ = await this.fetchAndParseHTML(this.baseUrl);

      const events = [];
      $('.w-dyn-item').each((_, element) => {
        const title = $(element).find('h5').text().trim();
        const link = $(element).find('a').first().attr('href');

        // Get all text content and find date pattern
        const allText = $(element).text();
        const dateMatch = allText.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}/);
        const dateText = dateMatch ? dateMatch[0] : '';

        const fullLink = link?.startsWith('http') ? link : `https://quartersbrighton.co.uk${link}`;

        if (title && dateText) {
          const dateUnix = this.parseEventDate(dateText, title);
          events.push(this.createEvent({ title, date: dateText, link: fullLink, dateUnix }));
        }
      });

      return events;
    }, { domain: 'quartersbrighton.co.uk', priority: 1 });
  }
}

class RossiBarScraper extends BaseScraper {
  constructor() {
    super('Rossi Bar', 'https://therossibar.co.uk/events/');
  }

  async scrape() {
    return globalRateLimiter.execute(async () => {
      const $ = await this.fetchAndParseHTML(this.baseUrl);

      const events = [];
      $('h3').each((_, element) => {
        const title = $(element).text().trim();
        // Date is typically in the next sibling or nearby text
        const dateText = $(element).parent().text().replace(title, '').trim().split('\n')[0];
        const link = $(element).parent().find('a[href*="/events/"]').attr('href');
        const fullLink = link?.startsWith('http') ? link : `https://therossibar.co.uk${link}`;

        if (title && dateText) {
          const dateUnix = this.parseEventDate(dateText, title);
          events.push(this.createEvent({ title, date: dateText, link: fullLink, dateUnix }));
        }
      });

      return events;
    }, { domain: 'therossibar.co.uk', priority: 1 });
  }
}

class RoseHillScraper extends BaseScraper {
  constructor() {
    super('The Rose Hill', 'https://therosehill.co.uk/events/?event-type=gig');
  }

  async scrape() {
    return globalRateLimiter.execute(async () => {
      const $ = await this.fetchAndParseHTML(this.baseUrl);

      const events = [];
      $('a[href*="/event/"]').each((_, element) => {
        const title = $(element).find('h2, h3').first().text().trim();
        const fullText = $(element).text();
        // Extract date pattern like "Thu 27th Nov"
        const dateMatch = fullText.match(/([A-Za-z]{3})\s+(\d{1,2}(?:st|nd|rd|th))\s+([A-Za-z]{3})/);
        const dateText = dateMatch ? dateMatch[0] : '';
        const link = $(element).attr('href');
        const fullLink = link?.startsWith('http') ? link : `https://therosehill.co.uk${link}`;

        if (title && dateText) {
          const dateUnix = this.parseEventDate(dateText, title);
          events.push(this.createEvent({ title, date: dateText, link: fullLink, dateUnix }));
        }
      });

      return events;
    }, { domain: 'therosehill.co.uk', priority: 1 });
  }
}

class BrightonDomeScraper extends BaseScraper {
  constructor() {
    super('Brighton Dome', 'https://brightondome.org/whats-on/#genre=85&calendar=false,false&top_filter=all&page=1&view=list');
  }

  async scrape() {
    return globalRateLimiter.execute(async () => {
      const $ = await this.fetchAndParseHTML(this.baseUrl);

      const events = [];
      // Extract JavaScript _filter_data.push() statements from script tags
      $('script').each((_, element) => {
        const scriptContent = $(element).html();
        if (scriptContent && scriptContent.includes('_filter_data.push')) {
          try {
            // Extract all _filter_data.push({...}) statements
            const pushMatches = scriptContent.matchAll(/_filter_data\.push\(\s*(\{[\s\S]*?\})\s*\);/g);

            for (const match of pushMatches) {
              try {
                // Clean up the JavaScript to be valid JSON
                const jsonString = match[1]
                  .replace(/\/\*/g, '')  // Remove /*
                  .replace(/\*\//g, '')  // Remove */
                  .replace(/,(\s*[}\]])/g, '$1'); // Remove trailing commas

                const event = JSON.parse(jsonString);

                const title = event.title || event.name || '';
                const dateFormatted = event.date_formatted || '';
                const link = event.url || '';
                const fullLink = link?.startsWith('http') ? link : `https://brightondome.org${link}`;

                // Use Unix timestamp if available, otherwise parse formatted date
                let dateUnix;
                if (event.start_date) {
                  dateUnix = event.start_date * 1000; // Convert seconds to milliseconds
                } else {
                  dateUnix = this.parseEventDate(dateFormatted, title);
                }

                events.push(this.createEvent({
                  title,
                  date: dateFormatted,
                  link: fullLink,
                  dateUnix
                }));
              } catch (parseError) {
                console.warn(`Brighton Dome - Failed to parse individual event: ${parseError.message}`);
              }
            }
          } catch (error) {
            console.warn(`Brighton Dome - Failed to extract _filter_data: ${error.message}`);
          }
        }
      });

      return events;
    }, { domain: 'brightondome.org', priority: 1 });
  }
}

const scrapeSites = async () => {
  const startTime = Date.now();
  const allEvents = [];
  const allErrors = [];
  const allWarnings = [];
  
  const scrapeStats = {
    successful: 0,
    failed: 0,
    warnings: 0,
    venues: {},
    rateLimiter: {},
    executionTime: 0
  };

  // Initialize venue scrapers
  const scrapers = [
    new HopeRuinScraper(),
    new GreenDoorScraper(),
    new ConcordeTwoScraper(),
    new ChalkScraper(),
    new FolkloreRoomsScraper(),
    new PrinceAlbertScraper(),
    new PipelineScraper(),
    new QuartersScraper(),
    new RossiBarScraper(),
    new RoseHillScraper(),
    new BrightonDomeScraper()
  ];

  console.log(`=== Starting Parallel Scraping (${scrapers.length} venues) ===`);
  console.log(`Rate Limiter: Max ${globalRateLimiter.maxConcurrent} concurrent, ${globalRateLimiter.requestsPerSecond} RPS`);

  try {
    // Execute all scrapers in parallel with error isolation
    const scrapePromises = scrapers.map(scraper => scraper.execute());
    const results = await Promise.allSettled(scrapePromises);

    // Process results
    results.forEach((result, index) => {
      const scraper = scrapers[index];
      const venueName = scraper.venueName;

      if (result.status === 'fulfilled') {
        const { success, events, context, error } = result.value;
        
        if (success && events && events.length > 0) {
          // Validate events with enhanced context
          const validation = validateEvents(events, {
            venue: venueName,
            scraper: scraper.constructor.name
          });
          
          if (validation.valid.length > 0) {
            allEvents.push(...validation.valid);
          }
          
          if (validation.warnings.length > 0) {
            allWarnings.push(...validation.warnings);
            scrapeStats.warnings++;
          }
          
          if (validation.invalid.length > 0) {
            allErrors.push(...validation.invalid);
          }
          
          scrapeStats.successful++;
          scrapeStats.venues[venueName] = {
            status: 'success',
            events: validation.valid.length,
            invalidEvents: validation.invalid.length,
            warnings: validation.warnings.length,
            rawEvents: events.length,
            validationErrors: validation.stats.errors,
            warningTypes: validation.stats.warningTypes,
            executionTime: context.duration,
            scraper: context.scraper
          };
          
          console.log(`✓ ${venueName}: ${validation.valid.length}/${events.length} valid events` + 
                     (validation.warnings.length > 0 ? ` (${validation.warnings.length} warnings)` : ''));
          
          if (validation.invalid.length > 0) {
            console.log(`  ⚠ ${validation.invalid.length} events failed validation`);
          }
        } else if (success) {
          scrapeStats.venues[venueName] = { 
            status: 'no_events', 
            events: 0, 
            executionTime: context.duration,
            scraper: context.scraper
          };
          console.log(`⚠ ${venueName}: No events found`);
        } else {
          // Success = false, but fulfilled promise (handled error)
          scrapeStats.failed++;
          scrapeStats.venues[venueName] = {
            status: 'error',
            error: error.message,
            errorContext: error.context || {},
            events: 0,
            executionTime: context.duration,
            scraper: context.scraper
          };
          console.error(`✗ ${venueName} failed: ${error.message}`);
        }
      } else {
        // Promise rejected (unexpected error)
        scrapeStats.failed++;
        scrapeStats.venues[venueName] = {
          status: 'error',
          error: result.reason?.message || 'Unknown error',
          events: 0,
          scraper: scraper.constructor.name
        };
        console.error(`✗ ${venueName} failed unexpectedly: ${result.reason?.message}`);
      }
    });

    // Sort all events by date
    allEvents.sort((a, b) => {
      if (a.dateUnix === null && b.dateUnix === null) return 0;
      if (a.dateUnix === null) return 1;
      if (b.dateUnix === null) return -1;
      return a.dateUnix - b.dateUnix;
    });

    const executionTime = Date.now() - startTime;
    scrapeStats.executionTime = executionTime;
    scrapeStats.rateLimiter = globalRateLimiter.getStats();

    // Write all events to a JSON file
    await fs.writeFile('./data/events.json', JSON.stringify(allEvents, null, 2));
    
    // Write detailed scraping statistics
    await fs.writeFile('./data/scrape-stats.json', JSON.stringify({
      timestamp: new Date().toISOString(),
      totalEvents: allEvents.length,
      nullDates: allEvents.filter(e => e.dateUnix === null).length,
      totalErrors: allErrors.length,
      totalWarnings: allWarnings.length,
      ...scrapeStats
    }, null, 2));
    
    // Write detailed error log if there are errors
    if (allErrors.length > 0) {
      await fs.writeFile('./data/scrape-errors.json', JSON.stringify(allErrors, null, 2));
    }
    
    // Write warnings log if there are warnings
    if (allWarnings.length > 0) {
      await fs.writeFile('./data/scrape-warnings.json', JSON.stringify(allWarnings, null, 2));
    }

    console.log(`\n=== Scraping Summary ===`);
    console.log(`Execution time: ${executionTime}ms`);
    console.log(`Total events: ${allEvents.length}`);
    console.log(`Successful venues: ${scrapeStats.successful}`);
    console.log(`Failed venues: ${scrapeStats.failed}`);
    console.log(`Venues with warnings: ${scrapeStats.warnings}`);
    console.log(`Events with parsing issues: ${allEvents.filter(e => e.dateUnix === null).length}`);
    console.log(`Total validation errors: ${allErrors.length}`);
    console.log(`Total warnings: ${allWarnings.length}`);
    console.log('\nRate Limiter Stats:');
    console.log(`- Active requests: ${scrapeStats.rateLimiter.activeRequests}`);
    console.log(`- Queue length: ${scrapeStats.rateLimiter.queueLength}`);
    console.log(`- Consecutive errors: ${scrapeStats.rateLimiter.consecutiveErrors}`);
    console.log('\nData written to events.json and scrape-stats.json');
    
    if (allErrors.length > 0) {
      console.log('Error details written to scrape-errors.json');
    }
    if (allWarnings.length > 0) {
      console.log('Warning details written to scrape-warnings.json');
    }
    
  } catch (error) {
    console.error('Critical error in scraping process:', error.message);
    throw error;
  }
};


// Start the scraping
scrapeSites();