console.log('Noice X to Farcaster background script running.');

// Constants
const TWITTER_CONSUMER_KEY = 'UTNfnJ6b5fHpyjqAQ0B7hVjLL';
const TWITTER_CONSUMER_SECRET = 'BEt1aawEkThiryrhi9lPxZOH5WTlLPZfvx3mMILcPdJtfSNcUj';
const TWITTER_CALLBACK_URL = 'https://ba13-102-90-80-88.ngrok-free.app/twitter-callback';
const API_BASE_URL = 'http://localhost:3000';
const FARCASTER_API_URL = 'http://localhost:4000';
const POLL_INTERVAL = 60 * 1000; // 1 minute

// State management
let pollInterval = null;

// Helper functions
function startPolling() {
  if (pollInterval) {
    clearInterval(pollInterval);
  }
  pollInterval = setInterval(pollTwitterAndCrosspost, POLL_INTERVAL);
  pollTwitterAndCrosspost(); // Initial poll
}

function stopPolling() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
}

async function checkTwitterCredentials() {
  try {
    const response = await fetch(`${API_BASE_URL}/verify-credentials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_token: result.twitter_access_token,
        access_token_secret: result.twitter_access_token_secret
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to verify credentials');
    }
    
    const data = await response.json();
    return data.screen_name;
  } catch (error) {
    console.error('Error verifying Twitter credentials:', error);
    return null;
  }
}

// OAuth flow
async function startTwitterOAuth() {
  try {
    const response = await fetch(`${API_BASE_URL}/twitter-request-token`);
    if (!response.ok) {
      throw new Error('Failed to get request token');
    }
    
    const data = await response.json();
    if (!data.oauth_token) {
      throw new Error('No oauth_token received');
    }

    // Store request token for later verification
    chrome.storage.local.set({ 
      twitter_request_token: data.oauth_token,
      twitter_request_token_secret: data.oauth_token_secret 
    });

    // Open Twitter auth page
    const oauthUrl = `https://api.twitter.com/oauth/authenticate?oauth_token=${data.oauth_token}`;
    chrome.tabs.create({ url: oauthUrl });
    
    return true;
  } catch (error) {
    console.error('Error starting Twitter OAuth:', error);
    return false;
  }
}

async function handleTwitterCallback(url) {
  try {
    const params = new URLSearchParams(url.split('?')[1]);
    const oauth_token = params.get('oauth_token');
    const oauth_verifier = params.get('oauth_verifier');

    // Verify this is the request token we stored
    const stored = await chrome.storage.local.get(['twitter_request_token']);
    if (stored.twitter_request_token !== oauth_token) {
      throw new Error('OAuth token mismatch');
    }

    const response = await fetch(`${API_BASE_URL}/twitter-access-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oauth_token, oauth_verifier })
    });

    if (!response.ok) {
      throw new Error('Failed to get access token');
    }

    const data = await response.json();
    
    // Store the access token and screen name
    await chrome.storage.local.set({
      twitter_access_token: data.oauth_token,
      twitter_access_token_secret: data.oauth_token_secret,
      twitter_screen_name: data.screen_name,
      lastTweetId: null // Reset last tweet ID
    });

    // Clean up request token
    await chrome.storage.local.remove(['twitter_request_token', 'twitter_request_token_secret']);

    // Notify popup of success
    chrome.runtime.sendMessage({
      type: 'X_AUTH_SUCCESS',
      screen_name: data.screen_name
    });

    // Start polling
    startPolling();

    return true;
  } catch (error) {
    console.error('Error handling Twitter callback:', error);
    chrome.runtime.sendMessage({ type: 'X_AUTH_FAILURE' });
    return false;
  }
}

async function startFarcasterAuth() {
  try {
    const response = await fetch(`${FARCASTER_API_URL}/start-auth`);
    if (!response.ok) {
      throw new Error('Failed to start Farcaster auth');
    }
    
    const data = await response.json();
    chrome.tabs.create({ url: data.auth_url });
    return true;
  } catch (error) {
    console.error('Error starting Farcaster auth:', error);
    return false;
  }
}

async function handleFarcasterCallback(url) {
  try {
    const params = new URLSearchParams(url.split('?')[1]);
    const code = params.get('code');
    
    const response = await fetch(`${FARCASTER_API_URL}/complete-auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    });

    if (!response.ok) {
      throw new Error('Failed to complete Farcaster auth');
    }

    const data = await response.json();
    
    // Store Farcaster credentials
    await chrome.storage.local.set({
      farcaster_signer_uuid: data.signer_uuid,
      farcaster_username: data.username
    });

    // Notify popup of success
    chrome.runtime.sendMessage({
      type: 'FARCASTER_AUTH_SUCCESS',
      username: data.username
    });

    return true;
  } catch (error) {
    console.error('Error handling Farcaster callback:', error);
    chrome.runtime.sendMessage({ type: 'FARCASTER_AUTH_FAILURE' });
    return false;
  }
}

// Message handling
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'START_X_OAUTH') {
    startTwitterOAuth().then(ok => sendResponse({ok}));
    return true; // Keep channel open for async response
  } else if (message.type === 'START_FARCASTER_AUTH') {
    startFarcasterAuth().then(ok => sendResponse({ok}));
    return true;
  }
});

// URL monitoring for OAuth callbacks
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    if (changeInfo.url.startsWith(TWITTER_CALLBACK_URL)) {
      handleTwitterCallback(changeInfo.url);
    } else if (changeInfo.url.includes('farcaster-callback')) {
      handleFarcasterCallback(changeInfo.url);
    }
  }
});

// Cross-posting logic
async function pollTwitterAndCrosspost() {
  try {
    const result = await chrome.storage.local.get([
      'twitter_access_token',
      'twitter_access_token_secret',
      'farcaster_signer_uuid',
      'lastTweetId'
    ]);

    const { twitter_access_token, twitter_access_token_secret, farcaster_signer_uuid, lastTweetId } = result;
    
    if (!twitter_access_token || !twitter_access_token_secret || !farcaster_signer_uuid) {
      console.log('Missing credentials, skipping poll.');
      return;
    }

    // Verify Twitter credentials are still valid
    const screenName = await checkTwitterCredentials();
    if (!screenName) {
      console.error('Twitter credentials invalid, stopping polling');
      stopPolling();
      chrome.storage.local.remove([
        'twitter_access_token',
        'twitter_access_token_secret',
        'twitter_screen_name'
      ]);
      chrome.runtime.sendMessage({ type: 'X_AUTH_FAILURE' });
      return;
    }

    const timelineRes = await fetch(`${API_BASE_URL}/user-timeline`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_token: twitter_access_token,
        access_token_secret: twitter_access_token_secret,
        since_id: lastTweetId
      })
    });

    if (!timelineRes.ok) {
      throw new Error('Failed to fetch timeline');
    }

    const timeline = await timelineRes.json();
    if (!timeline || !timeline.tweets || !Array.isArray(timeline.tweets)) {
      return;
    }

    let newLastTweetId = lastTweetId;
    for (const tweet of timeline.tweets) {
      // Skip retweets and replies
      if (tweet.retweeted_status || tweet.in_reply_to_status_id) {
        continue;
      }

      const text = tweet.full_text || tweet.text;
      const embeds = [];
      if (tweet.entities && tweet.entities.media) {
        tweet.entities.media.forEach(m => embeds.push(m.media_url_https));
      }

      const crosspostRes = await fetch(`${FARCASTER_API_URL}/crosspost`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          embeds,
          signer_uuid: farcaster_signer_uuid
        })
      });

      if (!crosspostRes.ok) {
        console.error('Failed to crosspost tweet:', tweet.id_str);
        continue;
      }

      if (!newLastTweetId || tweet.id_str > newLastTweetId) {
        newLastTweetId = tweet.id_str;
      }
    }

    if (newLastTweetId !== lastTweetId) {
      chrome.storage.local.set({ lastTweetId: newLastTweetId });
    }
  } catch (err) {
    console.error('Error in pollTwitterAndCrosspost:', err);
  }
}

// Initialize polling if credentials exist
chrome.storage.local.get([
  'twitter_access_token',
  'twitter_access_token_secret',
  'farcaster_signer_uuid'
], (result) => {
  if (result.twitter_access_token && 
      result.twitter_access_token_secret && 
      result.farcaster_signer_uuid) {
    startPolling();
  }
}); 