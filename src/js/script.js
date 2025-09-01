// Date formatting function - Swiss style
const formatDate = (unixTimestamp) => {
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
};

let allEvents = [];
let filteredEvents = [];

// Filter functions
const getUniqueVenues = (events) => {
    const venues = [...new Set(events.map(event => event.venue))];
    return venues.sort();
};

const populateVenueFilter = (venues) => {
    const venueSelect = document.getElementById('venue-filter');
    venues.forEach(venue => {
        const option = document.createElement('option');
        option.value = venue;
        option.textContent = venue;
        venueSelect.appendChild(option);
    });
};

const formatDateForInput = (unixTimestamp) => {
    const date = new Date(unixTimestamp);
    return date.toISOString().split('T')[0];
};

const getDateRange = (events) => {
    const dates = events.map(event => event.dateUnix);
    return {
        min: Math.min(...dates),
        max: Math.max(...dates)
    };
};

const filterEvents = () => {
    const venueFilter = document.getElementById('venue-filter').value;
    const dateFromFilter = document.getElementById('date-from').value;
    const dateToFilter = document.getElementById('date-to').value;
    
    filteredEvents = allEvents.filter(event => {
        // Venue filter
        if (venueFilter && event.venue !== venueFilter) {
            return false;
        }
        
        // Date filters
        if (dateFromFilter) {
            const fromDate = new Date(dateFromFilter).getTime();
            if (event.dateUnix < fromDate) {
                return false;
            }
        }
        
        if (dateToFilter) {
            const toDate = new Date(dateToFilter).getTime() + (24 * 60 * 60 * 1000) - 1; // End of day
            if (event.dateUnix > toDate) {
                return false;
            }
        }
        
        return true;
    });
    
    displayEvents(filteredEvents);
};

const displayEvents = (events) => {
    const eventsList = document.getElementById('events-list');
    
    if (events.length === 0) {
        eventsList.innerHTML = '<div class="no-events">No events found matching your criteria.</div>';
        return;
    }
    
    let eventsHTML = '';
    events.forEach(event => {
        eventsHTML += `
            <article class="event-item" role="listitem">
                <div class="event-date">${formatDate(event.dateUnix)}</div>
                <h2 class="event-title">
                    <a href="${event.link}" target="_blank" rel="noopener">${event.title}</a>
                </h2>
                <div class="event-venue">${event.venue}</div>
            </article>
        `;
    });
    
    eventsList.innerHTML = eventsHTML;
};

const clearFilters = () => {
    document.getElementById('venue-filter').value = '';
    document.getElementById('date-from').value = '';
    document.getElementById('date-to').value = '';
    filteredEvents = [...allEvents];
    displayEvents(filteredEvents);
};

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('venue-filter').addEventListener('change', filterEvents);
    document.getElementById('date-from').addEventListener('change', filterEvents);
    document.getElementById('date-to').addEventListener('change', filterEvents);
    document.getElementById('clear-filters').addEventListener('click', clearFilters);
});

// Initialize the application
const initApp = () => {
    // Show loading state
    const eventsList = document.getElementById('events-list');
    eventsList.innerHTML = '<div class="events-loading">Loading events...</div>';
    
    // Fetch events from JSON file
    fetch('data/events.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to load events: ${response.status}`);
            }
            return response.json();
        })
        .then(events => {
            // Store all events
            allEvents = events.sort((a, b) => a.dateUnix - b.dateUnix);
            filteredEvents = [...allEvents];
            
            // Populate filters
            const uniqueVenues = getUniqueVenues(allEvents);
            populateVenueFilter(uniqueVenues);
            
            // Set date range hints
            const dateRange = getDateRange(allEvents);
            document.getElementById('date-from').min = formatDateForInput(dateRange.min);
            document.getElementById('date-from').max = formatDateForInput(dateRange.max);
            document.getElementById('date-to').min = formatDateForInput(dateRange.min);
            document.getElementById('date-to').max = formatDateForInput(dateRange.max);
            
            // Display all events initially
            displayEvents(filteredEvents);
            
            console.log(`✓ Loaded ${allEvents.length} events from ${uniqueVenues.length} venues`);
        })
        .catch(error => {
            console.error('✗ Error loading events:', error);
            eventsList.innerHTML = '<div class="no-events">Failed to load events. Please refresh the page.</div>';
        });
};

// Start the application when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);