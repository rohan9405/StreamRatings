# StreamRatings

StreamRatings overlays IMDb ratings on Netflix, Prime Video, and Hotstar title cards.
It uses a secure backend proxy to fetch data from OMDb, ensuring your API key is never exposed to the client.

## Setup Guide

### 1. Prerequisites
- An **OMDb API Key**. Get one for free at [omdbapi.com](https://www.omdbapi.com/apikey.aspx).
- A **StreamRatings Secret**. This is a password you create (e.g., `my-super-secret-password`) to secure the communication between the extension and the backend.

### 2. Configure Replit Secrets
In the Replit "Secrets" tool (Lock icon in the sidebar):
1. Add `OMDB_API_KEY`: Your OMDb key (e.g., `12345678`).
2. Add `STREAMRATINGS_SECRET`: Your chosen secret password.

### 3. Start the Backend
The backend is already set up.
1. Click the "Run" button in Replit to start the server.
2. Once running, you will see a Webview with the frontend landing page.
3. **Copy the URL** of the Webview (e.g., `https://your-project.replit.app`). This is your **Backend URL**.

### 4. Install the Extension
1. Download the `extension` folder from this project to your local computer.
   - You can download files from Replit file explorer.
   - Or just copy-paste the files if you are developing locally.
2. Open Chrome and go to `chrome://extensions`.
3. Enable **Developer mode** (toggle in top-right).
4. Click **Load unpacked**.
5. Select the `extension` folder.

### 5. Configure the Extension
1. Click the **StreamRatings** extension icon in Chrome (pin it if needed).
2. Right-click the icon and select **Options**, or click "Extension Options" from the `chrome://extensions` page.
3. Enter your **Backend URL** (from step 3).
4. Enter your **StreamRatings Secret** (from step 2).
5. Click **Save Settings**.

## Usage
1. Go to Netflix, Prime Video, or Hotstar.
2. Browse through movies/shows.
3. You should see a small badge (e.g., "8.2" or "—") appear on the top-left of title cards.
4. **Hover** over the badge to see the title, year, and vote count.
5. **Click** the badge to open the IMDb page for that title.

## Troubleshooting
- **Badge says "Err":** Check the extension Options. Ensure the Backend URL is correct (no trailing slash is fine) and the Secret matches the one in Replit Secrets.
- **Badge says "—":** The title wasn't found in OMDb. This happens if the extracted title from the streaming site doesn't match OMDb's records exactly.
- **No badges:** Refresh the page. Scroll down to trigger more cards. Ensure the extension is enabled.

## Development
- **Backend:** `server/routes.ts` handles the OMDb proxying and caching.
- **Extension:** `extension/content_scripts/main.js` handles the DOM scanning and badge injection.
- **Adapters:** `extension/adapters/` contains site-specific logic for finding cards and extracting titles.

## Adding a New Site
1. Create a new adapter in `extension/adapters/mysite.js`.
2. Implement `findCards()`, `extractTitle()`, etc.
3. Add the adapter to `manifest.json` under `content_scripts`.
4. Add host permissions for the new domain in `manifest.json`.
