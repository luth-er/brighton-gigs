import fs from 'fs/promises';

const generateTodayPage = async () => {
    // Load events
    const eventsJson = await fs.readFile('./data/events.json', 'utf-8');
    const events = JSON.parse(eventsJson);

    // Get today's date range in UTC
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();

    // Filter to today's events only
    const todayEvents = events.filter(event =>
        event.dateUnix >= startOfDay && event.dateUnix <= endOfDay
    );

    // Format the date nicely
    const dateOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    const dateString = now.toLocaleDateString('en-GB', dateOptions);

    // Build plain text content
    let plainText = `🎸 Brighton Gigs Today — ${dateString}\n\n`;

    if (todayEvents.length === 0) {
        plainText += 'No gigs listed today.\n';
    } else {
        // Sort by venue name for clean grouping
        const byVenue = {};
        todayEvents.forEach(event => {
            if (!byVenue[event.venue]) {
                byVenue[event.venue] = [];
            }
            // Strip any HTML tags from title
            const cleanTitle = event.title.replace(/<[^>]*>/g, '').trim();
            byVenue[event.venue].push(cleanTitle);
        });

        Object.entries(byVenue).forEach(([venue, titles]) => {
            titles.forEach(title => {
                plainText += `${title}\n`;
                plainText += `${venue}\n`;
                plainText += '\n';
            });
        });
    }

    plainText += `brightongigs.uk`;

    // Build the HTML page
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="robots" content="noindex, nofollow">
    <title>Brighton Gigs Today</title>
    <style>
        body {
            font-family: monospace;
            font-size: 16px;
            line-height: 1.6;
            max-width: 600px;
            margin: 40px auto;
            padding: 0 20px;
            background: #fff;
            color: #000;
        }
        h1 {
            font-size: 18px;
            margin-bottom: 24px;
        }
        #copy-btn {
            display: block;
            margin-bottom: 32px;
            padding: 10px 20px;
            background: #000;
            color: #fff;
            border: none;
            font-family: monospace;
            font-size: 14px;
            cursor: pointer;
        }
        #copy-btn:hover {
            background: #333;
        }
        #post-text {
            white-space: pre-wrap;
            background: #f5f5f5;
            padding: 20px;
            border: 1px solid #ddd;
        }
        #copy-confirm {
            display: none;
            margin-top: 8px;
            font-size: 14px;
            color: #666;
        }
    </style>
</head>
<body>
    <h1>Today's Threads Post</h1>
    <button id="copy-btn" onclick="copyText()">Copy to clipboard</button>
    <pre id="post-text">${plainText}</pre>
    <p id="copy-confirm">✓ Copied to clipboard</p>
    <script>
        function copyText() {
            const text = document.getElementById('post-text').innerText;
            navigator.clipboard.writeText(text).then(() => {
                const confirm = document.getElementById('copy-confirm');
                confirm.style.display = 'block';
                setTimeout(() => confirm.style.display = 'none', 2000);
            });
        }
    </script>
</body>
</html>`;

    // Write the file
    await fs.writeFile('./today.html', html, 'utf-8');
    console.log(`✓ today.html generated with ${todayEvents.length} events`);
};

generateTodayPage().catch(err => {
    console.error('Failed to generate today page:', err);
    process.exit(1);
});