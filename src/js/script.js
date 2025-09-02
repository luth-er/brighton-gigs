/**
 * Brighton Gigs - Refactored Frontend Application
 * Class-based architecture with proper state management, security, and performance
 */

import { createFilterDebouncer } from '../utils/debounce.js';
import { sanitizeEvents, escapeHtml } from '../utils/sanitizer.js';

/**
 * Main Application Class - Manages all frontend state and interactions
 */
class BrightonGigsApp {
    constructor() {
        // Application state
        this.state = {
            allEvents: [],
            filteredEvents: [],
            isLoading: false,
            error: null,
            filters: {
                venue: '',
                dateFrom: '',
                dateTo: ''
            },
            ui: {
                hasInitialized: false,
                lastFilterTime: 0,
                performanceMetrics: []
            }
        };
        
        // DOM element cache for performance
        this.elements = {};
        
        // Debounced filter function with performance monitoring
        this.debouncedFilter = createFilterDebouncer(
            this.filterEvents.bind(this),
            300
        );
        
        // Bind methods to preserve context
        this.handleFilterChange = this.handleFilterChange.bind(this);
        this.handleClearFilters = this.handleClearFilters.bind(this);
        this.handleError = this.handleError.bind(this);
        
        console.log('✓ Brighton Gigs App initialized with class-based architecture');
    }
    
    /**
     * Initialize the application
     */
    async init() {
        try {
            this.cacheElements();
            this.attachEventListeners();
            await this.loadEvents();
            this.state.ui.hasInitialized = true;
            console.log('✓ App initialization complete');
        } catch (error) {
            this.handleError(error, 'Failed to initialize application');
        }
    }
    
    /**
     * Cache DOM elements for performance
     */
    cacheElements() {
        const elementIds = [
            'events-list', 'venue-filter', 'date-from', 'date-to', 'clear-filters'
        ];
        
        elementIds.forEach(id => {
            this.elements[id] = document.getElementById(id);
            if (!this.elements[id]) {
                throw new Error(`Required element not found: ${id}`);
            }
        });
        
        console.log('✓ DOM elements cached successfully');
    }
    
    /**
     * Attach event listeners with proper error boundaries
     */
    attachEventListeners() {
        // Filter change listeners with debouncing
        ['venue-filter', 'date-from', 'date-to'].forEach(filterId => {
            this.elements[filterId].addEventListener('change', (event) => {
                this.wrapWithErrorBoundary(() => {
                    this.handleFilterChange(event);
                }, `Filter change: ${filterId}`);
            });
        });
        
        // Clear filters button
        this.elements['clear-filters'].addEventListener('click', (event) => {
            this.wrapWithErrorBoundary(() => {
                this.handleClearFilters(event);
            }, 'Clear filters');
        });
        
        // Global error handlers
        window.addEventListener('error', this.handleError);
        window.addEventListener('unhandledrejection', this.handleError);
        
        console.log('✓ Event listeners attached with error boundaries');
    }

    /**
     * Load and process events from the API
     */
    async loadEvents() {
        this.setLoadingState(true);
        
        try {
            const response = await fetch('data/events.json');
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: Failed to load events`);
            }
            
            const rawEvents = await response.json();
            
            // Sanitize all events for security
            const sanitizedEvents = sanitizeEvents(rawEvents);
            
            // Sort by date and update state
            this.state.allEvents = sanitizedEvents.sort((a, b) => a.dateUnix - b.dateUnix);
            this.state.filteredEvents = [...this.state.allEvents];
            
            // Initialize filters and display
            this.initializeFilters();
            this.displayEvents(this.state.filteredEvents);
            
            console.log(`✓ Loaded ${this.state.allEvents.length} events successfully`);
            
        } catch (error) {
            this.handleError(error, 'Failed to load events');
        } finally {
            this.setLoadingState(false);
        }
    }
    
    /**
     * Initialize filter controls with data from events
     */
    initializeFilters() {
        const uniqueVenues = this.getUniqueVenues(this.state.allEvents);
        this.populateVenueFilter(uniqueVenues);
        
        const dateRange = this.getDateRange(this.state.allEvents);
        this.setDateRangeLimits(dateRange);
        
        console.log(`✓ Filters initialized: ${uniqueVenues.length} venues`);
    }
    
    /**
     * Get unique venues from events
     */
    getUniqueVenues(events) {
        const venues = [...new Set(events.map(event => event.venue))];
        return venues.sort();
    }
    
    /**
     * Populate venue filter dropdown with sanitized options
     */
    populateVenueFilter(venues) {
        const venueSelect = this.elements['venue-filter'];
        
        // Clear existing options except "All Venues"
        Array.from(venueSelect.children).slice(1).forEach(option => option.remove());
        
        venues.forEach(venue => {
            const option = document.createElement('option');
            option.value = venue;
            option.textContent = escapeHtml(venue);
            venueSelect.appendChild(option);
        });
    }
    
    /**
     * Format Unix timestamp for date input
     */
    formatDateForInput(unixTimestamp) {
        const date = new Date(unixTimestamp);
        return date.toISOString().split('T')[0];
    }
    
    /**
     * Get min/max date range from events
     */
    getDateRange(events) {
        if (!events.length) return { min: Date.now(), max: Date.now() };
        
        const dates = events.map(event => event.dateUnix);
        return {
            min: Math.min(...dates),
            max: Math.max(...dates)
        };
    }
    
    /**
     * Set date input limits
     */
    setDateRangeLimits(dateRange) {
        const minDate = this.formatDateForInput(dateRange.min);
        const maxDate = this.formatDateForInput(dateRange.max);
        
        ['date-from', 'date-to'].forEach(dateId => {
            this.elements[dateId].min = minDate;
            this.elements[dateId].max = maxDate;
        });
    }

    /**
     * Filter events based on current filter state
     */
    filterEvents() {
        const startTime = performance.now();
        
        this.state.filteredEvents = this.state.allEvents.filter(event => {
            // Venue filter
            if (this.state.filters.venue && event.venue !== this.state.filters.venue) {
                return false;
            }
            
            // Date from filter
            if (this.state.filters.dateFrom) {
                const fromDate = new Date(this.state.filters.dateFrom).getTime();
                if (event.dateUnix < fromDate) {
                    return false;
                }
            }
            
            // Date to filter (end of selected day)
            if (this.state.filters.dateTo) {
                const toDate = new Date(this.state.filters.dateTo).getTime() + (24 * 60 * 60 * 1000) - 1;
                if (event.dateUnix > toDate) {
                    return false;
                }
            }
            
            return true;
        });
        
        // Track performance
        const filterTime = performance.now() - startTime;
        this.trackFilterPerformance(filterTime);
        
        this.displayEvents(this.state.filteredEvents);
    }
    
    /**
     * Track filter performance for optimization
     */
    trackFilterPerformance(executionTime) {
        this.state.ui.performanceMetrics.push({
            time: Date.now(),
            filterDuration: executionTime,
            eventCount: this.state.allEvents.length,
            resultCount: this.state.filteredEvents.length
        });
        
        // Keep only recent metrics
        if (this.state.ui.performanceMetrics.length > 20) {
            this.state.ui.performanceMetrics = this.state.ui.performanceMetrics.slice(-20);
        }
        
        // Log performance warnings
        if (executionTime > 100) {
            console.warn(`Slow filter operation: ${executionTime.toFixed(2)}ms`);
        }
    }

    /**
     * Display events with performance optimization and error handling
     */
    displayEvents(events) {
        const startTime = performance.now();
        const eventsList = this.elements['events-list'];
        
        try {
            if (events.length === 0) {
                eventsList.innerHTML = this.createEmptyStateHTML();
                return;
            }
            
            // Use document fragments for better performance
            const fragment = document.createDocumentFragment();
            
            events.forEach(event => {
                const eventElement = this.createEventElement(event);
                fragment.appendChild(eventElement);
            });
            
            // Clear and append in one operation
            eventsList.innerHTML = '';
            eventsList.appendChild(fragment);
            
            // Update ARIA attributes
            eventsList.setAttribute('aria-live', 'polite');
            eventsList.setAttribute('aria-label', `${events.length} events displayed`);
            
            const renderTime = performance.now() - startTime;
            console.log(`✓ Rendered ${events.length} events in ${renderTime.toFixed(2)}ms`);
            
        } catch (error) {
            this.handleError(error, 'Failed to display events');
        }
    }
    
    /**
     * Create empty state HTML with helpful messaging
     */
    createEmptyStateHTML() {
        const hasActiveFilters = Object.values(this.state.filters).some(filter => filter !== '');
        const message = hasActiveFilters 
            ? 'No events found matching your criteria. Try adjusting your filters.'
            : 'No events available at the moment.';
            
        return `<div class="no-events" role="status" aria-live="polite">${escapeHtml(message)}</div>`;
    }
    
    /**
     * Create individual event element with proper security
     */
    createEventElement(event) {
        const article = document.createElement('article');
        article.className = 'event-item';
        article.setAttribute('role', 'listitem');
        
        // Date element
        const dateDiv = document.createElement('div');
        dateDiv.className = 'event-date';
        dateDiv.textContent = this.formatDate(event.dateUnix);
        
        // Title element with link
        const titleH2 = document.createElement('h2');
        titleH2.className = 'event-title';
        
        if (event.link) {
            const link = document.createElement('a');
            link.href = event.link;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.innerHTML = event.title; // Already sanitized
            titleH2.appendChild(link);
        } else {
            titleH2.innerHTML = event.title; // Already sanitized
        }
        
        // Venue element
        const venueDiv = document.createElement('div');
        venueDiv.className = 'event-venue';
        venueDiv.textContent = event.venue; // Already sanitized
        
        article.appendChild(dateDiv);
        article.appendChild(titleH2);
        article.appendChild(venueDiv);
        
        return article;
    }
    
    /**
     * Date formatting function - Swiss style
     */
    formatDate(unixTimestamp) {
        const date = new Date(unixTimestamp);
        const day = date.getDate();
        const months = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ];
        const month = months[date.getMonth()];
        const year = date.getFullYear();
        
        // Swiss style: abbreviated, uppercase
        return `${day} ${month} ${year}`.toUpperCase();
    }

    /**
     * Clear all filters and reset state
     */
    clearFilters() {
        // Reset filter state
        this.state.filters = {
            venue: '',
            dateFrom: '',
            dateTo: ''
        };
        
        // Reset UI elements
        this.elements['venue-filter'].value = '';
        this.elements['date-from'].value = '';
        this.elements['date-to'].value = '';
        
        // Cancel any pending debounced filters
        this.debouncedFilter.cancel();
        
        // Reset filtered events and display
        this.state.filteredEvents = [...this.state.allEvents];
        this.displayEvents(this.state.filteredEvents);
        
        console.log('✓ Filters cleared');
    }

    /**
     * Handle filter change events with debouncing
     */
    handleFilterChange(event) {
        const { id, value } = event.target;
        
        // Update state based on filter type
        switch (id) {
            case 'venue-filter':
                this.state.filters.venue = value;
                break;
            case 'date-from':
                this.state.filters.dateFrom = value;
                break;
            case 'date-to':
                this.state.filters.dateTo = value;
                break;
        }
        
        // Apply debounced filtering
        this.debouncedFilter();
    }
    
    /**
     * Handle clear filters button click
     */
    handleClearFilters(event) {
        event.preventDefault();
        this.clearFilters();
    }
    
    /**
     * Set loading state with UI feedback
     */
    setLoadingState(isLoading) {
        this.state.isLoading = isLoading;
        const eventsList = this.elements['events-list'];
        
        if (isLoading) {
            eventsList.innerHTML = '<div class="events-loading" role="status" aria-live="polite">Loading events...</div>';
            eventsList.setAttribute('aria-busy', 'true');
        } else {
            eventsList.setAttribute('aria-busy', 'false');
        }
    }
    
    /**
     * Global error handler with user-friendly messaging
     */
    handleError(error, context = 'Application error') {
        console.error(`✗ ${context}:`, error);
        
        this.state.error = error;
        this.state.isLoading = false;
        
        const eventsList = this.elements['events-list'];
        if (eventsList) {
            const errorMessage = error.message || 'An unexpected error occurred';
            eventsList.innerHTML = `
                <div class="error-state" role="alert" aria-live="assertive">
                    <h3>Something went wrong</h3>
                    <p>${escapeHtml(errorMessage)}</p>
                    <button onclick="location.reload()" class="retry-btn">Retry</button>
                </div>
            `;
        }
    }
    
    /**
     * Wrap function calls with error boundaries
     */
    wrapWithErrorBoundary(fn, context) {
        try {
            return fn();
        } catch (error) {
            this.handleError(error, context);
        }
    }
    
    /**
     * Get current application state (for debugging)
     */
    getState() {
        return { ...this.state };
    }
    
    /**
     * Performance monitoring helper
     */
    getPerformanceMetrics() {
        return {
            averageFilterTime: this.state.ui.performanceMetrics.length 
                ? this.state.ui.performanceMetrics.reduce((sum, m) => sum + m.filterDuration, 0) / this.state.ui.performanceMetrics.length
                : 0,
            totalEvents: this.state.allEvents.length,
            currentResults: this.state.filteredEvents.length,
            isInitialized: this.state.ui.hasInitialized
        };
    }
}

// Global app instance
let app = null;

/**
 * Initialize the application when DOM is ready
 */
document.addEventListener('DOMContentLoaded', async () => {
    try {
        app = new BrightonGigsApp();
        await app.init();
        
        // Expose app instance for debugging (development only)
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            window.brightonGigsApp = app;
            console.log('✓ App instance available at window.brightonGigsApp for debugging');
        }
        
    } catch (error) {
        console.error('✗ Failed to initialize Brighton Gigs app:', error);
        
        // Fallback error display
        const eventsList = document.getElementById('events-list');
        if (eventsList) {
            eventsList.innerHTML = `
                <div class="error-state" role="alert">
                    <h3>Application Failed to Start</h3>
                    <p>Please refresh the page to try again.</p>
                    <button onclick="location.reload()" class="retry-btn">Refresh Page</button>
                </div>
            `;
        }
    }
});

// Service Worker registration for future enhancements
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Only register in production
        if (window.location.protocol === 'https:' || window.location.hostname === 'localhost') {
            console.log('✓ Service Worker support detected');
            // SW registration would go here in the future
        }
    });
}