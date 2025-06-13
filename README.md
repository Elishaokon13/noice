# Noice X to Farcaster Cross-poster

A Chrome extension that automatically cross-posts your tweets to Farcaster. Built for the Noice bounty program.

## Features

- Automatic cross-posting of tweets to Farcaster
- Simple one-time setup for X (Twitter) and Farcaster authentication
- Support for media attachments
- Skips retweets and replies
- Easy toggle to enable/disable cross-posting
- Real-time status updates and connection management

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the authentication and cross-posting servers:
   ```bash
   npm start
   ```

3. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked" and select this directory

## Usage

1. Click the extension icon in Chrome to open the popup
2. Click "Connect X (Twitter)" to authenticate with your X account
3. After X authentication, click "Connect Farcaster" to link your Farcaster account
4. Once both accounts are connected, the extension will automatically cross-post your new tweets to Farcaster

## Configuration

The extension uses the following environment variables (currently hardcoded in the servers):

- Twitter API (Pro Plan):
  - `TWITTER_CONSUMER_KEY`
  - `TWITTER_CONSUMER_SECRET`
  - `TWITTER_CALLBACK_URL`

- Farcaster API (via Neynar):
  - `NEYNAR_API_KEY`

## Development

The extension consists of:

- Chrome Extension:
  - `manifest.json`: Extension configuration
  - `popup.html/js`: UI for account management
  - `background.js`: Handles OAuth flows and cross-posting logic

- Servers:
  - `twitter-callback-server.js`: Handles X (Twitter) OAuth and timeline fetching
  - `farcaster-crosspost-server.js`: Handles Farcaster authentication and posting

## Security

- OAuth tokens are stored securely in Chrome's extension storage
- API keys are kept server-side
- All API requests are made through the local servers, not directly from the extension

## Limitations

- The extension requires running local servers for OAuth and cross-posting
- Mobile tweets will be cross-posted when the extension detects them (slight delay possible)
- Rate limits apply based on the X API Pro plan

## Contributing

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## License

MIT 