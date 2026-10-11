// Service Worker for StreamRatings
// Handles API calls from content scripts with proper extension privileges.
// Two modes:
//   - Direct: calls OMDb with the user's own API key (no backend needed)
//   - Backend: proxies through a self-hosted StreamRatings server

const OMDB_API_URL = "https://www.omdbapi.com/";

chrome.runtime.onInstalled.addListener(() => {
  console.log("StreamRatings installed.");
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("[SR-SW] Message received:", request.action);
  if (request.action === "fetchRating") {
    handleFetchRating(request.title, request.year, request.config || {})
      .then(data => {
        console.log("[SR-SW] ✅ Success for", request.title);
        sendResponse({ success: true, data });
      })
      .catch(error => {
        console.error("[SR-SW] ❌ Error for", request.title, ":", error.message);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep channel open for async response
  }
});

async function handleFetchRating(title, year, config) {
  if (config.omdbApiKey) {
    return fetchFromOmdb(title, year, config.omdbApiKey);
  }
  if (config.backendUrl && config.secret) {
    return fetchFromBackend(title, year, config.backendUrl, config.secret);
  }
  throw new Error("Not configured - open StreamRatings Options");
}

async function fetchFromBackend(title, year, backendUrl, secret) {
  const baseUrl = backendUrl.replace(/\/$/, '');
  const url = new URL(`${baseUrl}/api/omdb`);
  url.searchParams.append('title', title);
  if (year) url.searchParams.append('year', year);

  console.log(`[SR-SW] Fetching: "${title}" from ${baseUrl}`);

  const res = await fetch(url.toString(), {
    headers: {
      'x-streamratings-secret': secret
    }
  });

  if (!res.ok) {
    if (res.status === 401) throw new Error("Unauthorized - check your secret");
    if (res.status === 404) throw new Error("Backend not found (HTTP 404) - is your server still deployed?");
    throw new Error(`HTTP ${res.status}`);
  }

  const data = await res.json();
  console.log(`[SR-SW] Got rating: ${data.imdbRating}`);
  return data;
}

// --- Direct OMDb mode (mirrors server/routes.ts) ---

async function omdbGet(apiKey, params) {
  const url = new URL(OMDB_API_URL);
  url.searchParams.append("apikey", apiKey);
  for (const [k, v] of Object.entries(params)) url.searchParams.append(k, v);
  const res = await fetch(url.toString());
  if (res.status === 401) throw new Error("Invalid OMDb API key");
  if (!res.ok) throw new Error(`OMDb HTTP ${res.status}`);
  const data = await res.json();
  if (data.Response === "False" && /api key|limit reached/i.test(data.Error || "")) {
    throw new Error(`OMDb: ${data.Error}`);
  }
  return data;
}

async function fetchFromOmdb(title, year, apiKey) {
  console.log(`[SR-SW] Fetching: "${title}" from OMDb directly`);

  let matchedData = await omdbGet(apiKey, year ? { t: title, y: year } : { t: title });
  let found = matchedData.Response === "True";

  // If exact match failed, try search API for fuzzy matching
  if (!found) {
    const searchData = await omdbGet(apiKey, { s: title });
    if (searchData.Response === "True" && searchData.Search && searchData.Search.length > 0) {
      const bestMatch = findBestMatch(title, searchData.Search);
      if (bestMatch) {
        matchedData = await omdbGet(apiKey, { i: bestMatch.imdbID });
        found = matchedData.Response === "True";
      }
    }
  }

  return {
    query: { title, year },
    found,
    title: found ? matchedData.Title : null,
    year: found ? matchedData.Year : null,
    genre: found ? matchedData.Genre : null,
    imdbRating: found ? matchedData.imdbRating : null,
    imdbVotes: found ? matchedData.imdbVotes : null,
    imdbID: found ? matchedData.imdbID : null,
    source: "omdb"
  };
}

// Simple fuzzy matching: Levenshtein distance
function levenshteinDistance(str1, str2) {
  const track = Array(str2.length + 1).fill(null).map(() =>
    Array(str1.length + 1).fill(null)
  );
  for (let i = 0; i <= str1.length; i += 1) track[0][i] = i;
  for (let j = 0; j <= str2.length; j += 1) track[j][0] = j;
  for (let j = 1; j <= str2.length; j += 1) {
    for (let i = 1; i <= str1.length; i += 1) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1,
        track[j - 1][i] + 1,
        track[j - 1][i - 1] + indicator
      );
    }
  }
  return track[str2.length][str1.length];
}

// Find best match from search results (same thresholds as the backend)
function findBestMatch(query, results) {
  if (!results || results.length === 0) return null;
  const q = query.toLowerCase();

  let bestMatch = results[0];
  let bestScore = levenshteinDistance(q, results[0].Title.toLowerCase());
  for (let i = 1; i < results.length && i < 5; i++) {
    const distance = levenshteinDistance(q, results[i].Title.toLowerCase());
    if (distance < bestScore) {
      bestScore = distance;
      bestMatch = results[i];
    }
  }

  const actualSimilarity = (query.length - bestScore) / query.length;
  const maxAllowedDistance = query.length < 5 ? 1 : Math.floor(query.length * 0.4);
  return actualSimilarity >= 0.5 && bestScore <= maxAllowedDistance ? bestMatch : null;
}
