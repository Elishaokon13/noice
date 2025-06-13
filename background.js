console.log('Noice X to Farcaster background script running.'); 

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'START_X_OAUTH') {
    console.log('Received request to start X (Twitter) OAuth flow.');
    // OAuth logic will be implemented here
    sendResponse({ok: true});
  }
}); 