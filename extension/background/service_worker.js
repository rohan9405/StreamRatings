// Service Worker for StreamRatings
// Handles API calls from content scripts with proper extension privileges

chrome.runtime.onInstalled.addListener(() => {
  console.log("StreamRatings installed.");
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("[SR-SW] Message received:", request.action);
  if (request.action === "fetchRating") {
    handleFetchRating(request.title, request.year, request.backendUrl, request.secret)
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

async function handleFetchRating(title, year, backendUrl, secret) {
  const baseUrl = backendUrl.replace(/\/$/, '');
  const url = new URL(`${baseUrl}/api/omdb`);
  url.searchParams.append('title', title);
  if (year) url.searchParams.append('year', year);

  console.log(`[SR-SW] Fetching: "${title}" from ${baseUrl}`);

  try {
    const res = await fetch(url.toString(), {
      headers: {
        'x-streamratings-secret': secret
      }
    });

    if (!res.ok) {
      if (res.status === 401) throw new Error("Unauthorized - check your secret");
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    console.log(`[SR-SW] Got rating: ${data.imdbRating}`);
    return data;
  } catch (err) {
    console.error(`[SR-SW] Fetch failed for "${title}":`, err.message);
    throw err;
  }
}
