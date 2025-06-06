# Brighton Gigs Website

## Overview

This project is a web scraper and static website generator that aggregates and displays upcoming music events in Brighton, UK. It automatically scrapes event data from various venue websites, compiles the information into a JSON file, and generates a static HTML page to display the events. The project uses GitHub Actions for automated daily updates and GitHub Pages for hosting.

[https://luth-er.github.io/brighton-gigs/](https://luth-er.github.io/brighton-gigs/)

## Features

- Scrapes event data from multiple Brighton music venues
- Aggregates event information into a single JSON file
- Generates a static HTML page to display events, grouped by venue
- Automatically updates daily using GitHub Actions
- Hosted for free using GitHub Pages
- Advanced date parsing with support for multiple date formats
- Code quality tools including ESLint, Stylelint, and HTMLHint
- Git hooks for pre-commit linting

## Technology Stack

- Node.js (ES modules)
- Axios & Cheerio (for web scraping)
- date-fns (for date manipulation)
- GitHub Actions (for automation)
- GitHub Pages (for hosting)
- HTML/CSS/JavaScript (for the frontend)
- ESLint, Stylelint, HTMLHint (for code quality)
- Husky & lint-staged (for git hooks)

## Project Structure

```
brighton-gigs/
├── .github/
│   └── workflows/
│       └── update-events.yml
├── config/
│   └── eslint.config.js
├── data/
│   └── events.json
├── src/
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   └── script.js
│   ├── utils/
│   │   └── date-parser.js
│   └── scraper.js
├── index.html
├── package.json
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
- `npm run lint` - Run all linting checks (JS, CSS, HTML)
- `npm run lint:js` - Run ESLint on JavaScript files
- `npm run lint:css` - Run Stylelint on CSS files
- `npm run lint:html` - Run HTMLHint on HTML files
- `npm run lint:fix` - Automatically fix linting issues where possible

## GitHub Actions Workflow

The project uses a GitHub Actions workflow to automatically run the scraper daily at 3 AM UTC and update the `data/events.json` file. The workflow is defined in `.github/workflows/update-events.yml`.

**Workflow Features:**
- Scheduled daily execution
- Manual trigger capability
- Automatic commit and push of updated data
- Error handling and success reporting

To set up the GitHub Actions workflow:

1. Ensure your repository is public or you have GitHub Actions minutes available.
2. The workflow should be automatically picked up by GitHub once you push the `.github/workflows/update-events.yml` file to your repository.

## Supported Venues

The scraper currently supports the following Brighton venues:

- **Hope & Ruin** - Events scraped from hope.pub
- **Green Door Store** - Events scraped from thegreendoorstore.co.uk
- **Concorde 2** - Events scraped via GigSeekr
- **Chalk** - Events scraped via GigSeekr
- **Folklore Rooms** - Events scraped from WeGotTickets
- **Patterns** - (Currently commented out)

## Date Parser Utility

The project includes a sophisticated date parser (`src/utils/date-parser.js`) that supports various date formats:

- Standard JavaScript date formats
- Ordinal dates with time (e.g., "31st October 2024 - 7:30 pm")
- Weekday formats (e.g., "Tue, 5 Nov 2024", "Monday 10 March 2025")
- Short date formats (e.g., "1/12/24")
- Relative time (e.g., "2 days ago", "yesterday")
- Mixed formats from different venue websites

## Adding New Venues

To add a new venue to the scraper:

1. Open `src/scraper.js`.
2. Create a new function for the venue (e.g., `scrapeNewVenue`).
3. Add the scraping logic for the new venue's website.
4. Call the new function in the `scrapeSites` function.
5. Update the HTML in `index.html` if necessary to accommodate the new venue's data structure.
6. Test the date parsing with the new venue's date format - add patterns to `src/utils/date-parser.js` if needed.

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
- The date parser utility handles various date formats from different venues

## License

This project is open source and available under the [MIT License](LICENSE).

## Contact

If you have any questions or suggestions, please open an issue on the GitHub repository.
