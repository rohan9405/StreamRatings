(async function() {
  const STORAGE_KEY_PREFIX = "sr_cache_";
  const CONFIG_KEY = "sr_config";
  const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

  let config = {
    backendUrl: "",
    secret: ""
  };

  // Load config from local storage (content scripts can't access sync)
  try {
    const result = await chrome.storage.local.get(CONFIG_KEY);
    if (result[CONFIG_KEY]) {
      config = result[CONFIG_KEY];
      console.log("StreamRatings: Config loaded from local storage", {
        backendUrl: config.backendUrl,
        hasSecret: !!config.secret
      });
    } else {
      console.warn("StreamRatings: No config found in local storage");
    }
  } catch (e) {
    console.error("Failed to load config from storage", e);
  }

  if (!config.backendUrl || !config.secret) {
    console.log("StreamRatings: Missing configuration. Please open extension Options and set Backend URL and Secret.");
    return;
  }

  // --- De-duplication & Concurrency ---
  const inFlightRequests = new Map(); // key -> Promise
  let activeRequests = 0;
  const MAX_CONCURRENT = 5;
  const requestQueue = [];

  function processQueue() {
    if (activeRequests >= MAX_CONCURRENT || requestQueue.length === 0) return;

    const { key, title, year, resolve, reject } = requestQueue.shift();
    activeRequests++;

    fetchRating(title, year)
      .then(data => {
        // Cache it
        const cacheEntry = {
          data,
          ts: Date.now()
        };
        const storageObj = {};
        storageObj[STORAGE_KEY_PREFIX + key] = cacheEntry;
        chrome.storage.local.set(storageObj);
        resolve(data);
      })
      .catch(reject)
      .finally(() => {
        activeRequests--;
        processQueue();
      });
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

        if (cached && (Date.now() - cached.ts < CACHE_TTL)) {
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
    promise.finally(() => {
      setTimeout(() => inFlightRequests.delete(key), 10000); 
    });

    return promise;
  }

  async function fetchRating(title, year) {
    // Use service worker to make API call (avoids CORS issues)
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        action: 'fetchRating',
        title,
        year,
        backendUrl: config.backendUrl,
        secret: config.secret
      }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else if (response.success) {
          resolve(response.data);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }

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

      // Fetch Data
      getRating(title, year)
        .then(data => {
          window.StreamRatingsUI.updateBadge(badge, data);
        })
        .catch(err => {
          console.error("Rating fetch failed for", title, err);
          badge.textContent = "Err";
          badge.title = err.message;
        });
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
