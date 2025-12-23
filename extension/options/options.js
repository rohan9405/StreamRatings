const CONFIG_KEY = "sr_config";

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);

function saveOptions() {
  const backendUrl = document.getElementById('backendUrl').value.trim();
  const secret = document.getElementById('secret').value.trim();
  const status = document.getElementById('status');

  if (!backendUrl || !secret) {
    status.textContent = 'Please fill in all fields.';
    status.className = 'error';
    return;
  }

  // Request permission for the new backend URL
  const origin = new URL(backendUrl).origin + "/*";

  chrome.permissions.request({
    origins: [origin]
  }, (granted) => {
    if (granted) {
      chrome.storage.sync.set({
        [CONFIG_KEY]: { backendUrl, secret }
      }, () => {
        status.textContent = 'Options saved.';
        status.className = 'success';
        setTimeout(() => {
          status.textContent = '';
        }, 2000);
      });
    } else {
      status.textContent = 'Permission denied. Cannot fetch from that URL.';
      status.className = 'error';
    }
  });
}

function restoreOptions() {
  chrome.storage.sync.get(CONFIG_KEY, (items) => {
    if (items[CONFIG_KEY]) {
      document.getElementById('backendUrl').value = items[CONFIG_KEY].backendUrl;
      document.getElementById('secret').value = items[CONFIG_KEY].secret;
    }
  });
}
