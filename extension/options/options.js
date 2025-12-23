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
}
