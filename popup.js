// UI Elements
const xStatus = document.getElementById('x-status');
const xAccountInfo = document.getElementById('x-account-info');
const connectXBtn = document.getElementById('connect-x');
const disconnectXBtn = document.getElementById('disconnect-x');
const farcasterSection = document.getElementById('farcaster-section');
const farcasterStatus = document.getElementById('farcaster-status');
const farcasterAccountInfo = document.getElementById('farcaster-account-info');
const connectFarcasterBtn = document.getElementById('connect-farcaster');
const disconnectFarcasterBtn = document.getElementById('disconnect-farcaster');

// Helper functions
function updateXStatus(message, type = 'normal') {
  xStatus.textContent = message;
  xStatus.className = 'status-box' + (type !== 'normal' ? ' ' + type : '');
}

function updateFarcasterStatus(message, type = 'normal') {
  farcasterStatus.textContent = message;
  farcasterStatus.className = 'status-box' + (type !== 'normal' ? ' ' + type : '');
}

// Track OAuth window
let oauthWindow = null;

// Check if OAuth window was closed
function checkOAuthWindow() {
  if (oauthWindow && oauthWindow.closed) {
    console.log('OAuth window was closed');
    connectXBtn.disabled = false;
    updateXStatus('X (Twitter) connection cancelled', 'error');
    oauthWindow = null;
  }
}

// Check initial connection state
chrome.storage.local.get(['twitter_access_token', 'twitter_screen_name', 'farcaster_signer_uuid', 'farcaster_username'], (result) => {
  if (result.twitter_access_token && result.twitter_screen_name) {
    updateXStatus('Connected to X (Twitter)', 'success');
    xAccountInfo.textContent = `Connected as @${result.twitter_screen_name}`;
    connectXBtn.style.display = 'none';
    disconnectXBtn.style.display = 'block';
    farcasterSection.style.display = 'block';
  } else {
    updateXStatus('Not connected to X (Twitter)');
    connectXBtn.style.display = 'block';
    disconnectXBtn.style.display = 'none';
    farcasterSection.style.display = 'none';
  }

  if (result.farcaster_signer_uuid && result.farcaster_username) {
    updateFarcasterStatus('Connected to Farcaster', 'success');
    farcasterAccountInfo.textContent = `Connected as @${result.farcaster_username}`;
    connectFarcasterBtn.style.display = 'none';
    disconnectFarcasterBtn.style.display = 'block';
  } else if (result.twitter_access_token) {
    updateFarcasterStatus('Ready to connect Farcaster');
    connectFarcasterBtn.style.display = 'block';
    disconnectFarcasterBtn.style.display = 'none';
  }
});

// X (Twitter) Connect Button
connectXBtn.addEventListener('click', function() {
  updateXStatus('Starting X (Twitter) connection...');
  connectXBtn.disabled = true;
  
  chrome.runtime.sendMessage({ type: 'START_X_OAUTH' }, function(response) {
    if (response && response.ok) {
      updateXStatus('Waiting for X (Twitter) authorization...', 'normal');
      // Start checking if OAuth window was closed
      if (oauthWindow) {
        oauthWindow.close();
      }
      oauthWindow = window.open('about:blank', 'oauth_window', 'width=600,height=600');
      const checkInterval = setInterval(() => {
        if (oauthWindow && oauthWindow.closed) {
          clearInterval(checkInterval);
          checkOAuthWindow();
        }
      }, 500);
    } else {
      updateXStatus('Failed to start X (Twitter) connection', 'error');
      connectXBtn.disabled = false;
    }
  });
});

// X (Twitter) Disconnect Button
disconnectXBtn.addEventListener('click', function() {
  if (confirm('Are you sure you want to disconnect your X (Twitter) account? This will also disconnect Farcaster.')) {
    chrome.storage.local.remove([
      'twitter_access_token',
      'twitter_access_token_secret',
      'twitter_screen_name',
      'farcaster_signer_uuid',
      'farcaster_username',
      'lastTweetId'
    ], function() {
      updateXStatus('Not connected to X (Twitter)');
      xAccountInfo.textContent = '';
      connectXBtn.style.display = 'block';
      disconnectXBtn.style.display = 'none';
      farcasterSection.style.display = 'none';
    });
  }
});

// Farcaster Connect Button
connectFarcasterBtn.addEventListener('click', function() {
  updateFarcasterStatus('Starting Farcaster connection...');
  connectFarcasterBtn.disabled = true;
  
  chrome.runtime.sendMessage({ type: 'START_FARCASTER_AUTH' }, function(response) {
    if (response && response.ok) {
      updateFarcasterStatus('Waiting for Farcaster authorization...', 'normal');
    } else {
      updateFarcasterStatus('Failed to start Farcaster connection', 'error');
      connectFarcasterBtn.disabled = false;
    }
  });
});

// Farcaster Disconnect Button
disconnectFarcasterBtn.addEventListener('click', function() {
  if (confirm('Are you sure you want to disconnect your Farcaster account?')) {
    chrome.storage.local.remove([
      'farcaster_signer_uuid',
      'farcaster_username',
      'lastTweetId'
    ], function() {
      updateFarcasterStatus('Ready to connect Farcaster');
      farcasterAccountInfo.textContent = '';
      connectFarcasterBtn.style.display = 'block';
      disconnectFarcasterBtn.style.display = 'none';
    });
  }
});

// Listen for auth status updates from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'X_AUTH_SUCCESS') {
    updateXStatus('Connected to X (Twitter)', 'success');
    xAccountInfo.textContent = `Connected as @${message.screen_name}`;
    connectXBtn.style.display = 'none';
    disconnectXBtn.style.display = 'block';
    farcasterSection.style.display = 'block';
    connectXBtn.disabled = false;
  } else if (message.type === 'X_AUTH_FAILURE') {
    updateXStatus('X (Twitter) connection failed', 'error');
    connectXBtn.disabled = false;
  } else if (message.type === 'FARCASTER_AUTH_SUCCESS') {
    updateFarcasterStatus('Connected to Farcaster', 'success');
    farcasterAccountInfo.textContent = `Connected as @${message.username}`;
    connectFarcasterBtn.style.display = 'none';
    disconnectFarcasterBtn.style.display = 'block';
    connectFarcasterBtn.disabled = false;
  } else if (message.type === 'FARCASTER_AUTH_FAILURE') {
    updateFarcasterStatus('Farcaster connection failed', 'error');
    connectFarcasterBtn.disabled = false;
  }
}); 