# StreamRatings

A Chrome Extension that overlays IMDb ratings on Netflix, Prime Video, and Hotstar title cards. The ratings are fetched securely from a backend proxy, keeping your API key safe.

## What It Does

When you browse movies and TV shows on Netflix, Prime Video, or Hotstar, a small rating badge appears in the top-left corner of each title card:
- **Badge shows**: IMDb rating (e.g., "8.2") or "—" if not found
- **On click**: Opens the IMDb page in a new tab
- **On hover**: Shows title, year, and vote count

## Quick Start (5 Steps)

### Step 1: Get an OMDb API Key

1. Go to [omdbapi.com](https://www.omdbapi.com/)
2. Click "API key (free)"
3. Enter your email and click "Get Free Key"
4. Check your email and click the verification link
5. Copy your API key (you'll see it on the confirmation page)

### Step 2: Set Replit Secrets

1. In Replit, click the **Secrets** button (lock icon) in the bottom-left
2. Add two secrets:
   - **Name**: `OMDB_API_KEY` → **Value**: Paste your OMDb API key
   - **Name**: `STREAMRATINGS_SECRET` → **Value**: Create any random string (e.g., `my-secret-key-12345`)
3. Close the Secrets dialog

### Step 3: Get Your Backend URL

1. In Replit, click the **Run** button to start the server (if not already running)
2. Wait for "Server running at http://..." message
3. Look at the webview URL in the top-right — copy this (it looks like `https://your-project-name.replit.app`)

### Step 4: Load the Extension in Chrome

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer mode** (toggle in the top-right)
3. Click **Load unpacked**
4. Navigate to your Replit project folder, select the `extension` folder, and click **Select**
5. You should see "StreamRatings" appear in your extensions list

### Step 5: Configure the Extension

1. In Chrome extensions, find **StreamRatings** → Click the 3 dots → **Options**
2. Fill in:
   - **Backend URL**: Paste the URL from Step 3 (e.g., `https://your-project-name.replit.app`)
   - **StreamRatings Secret**: Paste the secret you created in Step 2
3. Click **Save Settings**

## Test It

1. Go to [Netflix.com](https://www.netflix.com), [PrimeVideo.com](https://www.primevideo.com), or [Hotstar.com](https://www.hotstar.com)
2. Browse a page with title cards
3. Wait ~2 seconds — you should see yellow badges with IMDb ratings!
4. Click a badge to open IMDb, or hover to see details

## Troubleshooting

**No badges appearing?**
- Check that Backend URL and Secret are correctly set in extension options
- Open the browser console (F12) and look for error messages
- Make sure your Replit server is running (green "Running" indicator)
- Wait 2-3 seconds after loading a page (extension scans on a delay)

**"Invalid secret" error?**
- Double-check that your STREAMRATINGS_SECRET in Replit Secrets matches what you entered in extension options
- Exact match required (case-sensitive)

**Rating not found?**
- Some titles have slightly different names on OMDb
- The badge will show "—" if no match is found
- This is normal for very new or obscure content

## How It Works

- **Frontend (Extension)**: Scans page for title cards, injects badges, fetches ratings
- **Backend (Replit)**: Receives requests with your secret key, calls OMDb API securely, caches results for 24 hours
- **Caching**: Extension caches ratings locally (7 days), backend caches for 24 hours → very fast & cheap
- **Rate Limiting**: Max 60 requests per IP per minute
- **Security**: Your OMDb API key is stored ONLY on the Replit backend, never sent to the extension or browser

## Adding Support for Other Sites

To add Netflix, Prime, or Hotstar support:

1. Inspect the site's title card HTML structure
2. Edit the adapter in `extension/adapters/` (e.g., `netflix.js`):
   - Update `findCards()` to select the title card elements
   - Update `extractTitle()` to pull the title name
   - (optional) Update `extractYear()` for the year
3. The main script will automatically detect and use your adapter

Example adapter:
```javascript
const MyServiceAdapter = {
  domain: 'example.com',
  
  findCards() {
    return document.querySelectorAll('.title-card');
  },

  extractTitle(card) {
    const titleEl = card.querySelector('.title');
    return titleEl ? titleEl.textContent : null;
  },

  extractYear(card) {
    const yearEl = card.querySelector('.year');
    return yearEl ? yearEl.textContent : null;
  },

  getStableKey(card) {
    const title = this.extractTitle(card);
    return title ? title.replace(/\s+/g, '-').toLowerCase() : null;
  }
};

if (window.location.hostname.includes('example.com')) {
  window.StreamRatingsAdapter = MyServiceAdapter;
}
```

## File Structure

```
extension/
  manifest.json            # Chrome extension config
  options/
    options.html          # Settings page
    options.js
    options.css
  content_scripts/
    main.js              # Main logic (caching, deduplication, fetch)
  adapters/
    netflix.js           # Site-specific selectors
    prime.js
    hotstar.js
  ui/
    badge.js             # Badge creation & tooltips
    badge.css
  background/
    service_worker.js    # Minimal service worker

server/                   # Backend (Replit)
  index.ts              # Express server
  routes.ts             # /api/omdb endpoint
  storage.ts            # In-memory cache
  rateLimit.ts          # Rate limiting per IP
  db.ts                 # Database (unused but available)

client/                   # Landing page (setup instructions)
  src/pages/
  src/components/
```

## Performance

- **Concurrency**: Max 5 concurrent network calls to prevent overwhelming the backend
- **Deduplication**: Same title requested twice = only 1 network call (shared promise)
- **Caching**:
  - Browser: 7 days (chrome.storage.local)
  - Server: 24 hours (in-memory)
- **Debouncing**: MutationObserver scans every 1 second (not on every DOM change)

## Notes

- Sites' DOM structures can change → if badges stop appearing after a site update, adapters may need adjustment
- Very large queries (100+ cards at once) may hit rate limits; concurrency control helps
- No accounts or user data stored; purely functional caching

## Support

If you encounter issues:
1. Check browser console for errors (F12)
2. Verify Secrets are set correctly in Replit
3. Confirm extension options are filled in
4. Restart the Replit server

Enjoy your IMDb ratings! 🎬
