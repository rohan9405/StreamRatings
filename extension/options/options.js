const CONFIG_KEY = "sr_config";
const STORAGE_KEY_PREFIX = "sr_cache_";

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
document.getElementById('clearCache').addEventListener('click', clearCache);

function saveOptions() {
  const omdbApiKey = document.getElementById('omdbApiKey').value.trim();
  const status = document.getElementById('status');
  const button = document.getElementById('save');

  if (!/^[a-z0-9]{6,12}$/i.test(omdbApiKey)) {
    status.textContent = 'That doesn\'t look like an OMDb key (8 letters/numbers, from the OMDb email).';
    status.className = 'error';
    return;
  }

  // Check the key with one real lookup before saving
  button.disabled = true;
  status.textContent = 'Checking key…';
  status.className = 'info';
  chrome.runtime.sendMessage({ action: 'testKey', apiKey: omdbApiKey }, (response) => {
    button.disabled = false;
    if (!response || !response.success) {
      const error = response ? response.error : 'No response';
      status.textContent = /api key|invalid/i.test(error)
        ? 'OMDb rejected this key. Did you click the activation link in the OMDb email?'
        : `Couldn't check the key: ${error}`;
      status.className = 'error';
      return;
    }
    chrome.storage.local.set({ [CONFIG_KEY]: { omdbApiKey } }, () => {
      status.textContent = 'Saved! Open Netflix, Prime Video or JioHotstar to see ratings.';
      status.className = 'success';
    });
  });
}

function restoreOptions() {
  chrome.storage.local.get(CONFIG_KEY, (items) => {
    if (items[CONFIG_KEY] && items[CONFIG_KEY].omdbApiKey) {
      document.getElementById('omdbApiKey').value = items[CONFIG_KEY].omdbApiKey;
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
      cacheInfo.textContent = `${cacheKeys.length} titles cached in this browser. Ratings refresh every 3–30 days depending on how recent the title is.`;
    }
  });
}
