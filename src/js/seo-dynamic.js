// Dynamic SEO Meta Tag System
// Updates page titles and descriptions based on current date and events

class DynamicSEO {
    constructor() {
        this.currentDate = new Date();
        this.dateFormatted = this.formatDateForSEO();
        this.isTonight = this.isTonight();
        this.isTodayEventDate = this.isTodayEventDate();
    }

    formatDateForSEO() {
        const options = { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
        };
        return this.currentDate.toLocaleDateString('en-GB', options);
    }

    isTonight() {
        const currentHour = this.currentDate.getHours();
        return currentHour >= 16; // After 4 PM consider it "tonight"
    }

    isTodayEventDate() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today;
    }

    updateMainPageMeta() {
        const timeContext = this.isTonight ? 'Tonight' : 'Today';
        const title = `Brighton Gigs ${timeContext} - Live Music Events ${this.dateFormatted}`;
        
        document.title = title;
        this.updateMetaTag('description', 
            `Find ${timeContext.toLowerCase()}'s best gigs in Brighton UK. Live music at Hope & Ruin, Chalk, Concorde 2 & more. Updated for ${this.dateFormatted}.`
        );
        this.updateMetaTag('og:title', title);
        this.updateMetaTag('keywords', 
            `Brighton gigs ${timeContext.toLowerCase()}, Brighton concerts ${this.dateFormatted}, live music Brighton, tonight's gigs Brighton`
        );
    }

    updateVenuePageMeta(venue, eventCount) {
        const timeContext = this.isTonight ? 'Tonight' : 'Today';
        const venueKeywords = this.getVenueKeywords(venue);
        
        let title = `${venue} Events Brighton ${timeContext} | ${eventCount} Live Gigs`;
        if (eventCount === 0) {
            title = `${venue} Events Brighton | Upcoming Live Music & Concerts`;
        }
        
        document.title = title;
        
        let description = `${venue} Brighton events ${timeContext.toLowerCase()}. ${eventCount} upcoming live music gigs at Brighton's ${this.getVenueDescription(venue)}. Updated ${this.dateFormatted}.`;
        if (eventCount === 0) {
            description = `${venue} Brighton - Check upcoming live music events and concerts. ${this.getVenueDescription(venue)}. Updated daily with new gigs.`;
        }
        
        this.updateMetaTag('description', description);
        this.updateMetaTag('og:title', title);
        this.updateMetaTag('og:description', description);
        this.updateMetaTag('keywords', venueKeywords);
    }

    getVenueKeywords(venue) {
        const baseKeywords = `${venue} Brighton, ${venue} events, ${venue} gigs, Brighton live music, Brighton venues`;
        
        const venueSpecific = {
            'Hope & Ruin': 'Hope and Ruin Brighton, indie venue Brighton, electronic music Brighton, emerging artists Brighton',
            'Chalk': 'Chalk Brighton gigs, rock venue Brighton, punk venue Brighton, alternative music Brighton',
            'Concorde 2': 'Concorde 2 concerts, Concorde 2 Brighton, major artists Brighton, Brighton seafront venue'
        };

        return `${baseKeywords}, ${venueSpecific[venue] || ''}`;
    }

    getVenueDescription(venue) {
        const descriptions = {
            'Hope & Ruin': 'premier indie venue featuring electronic and emerging artists',
            'Chalk': 'iconic rock and punk venue in an intimate basement setting', 
            'Concorde 2': 'largest music venue hosting major touring artists'
        };
        
        return descriptions[venue] || 'popular Brighton music venue';
    }

    updateMetaTag(property, content) {
        // Handle different meta tag formats
        const selectors = [
            `meta[name="${property}"]`,
            `meta[property="${property}"]`,
            `meta[property="og:${property}"]`
        ];

        for (const selector of selectors) {
            const tag = document.querySelector(selector);
            if (tag) {
                tag.setAttribute('content', content);
                break;
            }
        }
    }

    generateStructuredData(venue, events) {
        if (!venue || !events.length) return;

        const eventsSchema = events.slice(0, 5).map(event => ({
            "@type": "Event",
            "name": event.title,
            "startDate": new Date(event.dateUnix).toISOString(),
            "location": {
                "@type": "Place",
                "name": venue,
                "address": this.getVenueAddress(venue)
            },
            "url": event.link,
            "eventStatus": "https://schema.org/EventScheduled"
        }));

        const schema = {
            "@context": "https://schema.org",
            "@type": "ItemList",
            "itemListElement": eventsSchema
        };

        // Remove existing events schema if present
        const existing = document.querySelector('script[type="application/ld+json"]#events-schema');
        if (existing) {
            existing.remove();
        }

        // Add new schema
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.id = 'events-schema';
        script.textContent = JSON.stringify(schema);
        document.head.appendChild(script);
    }

    getVenueAddress(venue) {
        const addresses = {
            'Hope & Ruin': '11-12 Queens Road, Brighton BN1 3XG',
            'Chalk': 'Pool Valley, Brighton BN1 1NJ',
            'Concorde 2': 'Madeira Drive, Brighton BN2 1EN'
        };
        
        return addresses[venue] || 'Brighton, UK';
    }

    // Initialize dynamic updates
    init(venue = null, eventCount = 0, events = []) {
        if (venue) {
            this.updateVenuePageMeta(venue, eventCount);
            if (events.length > 0) {
                this.generateStructuredData(venue, events);
            }
        } else {
            this.updateMainPageMeta();
        }
    }
}

// Auto-initialize if DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.dynamicSEO = new DynamicSEO();
    });
} else {
    window.dynamicSEO = new DynamicSEO();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DynamicSEO;
}