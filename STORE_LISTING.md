# Chrome Web Store listing — StreamRatings

Copy these into the Developer Dashboard.

## Store listing
- **Name:** StreamRatings – IMDb ratings on Netflix, Prime Video & JioHotstar (from manifest)
- **Summary (≤132 chars):** See IMDb ratings on every title card on Netflix, Prime Video and JioHotstar. Free, uses your own OMDb key.
- **Category:** Entertainment
- **Language:** English

**Description:**

Stop opening IMDb in another tab. StreamRatings puts the IMDb rating right on each movie and show poster while you browse Netflix, Prime Video and JioHotstar.

• Rating badge on every title you scroll to — hover for year, genre and vote count, click to open IMDb
• Works on Netflix, Prime Video and JioHotstar
• Fast: ratings are cached and shared between all StreamRatings users, refreshed every 3–30 days depending on how new the title is
• Light: only titles actually on your screen are looked up

Setup takes a minute: after installing, get a free key from OMDb (the open movie database), paste it into the setup page, done.

Ratings come from OMDb. StreamRatings is not affiliated with IMDb, Netflix, Amazon or JioHotstar.

- **Icon:** extension/icons/icon128.png
- **Screenshot:** store-assets/screenshot-1-jiohotstar-1280x800.png (640×400 version also included)

## Privacy practices tab
- **Single purpose:** Show IMDb ratings on title cards on Netflix, Prime Video and JioHotstar.
- **Permission justification – storage:** Saves the user's OMDb API key and caches ratings locally so titles aren't looked up repeatedly.
- **Permission justification – host permissions (omdbapi.com, StreamRatings cache):** Fetch ratings for titles shown on screen: from the shared rating cache, or directly from OMDb if the cache is unavailable.
- **Content scripts on netflix.com, primevideo.com, hotstar.com, jiohotstar.com:** Read titles of on-screen cards and draw the rating badge.
- **Remote code:** No, I am not using remote code.
- **Data usage:** Check **"Authentication information"** (the user's OMDb API key, sent to the developer's shared cache to fetch ratings) and **"Website content"** (titles shown on supported sites). Certify: not sold, not used for unrelated purposes, not used for creditworthiness.
- **Privacy policy URL:** https://github.com/rohan9405/StreamRatings/blob/main/PRIVACY.md

## Distribution
- **Visibility:** Unlisted (only people with the link) or Public.
