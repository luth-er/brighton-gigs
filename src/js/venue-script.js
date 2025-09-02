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
            <div class="no-events">
                <h3>No events found for ${currentVenue}</h3>
                <p>Try adjusting your date filters or check back later for new events.</p>
            </div>
        `;
        return;
    }

    // Sort events by date
    const sortedEvents = [...filteredEvents].sort((a, b) => a.dateUnix - b.dateUnix);
    
    eventsContainer.innerHTML = sortedEvents.map(event => `
        <article class="event-card" role="listitem">
            <div class="event-date">
                <span class="date-display">${formatDate(event.dateUnix)}</span>
            </div>
            <div class="event-details">
                <h3 class="event-title">
                    <a href="${event.link}" target="_blank" rel="noopener noreferrer">
                        ${event.title}
                    </a>
                </h3>
                <div class="event-venue">${event.venue}</div>
            </div>
            <div class="event-actions">
                <a href="${event.link}" target="_blank" rel="noopener noreferrer" class="event-link">
                    View Event
                </a>
            </div>
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

// CSS additions for venue pages
const addVenueStyles = () => {
    const style = document.createElement('style');
    style.textContent = `
        /* Venue Navigation Styles */
        .venue-nav {
            margin-top: 16px;
            padding-top: 16px;
            border-top: 1px solid #666;
            font-size: 14px;
            font-weight: 500;
        }
        
        .nav-link {
            color: #666;
            text-decoration: none;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        
        .nav-link:hover {
            color: #000;
        }
        
        .nav-current {
            color: #FF0000;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        
        .nav-separator {
            color: #666;
            margin: 0 12px;
        }
        
        /* Venue Hero Section */
        .venue-hero {
            margin-bottom: 48px;
            padding-bottom: 32px;
            border-bottom: 1px solid #666;
        }
        
        .venue-title {
            font-size: 48px;
            font-weight: 700;
            line-height: 1.1;
            letter-spacing: -0.02em;
            color: #000;
            margin: 0 0 16px 0;
        }
        
        .venue-description {
            font-size: 18px;
            line-height: 1.6;
            color: #666;
            margin: 0 0 16px 0;
            max-width: 600px;
        }
        
        .venue-details {
            font-size: 14px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        
        .venue-location {
            font-weight: 500;
        }
        
        .venue-separator {
            margin: 0 8px;
        }
        
        .event-count {
            color: #FF0000;
            font-weight: 600;
        }
        
        /* No events state */
        .no-events {
            text-align: center;
            padding: 64px 0;
            color: #666;
        }
        
        .no-events h3 {
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 16px;
            color: #000;
        }
        
        .no-events p {
            font-size: 16px;
            line-height: 1.5;
        }
        
        /* Mobile responsive */
        @media (max-width: 768px) {
            .venue-title {
                font-size: 36px;
            }
            
            .venue-nav {
                font-size: 12px;
            }
            
            .nav-separator {
                margin: 0 8px;
            }
            
            .venue-details {
                font-size: 12px;
            }
        }
        
        @media (max-width: 480px) {
            .venue-nav {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
            }
            
            .nav-separator {
                display: none;
            }
            
            .venue-details {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }
            
            .venue-separator {
                display: none;
            }
        }
    `;
    document.head.appendChild(style);
};

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
        addVenueStyles();
        setupEventListeners();
        loadEvents();
    });
} else {
    addVenueStyles();
    setupEventListeners();
    loadEvents();
}