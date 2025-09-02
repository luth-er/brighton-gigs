/**
 * BaseScraper - Abstract base class for all venue scrapers
 * Provides common functionality, error handling, and standardized interface
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import toUnixTimestamp from '../utils/date-parser.js';

class BaseScraper {
  constructor(venueName, baseUrl, options = {}) {
    this.venueName = venueName;
    this.baseUrl = baseUrl;
    this.timeout = options.timeout || 10000;
    this.retryAttempts = options.retryAttempts || 3;
    this.retryDelay = options.retryDelay || 1000;
  }

  /**
   * Fetch and parse HTML with error handling and retries
   */
  async fetchAndParseHTML(url, options = {}) {
    const finalTimeout = options.timeout || this.timeout;
    let lastError;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const { data } = await axios.get(url, { 
          timeout: finalTimeout,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; Brighton-Gigs-Scraper/1.0)',
            ...options.headers
          }
        });
        return cheerio.load(data);
      } catch (error) {
        lastError = this.createErrorContext(error, url, attempt);
        
        if (attempt < this.retryAttempts) {
          const delay = this.calculateRetryDelay(attempt);
          console.warn(`${this.venueName} - Attempt ${attempt} failed, retrying in ${delay}ms: ${error.message}`);
          await this.sleep(delay);
        }
      }
    }

    throw lastError;
  }

  /**
   * Parse event date with error context
   */
  parseEventDate(date, eventTitle) {
    try {
      return toUnixTimestamp(date);
    } catch (error) {
      console.error(`${this.venueName} - Date parsing error for "${eventTitle}": ${error.message}`);
      return null;
    }
  }

  /**
   * Create standardized event object
   */
  createEvent(data) {
    return {
      title: data.title?.trim() || '',
      date: data.date?.trim() || '',
      venue: this.venueName,
      link: data.link?.trim() || null,
      dateUnix: data.dateUnix || null,
      scrapedAt: new Date().toISOString(),
      scraper: this.constructor.name
    };
  }

  /**
   * Calculate exponential backoff delay
   */
  calculateRetryDelay(attempt) {
    return Math.min(this.retryDelay * Math.pow(2, attempt - 1), 10000);
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create detailed error context
   */
  createErrorContext(error, url, attempt = 1) {
    const context = {
      venue: this.venueName,
      url,
      attempt,
      timestamp: new Date().toISOString(),
      originalError: error.message
    };

    let message = `${this.venueName} scraping failed`;
    
    if (error.code === 'ECONNABORTED') {
      message += ` - Request timeout (${this.timeout}ms)`;
      context.errorType = 'timeout';
    } else if (error.response) {
      message += ` - HTTP ${error.response.status}`;
      context.errorType = 'http_error';
      context.statusCode = error.response.status;
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      message += ` - Connection failed`;
      context.errorType = 'connection_error';
    } else {
      context.errorType = 'unknown';
    }

    const enhancedError = new Error(message);
    enhancedError.context = context;
    return enhancedError;
  }

  /**
   * Validate scraper configuration
   */
  validateConfig() {
    if (!this.venueName || typeof this.venueName !== 'string') {
      throw new Error('Venue name is required and must be a string');
    }
    if (!this.baseUrl || typeof this.baseUrl !== 'string') {
      throw new Error('Base URL is required and must be a string');
    }
  }

  /**
   * Abstract method - must be implemented by subclasses
   */
  async scrape() {
    throw new Error(`Scrape method must be implemented by ${this.constructor.name}`);
  }

  /**
   * Execute scraping with full error handling and monitoring
   */
  async execute() {
    const startTime = Date.now();
    const context = {
      venue: this.venueName,
      startTime: new Date().toISOString(),
      scraper: this.constructor.name
    };

    try {
      this.validateConfig();
      console.log(`${this.venueName} - Starting scrape...`);
      
      const rawEvents = await this.scrape();
      const duration = Date.now() - startTime;
      
      context.endTime = new Date().toISOString();
      context.duration = duration;
      context.eventsFound = rawEvents?.length || 0;
      context.status = 'success';
      
      console.log(`${this.venueName} - Completed in ${duration}ms, found ${context.eventsFound} events`);
      
      return {
        success: true,
        events: rawEvents || [],
        context
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      context.endTime = new Date().toISOString();
      context.duration = duration;
      context.status = 'error';
      context.error = error.context || {
        message: error.message,
        errorType: 'scraping_error'
      };
      
      console.error(`${this.venueName} - Failed after ${duration}ms: ${error.message}`);
      
      return {
        success: false,
        events: [],
        context,
        error
      };
    }
  }
}

export default BaseScraper;