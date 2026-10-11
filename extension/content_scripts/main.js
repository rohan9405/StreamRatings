(async function() {
  console.log("[SR] Content script loaded");
  const STORAGE_KEY_PREFIX = "sr_cache_";
  const CONFIG_KEY = "sr_config";
  // Every result (found or not) is reused for 5 days before OMDb is asked again.
  // OMDb's free tier is 1,000 requests/day, so lookups must be rare.
  const CACHE_TTL = 5 * 24 * 60 * 60 * 1000; // 5 days

  let config = {
    omdbApiKey: "",
    backendUrl: "",
    secret: ""
  };

  // Load config from local storage (content scripts can't access sync)
  try {
    const result = await chrome.storage.local.get(CONFIG_KEY);
    if (result[CONFIG_KEY]) {
      config = result[CONFIG_KEY];
      console.log("[SR] ✅ Config loaded:", {
        hasOmdbApiKey: !!config.omdbApiKey,
        backendUrl: config.backendUrl,
        hasSecret: !!config.secret
      });
    } else {
      console.warn("[SR] ❌ No config in storage");
    }
  } catch (e) {
    console.error("[SR] Config load failed:", e);
  }

  if (!config.omdbApiKey && (!config.backendUrl || !config.secret)) {
    console.log("[SR] ❌ Missing config - open extension Options to configure");
    return;
  }
  console.log("[SR] ✅ Config valid, starting scan...");

  // --- De-duplication & Concurrency ---
  const inFlightRequests = new Map(); // key -> Promise
  let activeRequests = 0;
  const MAX_CONCURRENT = 1; // Sequential only to avoid rate limiting
  const requestQueue = [];
  const DELAY_MS = 500; // 500ms delay = ~2 requests/second = 120/minute

  // Once OMDb says the daily limit is reached, stop sending requests for this page
  let quotaExhausted = false;
  const QUOTA_ERROR = /limit reached|HTTP 429|Too many requests/i;

  function processQueue() {
    if (activeRequests >= MAX_CONCURRENT || requestQueue.length === 0) return;

    const { key, title, year, resolve, reject } = requestQueue.shift();

    if (quotaExhausted) {
      reject(new Error("Daily OMDb limit reached - cached ratings only"));
      processQueue();
      return;
    }

    activeRequests++;

    // Add small delay before fetching to smooth out request load
    setTimeout(() => {
      fetchRating(title, year)
        .then(data => {
          // Cache found AND not-found results so misses don't burn quota on every visit.
          // Errors (network, bad key, quota) reject and are never cached.
          chrome.storage.local.set({
            [STORAGE_KEY_PREFIX + key]: { data, ts: Date.now() }
          });
          resolve(data);
        })
        .catch(err => {
          if (QUOTA_ERROR.test(err.message)) {
            quotaExhausted = true;
            console.warn("[SR] ⛔ OMDb daily limit reached - pausing lookups");
          }
          reject(err);
        })
        .finally(() => {
          activeRequests--;
          processQueue();
        });
    }, DELAY_MS);
  }

  function getRating(title, year) {
    const key = `${title.toLowerCase().trim()}:${year || ''}`;

    // 1. Check Memory/In-Flight
    if (inFlightRequests.has(key)) {
      return inFlightRequests.get(key);
    }

    const promise = new Promise(async (resolve, reject) => {
      // 2. Check Local Storage
      try {
        const cacheKey = STORAGE_KEY_PREFIX + key;
        const result = await chrome.storage.local.get(cacheKey);
        const cached = result[cacheKey];

        if (cached && cached.data && (Date.now() - cached.ts < CACHE_TTL)) {
          resolve(cached.data);
          return;
        }
      } catch (e) {
        console.warn("Cache read failed", e);
      }

      // 3. Enqueue Network Request
      requestQueue.push({ key, title, year, resolve, reject });
      processQueue();
    });

    inFlightRequests.set(key, promise);
    // Clear promise from map after it settles so we don't hold memory forever,
    // but keep it long enough to de-dupe immediate subsequent calls
    promise.catch(() => {}).finally(() => {
      setTimeout(() => inFlightRequests.delete(key), 10000);
    });

    return promise;
  }

  async function fetchRating(title, year) {
    console.log(`[SR] fetchRating via service worker: "${title}" (${year})`);
    // Use service worker to make API call (avoids CORS issues)
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        action: 'fetchRating',
        title,
        year,
        config
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error(`[SR] Service worker error for "${title}":`, chrome.runtime.lastError.message);
          reject(new Error(chrome.runtime.lastError.message));
        } else if (response && response.success) {
          console.log(`[SR] ✅ Got rating for "${title}":`, response.data.imdbRating || "N/A");
          resolve(response.data);
        } else if (response) {
          console.error(`[SR] Service worker failed for "${title}":`, response.error);
          reject(new Error(response.error));
        } else {
          console.error(`[SR] No response from service worker for "${title}"`);
          reject(new Error("No response from service worker"));
        }
      });
    });
  }

  // --- Lazy loading ---
  // Only look up titles the user actually scrolls to, not every card in every carousel.
  const pendingCards = new WeakMap(); // card -> { badge, title, year }

  function loadRating(card) {
    const pending = pendingCards.get(card);
    if (!pending) return;
    pendingCards.delete(card);
    const { badge, title, year } = pending;

    getRating(title, year)
      .then(data => {
        console.log(`[SR] Updating badge for "${title}":`, data);
        window.StreamRatingsUI.updateBadge(badge, data);
      })
      .catch(err => {
        console.error(`[SR] Rating fetch failed for "${title}":`, err.message);
        badge.textContent = "—";
        badge.title = err.message;
      });
  }

  const visibilityObserver = typeof IntersectionObserver === "function"
    ? new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          visibilityObserver.unobserve(entry.target);
          loadRating(entry.target);
        });
      }, { rootMargin: "100px" })
    : null;

  // --- Main Logic ---

  function scan() {
    if (!window.StreamRatingsAdapter) return;

    const cards = window.StreamRatingsAdapter.findCards();
    if (!cards) return;

    cards.forEach(card => {
      if (card.dataset.srProcessed) return;

      // Try to extract info
      const title = window.StreamRatingsAdapter.extractTitle(card);
      const year = window.StreamRatingsAdapter.extractYear(card);

      if (!title) return;

      // Mark processed to avoid loop
      card.dataset.srProcessed = "true";

      // Inject UI
      const badge = window.StreamRatingsUI.createBadge(card);
      if (!badge) return; // UI creation failed or already exists

      // Fetch data once the card is on screen
      pendingCards.set(card, { badge, title, year });
      if (visibilityObserver) {
        visibilityObserver.observe(card);
      } else {
        loadRating(card);
      }
    });
  }

  // --- Observer ---
  let debounceTimer;
  const observer = new MutationObserver(() => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(scan, 1000); // 1s debounce
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // Initial Scan
  setTimeout(scan, 2000);

})();
