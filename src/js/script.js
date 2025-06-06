// Date formatting functions
const getOrdinalSuffix = (day) => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
    }
};

const formatDate = (unixTimestamp) => {
    const date = new Date(unixTimestamp);
    const day = date.getDate();
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day}${getOrdinalSuffix(day)} ${month} ${year}`;
};

// Fetch events from JSON file
fetch('data/events.json')
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(events => {
        const eventsList = document.getElementById('events-list');
        
        // Debug: Log the number of events
        console.log(`Number of events: ${events.length}`);
        
        // Sort events by date
        events.sort((a, b) => a.dateUnix - b.dateUnix);
        
        let eventsHTML = '<ul>';
        events.forEach(event => {
            eventsHTML += `
                <li>
                    <h2>${event.title}</h2>
                    <p>Date: ${formatDate(event.dateUnix)}</p>
                    <p class="venue">Venue: ${event.venue}</p>
                    <a href="${event.link}" target="_blank">More Info</a>
                </li>
            `;
            
            // Debug: Log each event
            console.log(event);
        });
        eventsHTML += '</ul>';
        
        eventsList.innerHTML = eventsHTML;
    })
    .catch(error => {
        console.error('Error:', error);
    });