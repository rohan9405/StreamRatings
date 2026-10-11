// Service Worker for StreamRatings
// Handles rating lookups for content scripts. The user's OMDb key never leaves
// the extension except to OMDb itself or the StreamRatings shared cache.
//
// Lookup order (the content script has already checked the local cache):
//   1. Shared cache (Cloudflare Worker): serves ratings fetched by any user; on a
//      miss it fetches from OMDb with this user's key and stores the result.
//   2. If the shared cache is unreachable: OMDb directly with the user's key.

importScripts('../shared/omdb.js', '../shared/cache_policy.js');

const SHARED_CACHE_URL = "https://streamratings-cache.rohan-trades-trump.workers.dev";
const CONFIG_KEY = "sr_config";

chrome.runtime.onInstalled.addListener(async (details) => {
  console.log("StreamRatings installed.");
  const key = await loadBundledKey();
  // First install without a key: open the one-step setup page
  if (details.reason === "install" && !key) {
    chrome.runtime.openOptionsPage();
  }
});

// Toolbar icon opens settings
chrome.action.onClicked.addListener(() => chrome.runtime.openOptionsPage());

// Development convenience: `npm run ext:env` writes config.local.json from .env.
// Store builds never include it.
async function loadBundledKey() {
  const { [CONFIG_KEY]: config = {} } = await chrome.storage.local.get(CONFIG_KEY);
  if (config.omdbApiKey) return config.omdbApiKey;
  try {
    const res = await fetch(chrome.runtime.getURL("config.local.json"));
    if (!res.ok) return null;
    const local = await res.json();
    if (!local.omdbApiKey) return null;
    await chrome.storage.local.set({ [CONFIG_KEY]: { ...config, omdbApiKey: local.omdbApiKey } });
    console.log("[SR-SW] Using OMDb key from config.local.json (.env)");
    return local.omdbApiKey;
  } catch (e) {
    return null;
  }
}

async function getApiKey() {
  const { [CONFIG_KEY]: config = {} } = await chrome.storage.local.get(CONFIG_KEY);
  return config.omdbApiKey || loadBundledKey();
}

// Listen for messages from content scripts and the options page
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fetchRating") {
    handleFetchRating(request.title, request.year)
      .then(result => sendResponse({ success: true, ...result }))
      .catch(error => {
        console.error("[SR-SW] ❌ Error for", request.title, ":", error.message);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep channel open for async response
  }
  if (request.action === "testKey") {
    testKey(request.apiKey)
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

// Returns { data, ts } where ts is when the rating was fetched from OMDb
async function handleFetchRating(title, year) {
  const apiKey = await getApiKey();
  if (!apiKey) throw new Error("Add your free OMDb key in StreamRatings Options");

  try {
    return await fetchFromSharedCache(title, year, apiKey);
  } catch (err) {
    if (!err.sharedCacheDown) throw err;
    console.warn("[SR-SW] Shared cache unavailable, asking OMDb directly:", err.message);
  }

  const data = await StreamRatingsOmdb.lookup(title, year, apiKey);
  return { data, ts: Date.now() };
}

async function fetchFromSharedCache(title, year, apiKey) {
  const url = new URL(`${SHARED_CACHE_URL}/v1/rating`);
  url.searchParams.append('title', title);
  if (year) url.searchParams.append('year', year);

  let res;
  try {
    res = await fetch(url.toString(), { headers: { 'X-OMDb-Key': apiKey } });
  } catch (e) {
    throw Object.assign(new Error(e.message), { sharedCacheDown: true });
  }

  const body = await res.json().catch(() => null);
  if (res.ok && body && body.data) {
    console.log(`[SR-SW] ${body.cache === 'hit' ? 'Shared cache hit' : 'Fetched + shared'}: "${title}"`);
    return { data: body.data, ts: body.ts };
  }
  // 4xx from the cache means OMDb rejected this user's key or hit its limit - pass that on
  if (res.status >= 400 && res.status < 500 && body && body.error) {
    throw new Error(body.error);
  }
  throw Object.assign(new Error(`Shared cache HTTP ${res.status}`), { sharedCacheDown: true });
}

// Options page "Save" check: one lookup straight to OMDb
async function testKey(apiKey) {
  const data = await StreamRatingsOmdb.lookup("Inception", "2010", apiKey);
  if (!data.found) throw new Error("Key works but test lookup failed");
}
