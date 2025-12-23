// Service Worker for StreamRatings
// Handles API calls from content scripts with proper extension privileges

chrome.runtime.onInstalled.addListener(() => {
  console.log("StreamRatings installed.");
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fetchRating") {
    handleFetchRating(request.title, request.year, request.backendUrl, request.secret)
      .then(data => sendResponse({ success: true, data }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async response
  }
});

async function handleFetchRating(title, year, backendUrl, secret) {
  const baseUrl = backendUrl.replace(/\/$/, '');
  const url = new URL(`${baseUrl}/api/omdb`);
  url.searchParams.append('title', title);
  if (year) url.searchParams.append('year', year);

  console.log(`[StreamRatings SW] Fetching: ${title}`);

  const res = await fetch(url.toString(), {
    headers: {
      'x-streamratings-secret': secret
    }
  });

  if (!res.ok) {
    if (res.status === 401) throw new Error("Invalid secret");
    throw new Error(`API Error: ${res.status}`);
  }

  return await res.json();
}
