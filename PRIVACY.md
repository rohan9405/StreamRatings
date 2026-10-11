# StreamRatings Privacy Policy

_Last updated: 11 October 2026_

StreamRatings is a Chrome extension that shows IMDb ratings on title cards on Netflix, Prime Video and JioHotstar.

## What the extension reads
- **Titles shown on supported streaming pages.** Only the name of a movie or show that is currently on your screen is read, so its rating can be looked up. Nothing else on the page is read.

## What is stored, and where
- **Your OMDb API key** is stored in your browser's extension storage (`chrome.storage.local`). It never leaves your browser except as described below.
- **Ratings** are cached in your browser's extension storage, and in the StreamRatings shared cache (see below), so the same title isn't looked up repeatedly.

## What is sent, and to whom
- **To the StreamRatings shared cache** (a Cloudflare Worker run by the developer): the title being looked up (and its year, if known), plus your OMDb key **only so the cache can fetch that title from OMDb when no one has looked it up recently**. Your key is used for that single request and is never stored or logged. The cache stores only the public rating information returned by OMDb (title, year, genre, release date, IMDb rating, vote count, IMDb ID), shared by all users.
- **To OMDb** (omdbapi.com), only if the shared cache is unreachable: the title and your key, to fetch the rating directly.

## What is not collected
StreamRatings does not collect your name, email, account details, viewing history, browsing history outside supported sites, IP address logs, cookies, or analytics. Nothing is sold or shared with third parties.

## Removing your data
Uninstalling the extension deletes everything it stored in your browser. Shared-cache entries contain only public rating data and no information about you.

## Contact
Questions: open an issue at https://github.com/rohan9405/StreamRatings/issues
