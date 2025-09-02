/**
 * Rate Limiter - Controls request frequency to prevent overwhelming target servers
 * Implements token bucket algorithm with exponential backoff and queue management
 */

class RateLimiter {
  constructor(options = {}) {
    this.maxConcurrent = options.maxConcurrent || 3;
    this.requestsPerSecond = options.requestsPerSecond || 2;
    this.minDelay = options.minDelay || 500; // Minimum delay between requests
    this.maxDelay = options.maxDelay || 10000; // Maximum delay for backoff
    this.backoffMultiplier = options.backoffMultiplier || 2;
    
    this.activeRequests = 0;
    this.requestQueue = [];
    this.lastRequestTime = 0;
    this.consecutiveErrors = 0;
    
    // Per-domain tracking
    this.domainStats = new Map();
  }

  /**
   * Execute a function with rate limiting
   */
  async execute(fn, options = {}) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({
        fn,
        resolve,
        reject,
        options: {
          priority: options.priority || 0,
          domain: options.domain || 'default',
          timeout: options.timeout || 30000,
          ...options
        }
      });
      
      this.processQueue();
    });
  }

  /**
   * Process the request queue
   */
  async processQueue() {
    // Don't process if we're at max concurrent requests
    if (this.activeRequests >= this.maxConcurrent || this.requestQueue.length === 0) {
      return;
    }

    // Sort queue by priority (higher numbers = higher priority)
    this.requestQueue.sort((a, b) => b.options.priority - a.options.priority);

    const request = this.requestQueue.shift();
    if (!request) return;

    this.activeRequests++;

    try {
      // Apply rate limiting delay
      const delay = this.calculateDelay(request.options.domain);
      if (delay > 0) {
        await this.sleep(delay);
      }

      this.updateLastRequestTime();
      
      // Execute the function with timeout
      const result = await this.executeWithTimeout(request.fn, request.options.timeout);
      
      // Success - reset error count for this domain
      this.updateDomainStats(request.options.domain, true);
      this.consecutiveErrors = 0;
      
      request.resolve(result);
    } catch (error) {
      // Error - increment counters and apply backoff
      this.updateDomainStats(request.options.domain, false);
      this.consecutiveErrors++;
      
      request.reject(error);
    } finally {
      this.activeRequests--;
      
      // Process next item in queue
      setTimeout(() => this.processQueue(), 10);
    }
  }

  /**
   * Calculate delay based on rate limiting rules and backoff
   */
  calculateDelay(domain = 'default') {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const baseDelay = 1000 / this.requestsPerSecond; // Convert RPS to delay
    
    let delay = Math.max(0, baseDelay - timeSinceLastRequest);
    
    // Apply minimum delay
    delay = Math.max(delay, this.minDelay);
    
    // Apply exponential backoff for consecutive errors
    if (this.consecutiveErrors > 0) {
      const backoffDelay = this.minDelay * Math.pow(this.backoffMultiplier, this.consecutiveErrors - 1);
      delay = Math.max(delay, Math.min(backoffDelay, this.maxDelay));
    }
    
    // Apply per-domain backoff if needed
    const domainStats = this.domainStats.get(domain);
    if (domainStats && domainStats.consecutiveErrors > 0) {
      const domainBackoff = this.minDelay * Math.pow(this.backoffMultiplier, domainStats.consecutiveErrors - 1);
      delay = Math.max(delay, Math.min(domainBackoff, this.maxDelay));
    }
    
    return delay;
  }

  /**
   * Update domain-specific statistics
   */
  updateDomainStats(domain, success) {
    if (!this.domainStats.has(domain)) {
      this.domainStats.set(domain, {
        requests: 0,
        successes: 0,
        errors: 0,
        consecutiveErrors: 0,
        lastRequestTime: 0
      });
    }
    
    const stats = this.domainStats.get(domain);
    stats.requests++;
    stats.lastRequestTime = Date.now();
    
    if (success) {
      stats.successes++;
      stats.consecutiveErrors = 0;
    } else {
      stats.errors++;
      stats.consecutiveErrors++;
    }
  }

  /**
   * Update global last request time
   */
  updateLastRequestTime() {
    this.lastRequestTime = Date.now();
  }

  /**
   * Execute function with timeout
   */
  async executeWithTimeout(fn, timeout) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Rate limiter timeout after ${timeout}ms`));
      }, timeout);

      fn().then(result => {
        clearTimeout(timeoutId);
        resolve(result);
      }).catch(error => {
        clearTimeout(timeoutId);
        reject(error);
      });
    });
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current statistics
   */
  getStats() {
    const domainStatsObj = {};
    for (const [domain, stats] of this.domainStats.entries()) {
      domainStatsObj[domain] = {
        ...stats,
        successRate: stats.requests > 0 ? (stats.successes / stats.requests * 100).toFixed(2) + '%' : '0%'
      };
    }

    return {
      activeRequests: this.activeRequests,
      queueLength: this.requestQueue.length,
      consecutiveErrors: this.consecutiveErrors,
      lastRequestTime: this.lastRequestTime,
      domains: domainStatsObj
    };
  }

  /**
   * Reset error counters (useful for recovery)
   */
  resetErrors(domain = null) {
    if (domain) {
      const stats = this.domainStats.get(domain);
      if (stats) {
        stats.consecutiveErrors = 0;
      }
    } else {
      this.consecutiveErrors = 0;
      for (const stats of this.domainStats.values()) {
        stats.consecutiveErrors = 0;
      }
    }
  }

  /**
   * Clear the request queue (emergency stop)
   */
  clearQueue() {
    const cleared = this.requestQueue.length;
    this.requestQueue.forEach(request => {
      request.reject(new Error('Request cancelled - queue cleared'));
    });
    this.requestQueue = [];
    return cleared;
  }
}

// Export singleton instance for global use
const globalRateLimiter = new RateLimiter({
  maxConcurrent: 3,
  requestsPerSecond: 2,
  minDelay: 500,
  maxDelay: 10000
});

export { RateLimiter, globalRateLimiter };