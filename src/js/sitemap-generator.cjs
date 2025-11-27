// Dynamic Sitemap Generator
// Generates sitemap.xml based on events.json data structure

const fs = require('fs');
const path = require('path');

class SitemapGenerator {
    constructor(eventsDataPath, outputPath) {
        this.eventsDataPath = eventsDataPath;
        this.outputPath = outputPath;
        this.baseUrl = 'https://brightongigs.uk';
        this.currentDate = new Date().toISOString();
    }

    loadEventsData() {
        try {
            const data = fs.readFileSync(this.eventsDataPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error loading events data:', error);
            return [];
        }
    }

    getVenueStats(events) {
        const venueStats = {};
        
        events.forEach(event => {
            if (!venueStats[event.venue]) {
                venueStats[event.venue] = {
                    count: 0,
                    lastUpdate: 0
                };
            }
            venueStats[event.venue].count++;
            venueStats[event.venue].lastUpdate = Math.max(
                venueStats[event.venue].lastUpdate, 
                event.dateUnix || 0
            );
        });

        return venueStats;
    }

    getVenueSlug(venueName) {
        // Handle specific venue mappings first
        const venueMap = {
            'Hope & Ruin': 'hope-and-ruin',
            'Concorde 2': 'concorde-2',
            'Green Door Store': 'green-door-store',
            'Folklore Rooms': 'folklore-rooms',
            'Prince Albert': 'prince-albert',
            'The Rose Hill': 'the-rose-hill',
            'Brighton Dome': 'brighton-dome',
            'Rossi Bar': 'rossi-bar'
        };

        if (venueMap[venueName]) {
            return venueMap[venueName];
        }

        return venueName
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '')
            .replace(/--+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    generateStaticUrls() {
        return [
            {
                loc: `${this.baseUrl}/`,
                lastmod: this.currentDate,
                changefreq: 'daily',
                priority: '1.0',
                mobile: true
            },
            {
                loc: `${this.baseUrl}/venues/`,
                lastmod: this.currentDate,
                changefreq: 'weekly',
                priority: '0.8',
                mobile: true
            },
            {
                loc: `${this.baseUrl}/robots.txt`,
                lastmod: this.currentDate,
                changefreq: 'monthly',
                priority: '0.1',
                mobile: false
            }
        ];
    }

    generateVenueUrls(venueStats) {
        const urls = [];

        // Main venue pages for all venues
        Object.keys(venueStats).forEach(venue => {
            const slug = this.getVenueSlug(venue);
            urls.push({
                loc: `${this.baseUrl}/venues/${slug}/`,
                lastmod: this.currentDate,
                changefreq: 'daily',
                priority: '0.9',
                mobile: true,
                hreflang: 'en-gb'
            });
        });

        return urls;
    }

    generateEventUrls() {
        // No dynamic event category pages currently implemented
        return [];
    }

    generateXmlUrl(urlData) {
        const url = ['    <url>'];
        
        url.push(`        <loc>${urlData.loc}</loc>`);
        url.push(`        <lastmod>${urlData.lastmod}</lastmod>`);
        url.push(`        <changefreq>${urlData.changefreq}</changefreq>`);
        url.push(`        <priority>${urlData.priority}</priority>`);
        
        if (urlData.mobile) {
            url.push('        <mobile:mobile/>');
        }
        
        if (urlData.hreflang) {
            url.push(`        <xhtml:link rel="alternate" hreflang="${urlData.hreflang}" href="${urlData.loc}"/>`);
        }
        
        url.push('    </url>');
        return url.join('\n');
    }

    generateSitemap() {
        const events = this.loadEventsData();
        const venueStats = this.getVenueStats(events);
        
        // Combine all URLs
        const allUrls = [
            ...this.generateStaticUrls(),
            ...this.generateVenueUrls(venueStats),
            ...this.generateEventUrls()
        ];

        // Generate XML
        const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">`;

        const xmlFooter = '\n</urlset>';
        
        const xmlBody = allUrls.map(url => this.generateXmlUrl(url)).join('\n\n');
        
        const completeXml = xmlHeader + '\n\n' + xmlBody + xmlFooter;
        
        // Write to file
        try {
            fs.writeFileSync(this.outputPath, completeXml);
            console.log(`✅ Sitemap generated successfully: ${this.outputPath}`);
            console.log(`📊 Total URLs: ${allUrls.length}`);
            console.log(`🏠 Venue pages: ${Object.keys(venueStats).length}`);
            console.log(`🎵 Total events: ${events.length}`);
        } catch (error) {
            console.error('❌ Error writing sitemap:', error);
        }
    }

    // Generate sitemap with analytics
    generate() {
        console.log('🚀 Starting sitemap generation...');
        console.log(`📍 Base URL: ${this.baseUrl}`);
        console.log(`📁 Events data: ${this.eventsDataPath}`);
        console.log(`💾 Output: ${this.outputPath}`);
        console.log('---');
        
        this.generateSitemap();
    }
}

// CLI usage
if (require.main === module) {
    const eventsPath = path.join(__dirname, '../../data/events.json');
    const sitemapPath = path.join(__dirname, '../../sitemap.xml');
    
    const generator = new SitemapGenerator(eventsPath, sitemapPath);
    generator.generate();
}

module.exports = SitemapGenerator;