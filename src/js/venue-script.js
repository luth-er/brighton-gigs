// Venue-Specific Script
// Handles venue filtering and display for individual venue pages

// Import dynamic SEO functionality
if (typeof window !== 'undefined') {
    const script = document.createElement('script');
    script.src = './seo-dynamic.js';
    script.async = true;
    document.head.appendChild(script);
}

// Date formatting function - Swiss style (reused from main script)
const formatDate = (unixTimestamp) => {
    const date = new Date(unixTimestamp);
    const day = date.getDate();
    const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    return `${day} ${month} ${year}`.toUpperCase();
};

let allEvents = [];
let venueEvents = [];
let filteredEvents = [];
let currentVenue = '';

// Get venue from data attribute
const getCurrentVenue = () => {
    const script = document.querySelector('script[data-venue]');
    return script ? script.getAttribute('data-venue') : '';
};

// Filter functions
const formatDateForInput = (unixTimestamp) => {
    const date = new Date(unixTimestamp);
    return date.toISOString().split('T')[0];
};

const getDateRange = (events) => {
    if (!events.length) return { min: Date.now(), max: Date.now() };
    
    const dates = events.map(event => event.dateUnix);
    return {
        min: Math.min(...dates),
        max: Math.max(...dates)
    };
};

const filterEvents = () => {
    const dateFromFilter = document.getElementById('date-from').value;
    const dateToFilter = document.getElementById('date-to').value;

    let filtered = [...venueEvents];

    if (dateFromFilter) {
        const fromDate = new Date(dateFromFilter).getTime();
        filtered = filtered.filter(event => event.dateUnix >= fromDate);
    }

    if (dateToFilter) {
        const toDate = new Date(dateToFilter).getTime() + (24 * 60 * 60 * 1000) - 1; // End of day
        filtered = filtered.filter(event => event.dateUnix <= toDate);
    }

    filteredEvents = filtered;
    displayEvents();
    updateEventCount();
};

const clearFilters = () => {
    document.getElementById('date-from').value = '';
    document.getElementById('date-to').value = '';
    
    filteredEvents = [...venueEvents];
    displayEvents();
    updateEventCount();
};

const displayEvents = () => {
    const eventsContainer = document.getElementById('events-list');
    
    if (filteredEvents.length === 0) {
        eventsContainer.innerHTML = `
            <div class="no-events" role="status" aria-live="polite">
                No events found matching your criteria. Try adjusting your filters.
            </div>
        `;
        return;
    }

    // Sort events by date
    const sortedEvents = [...filteredEvents].sort((a, b) => a.dateUnix - b.dateUnix);
    
    eventsContainer.innerHTML = sortedEvents.map(event => `
        <article class="event-item" role="listitem">
            <div class="event-date">${formatDate(event.dateUnix)}</div>
            <h2 class="event-title">
                <a href="${event.link}" target="_blank" rel="noopener noreferrer">
                    ${event.title}
                </a>
            </h2>
            <div class="event-venue">${event.venue}</div>
        </article>
    `).join('');
};

const updateEventCount = () => {
    const countElement = document.getElementById('event-count');
    if (countElement) {
        const count = filteredEvents.length;
        countElement.textContent = `${count} upcoming event${count !== 1 ? 's' : ''}`;
    }
};

const initializeDateRange = () => {
    if (venueEvents.length === 0) return;
    
    const { min, max } = getDateRange(venueEvents);
    
    const dateFromInput = document.getElementById('date-from');
    const dateToInput = document.getElementById('date-to');
    
    if (dateFromInput && dateToInput) {
        dateFromInput.min = formatDateForInput(min);
        dateFromInput.max = formatDateForInput(max);
        dateToInput.min = formatDateForInput(min);
        dateToInput.max = formatDateForInput(max);
    }
};

// Event listeners
const setupEventListeners = () => {
    const dateFromFilter = document.getElementById('date-from');
    const dateToFilter = document.getElementById('date-to');
    const clearButton = document.getElementById('clear-filters');

    if (dateFromFilter) dateFromFilter.addEventListener('change', filterEvents);
    if (dateToFilter) dateToFilter.addEventListener('change', filterEvents);
    if (clearButton) clearButton.addEventListener('click', clearFilters);
};

// No hardcoded CSS - using design system from styles.css

// Load and initialize
const loadEvents = async () => {
    try {
        // Load from relative path based on venue page location
        const response = await fetch('../data/events.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        allEvents = await response.json();
        currentVenue = getCurrentVenue();
        
        // Filter events for current venue
        venueEvents = allEvents.filter(event => event.venue === currentVenue);
        filteredEvents = [...venueEvents];
        
        // Display events and initialize
        displayEvents();
        initializeDateRange();
        updateEventCount();
        
        // Initialize dynamic SEO with venue data
        if (window.dynamicSEO) {
            window.dynamicSEO.init(currentVenue, venueEvents.length, venueEvents);
        } else {
            // Wait for SEO script to load
            setTimeout(() => {
                if (window.dynamicSEO) {
                    window.dynamicSEO.init(currentVenue, venueEvents.length, venueEvents);
                }
            }, 500);
        }
        
    } catch (error) {
        console.error('Error loading events:', error);
        document.getElementById('events-list').innerHTML = `
            <div class="no-events">
                <h3>Unable to load events</h3>
                <p>Please try refreshing the page or check back later.</p>
            </div>
        `;
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setupEventListeners();
        loadEvents();
    });
} else {
    setupEventListeners();
    loadEvents();
}