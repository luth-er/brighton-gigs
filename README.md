# Brighton Gigs Website

## Overview

This project is a web scraper and static website generator that aggregates and displays upcoming music events in Brighton, UK. It automatically scrapes event data from various venue websites, compiles the information into a JSON file, and generates a static HTML page to display the events. The project uses GitHub Actions for automated daily updates and GitHub Pages for hosting.

## Features

- Scrapes event data from multiple Brighton music venues
- Aggregates event information into a single JSON file
- Generates a static HTML page to display events, grouped by venue
- Automatically updates daily using GitHub Actions
- Hosted for free using GitHub Pages

## Technology Stack

- Node.js
- Puppeteer (for web scraping)
- GitHub Actions (for automation)
- GitHub Pages (for hosting)
- HTML/CSS/JavaScript (for the frontend)

## Project Structure

```
brighton-gigs/
├── .github/
│   └── workflows/
│       └── update-events.yml
├── scraper.js
├── events.json
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
   node scraper.js
   ```

4. Open `index.html` in a web browser to view the results.

## GitHub Actions Workflow

The project uses a GitHub Actions workflow to automatically run the scraper daily and update the `events.json` file. The workflow is defined in `.github/workflows/update-events.yml`.

To set up the GitHub Actions workflow:

1. Ensure your repository is public or you have GitHub Actions minutes available.
2. The workflow should be automatically picked up by GitHub once you push the `.github/workflows/update-events.yml` file to your repository.

## Adding New Venues

To add a new venue to the scraper:

1. Open `scraper.js`.
2. Create a new function for the venue (e.g., `scrapeNewVenue`).
3. Add the scraping logic for the new venue's website.
4. Call the new function in the `scrapeSites` function.
5. Update the HTML in `index.html` if necessary to accommodate the new venue's data structure.

## Contributing

Contributions to improve the project are welcome. Please follow these steps:

1. Fork the repository.
2. Create a new branch for your feature.
3. Make your changes and commit them with a clear commit message.
4. Push your changes to your fork.
5. Submit a pull request with a description of your changes.

## License

This project is open source and available under the [MIT License](LICENSE).

## Contact

If you have any questions or suggestions, please open an issue on the GitHub repository.
