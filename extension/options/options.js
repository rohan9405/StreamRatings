const CONFIG_KEY = "sr_config";
const STORAGE_KEY_PREFIX = "sr_cache_";

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
document.getElementById('clearCache').addEventListener('click', clearCache);

function saveOptions() {
  const backendUrl = document.getElementById('backendUrl').value.trim();
  const secret = document.getElementById('secret').value.trim();
  const status = document.getElementById('status');

  if (!backendUrl || !secret) {
    status.textContent = 'Please fill in all fields.';
    status.className = 'error';
    return;
  }

  // Save to local storage (content scripts can access local, not sync)
  chrome.storage.local.set({
    [CONFIG_KEY]: { backendUrl, secret }
  }, () => {
    status.textContent = 'Options saved successfully!';
    status.className = 'success';
    console.log("StreamRatings config saved:", { backendUrl, hasSecret: !!secret });
    setTimeout(() => {
      status.textContent = '';
    }, 2000);
  });
}

function restoreOptions() {
  chrome.storage.local.get(CONFIG_KEY, (items) => {
    if (items[CONFIG_KEY]) {
      document.getElementById('backendUrl').value = items[CONFIG_KEY].backendUrl;
      document.getElementById('secret').value = items[CONFIG_KEY].secret;
      console.log("StreamRatings config restored");
    }
  });
  updateCacheStats();
}

function clearCache() {
  const cacheStatus = document.getElementById('cacheStatus');
  
  chrome.storage.local.get(null, (items) => {
    const keysToRemove = Object.keys(items).filter(key => key.startsWith(STORAGE_KEY_PREFIX));
    
    if (keysToRemove.length === 0) {
      cacheStatus.textContent = 'Cache is already empty.';
      cacheStatus.className = 'info';
      return;
    }
    
    chrome.storage.local.remove(keysToRemove, () => {
      cacheStatus.textContent = `Cleared ${keysToRemove.length} cached ratings!`;
      cacheStatus.className = 'success';
      console.log(`Cleared ${keysToRemove.length} cached items`);
      setTimeout(() => {
        cacheStatus.textContent = '';
        updateCacheStats();
      }, 2000);
    });
  });
}

function updateCacheStats() {
  chrome.storage.local.get(null, (items) => {
    const cacheKeys = Object.keys(items).filter(key => key.startsWith(STORAGE_KEY_PREFIX));
    const cacheInfo = document.querySelector('.cache-info');
    if (cacheInfo) {
      cacheInfo.textContent = `Currently ${cacheKeys.length} titles cached. Clear to force fresh lookups.`;
    }
  });
}
