# Brighton Gigs Website

## Overview

This project is a web scraper and static website that aggregates and displays upcoming music events in Brighton, UK. It automatically scrapes event data from 12 venue websites, compiles the information into a JSON file, and serves a static frontend to display the events. The project uses GitHub Actions for automated daily updates and GitHub Pages for hosting.

[https://brightongigs.uk](https://brightongigs.uk)

## Features

- Scrapes event data from 12 Brighton music venues
- Aggregates event information into a single JSON file
- Individual venue pages with dedicated event listings
- Filtering by venue, date range, or tonight's shows
- Automatically updates daily using GitHub Actions
- Hosted for free using GitHub Pages
- Advanced date parsing with support for multiple date formats
- Code quality tools including ESLint, Stylelint, and HTMLHint
- Git hooks for pre-commit linting

## Technology Stack

- Node.js (ES modules)
- Axios & Cheerio (for web scraping)
- GitHub Actions (for automation)
- GitHub Pages (for hosting)
- HTML/CSS/JavaScript (for the frontend)
- ESLint, Stylelint, HTMLHint (for code quality)
- Husky & lint-staged (for git hooks)
- Vitest (for testing)

## Project Structure

```
brighton-gigs/
├── .claude/
│   └── add-venue.md          # Guide for adding new venues
├── .github/
│   └── workflows/
│       └── update-events.yml
├── config/
│   └── eslint.config.js
├── data/
│   ├── events.json
│   ├── scrape-stats.json
│   ├── scrape-errors.json
│   └── scrape-warnings.json
├── src/
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   ├── script.js              # Main homepage JS
│   │   ├── venue-script.js        # Individual venue page JS
│   │   ├── seo-dynamic.js         # Dynamic SEO updates
│   │   └── sitemap-generator.cjs  # Sitemap generator
│   ├── scrapers/
│   │   └── BaseScraper.js         # Abstract base scraper class
│   ├── utils/
│   │   ├── date-parser.js
│   │   ├── data-validator.js
│   │   ├── debounce.js
│   │   ├── rate-limiter.js
│   │   └── sanitizer.js
│   └── scraper.js                 # Main scraper entry point
├── venues/
│   ├── brighton-centre.html
│   ├── brighton-dome.html
│   ├── chalk.html
│   ├── concorde-2.html
│   ├── folklore-rooms.html
│   ├── green-door-store.html
│   ├── hope-and-ruin.html
│   ├── pipeline.html
│   ├── prince-albert.html
│   ├── quarters.html
│   ├── rossi-bar.html
│   └── the-rose-hill.html
├── index.html
├── package.json
├── sitemap.xml
└── README.md
```

## Setup and Installation

1. Clone the repository:
   ```
   git clone https://github.com/luth-er/brighton-gigs.git
   cd brighton-gigs
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Run the scraper locally:
   ```
   npm start
   ```

4. Open `index.html` in a web browser to view the results.

## Development Commands

- `npm start` - Run the scraper
- `npm test` - Run tests (watch mode)
- `npm run test:run` - Run tests once
- `npm run lint` - Run all linting checks (JS, CSS, HTML)
- `npm run lint:js` - Run ESLint on JavaScript files
- `npm run lint:css` - Run Stylelint on CSS files
- `npm run lint:html` - Run HTMLHint on HTML files
- `npm run lint:fix` - Automatically fix linting issues where possible
- `npm run sitemap` - Regenerate sitemap.xml

## GitHub Actions Workflow

The project uses a GitHub Actions workflow to automatically run the scraper daily at 3 AM UTC and update the `data/events.json` file. The workflow is defined in `.github/workflows/update-events.yml`.

**Workflow Features:**
- Scheduled daily execution
- Manual trigger capability
- Automatic commit and push of updated data
- Error handling and success reporting

## Supported Venues

The scraper currently supports the following 12 Brighton venues:

| Venue | Source |
|-------|--------|
| **Brighton Centre** | brightoncentre.co.uk |
| **Brighton Dome** | brightondome.org |
| **Chalk** | chalkvenue.com |
| **Concorde 2** | concorde2.co.uk |
| **Folklore Rooms** | wegottickets.com |
| **Green Door Store** | thegreendoorstore.co.uk |
| **Hope & Ruin** | hope.pub |
| **Pipeline** | wegottickets.com |
| **Prince Albert** | gigseekr.com |
| **Quarters** | quartersbrighton.co.uk |
| **Rossi Bar** | therossibar.co.uk |
| **The Rose Hill** | therosehill.co.uk |

## Adding New Venues

See `.claude/add-venue.md` for the full step-by-step guide. In summary:

1. Create a venue HTML page in `/venues/{slug}.html`
2. Add a scraper class in `src/scraper.js`
3. Add the venue slug to the sitemap generator (`src/js/sitemap-generator.cjs`)
4. Update venue count references in `index.html`
5. Add the venue to the homepage venue list
6. Update the navigation on all 12 existing venue pages
7. Regenerate the sitemap: `npm run sitemap`

## Contributing

Contributions to improve the project are welcome. Please follow these steps:

1. Fork the repository.
2. Create a new branch for your feature.
3. Make your changes and commit them with a clear commit message.
4. Ensure all linting passes with `npm run lint`.
5. Push your changes to your fork.
6. Submit a pull request with a description of your changes.

**Development Notes:**
- The project uses ES modules (`"type": "module"` in package.json)
- Husky git hooks will automatically run linting on staged files
- All scraped events are sorted by date and stored in `data/events.json`
- The venue filter dropdown on the homepage is dynamically populated from events data

## License

This project is open source and available under the [MIT License](LICENSE).

## Contact

If you have any questions or suggestions, please open an issue on the GitHub repository.
