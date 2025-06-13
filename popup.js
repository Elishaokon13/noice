document.getElementById('connect-x').addEventListener('click', function() {
  document.getElementById('status').textContent = 'Starting X (Twitter) OAuth...';
  chrome.runtime.sendMessage({ type: 'START_X_OAUTH' }, function(response) {
    if (response && response.ok) {
      document.getElementById('status').textContent = 'X (Twitter) OAuth started.';
    } else {
      document.getElementById('status').textContent = 'Failed to start X (Twitter) OAuth.';
    }
  });
}); 