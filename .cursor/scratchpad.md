# Background and Motivation

The goal is to build a Chrome extension that automatically posts a user's tweets from X (Twitter) to Farcaster. The extension should work for a single user (the installer), leverage the $5k X API Pro plan, and provide a seamless onboarding flow that includes Farcaster signup (or account connection) after X OAuth. The extension should be low friction, ideally supporting mobile tweeting as well, and should be 'set and forget.' If content on Farcaster performs well, users can earn tips. The primary outcome is to onboard new users to Farcaster.

# Key Challenges and Analysis

- Handling X (Twitter) OAuth and API integration securely in a Chrome extension.
- Automating tweet detection and cross-posting with minimal user friction.
- Integrating Farcaster sign-up and authentication within the extension.
- Ensuring the extension works for both desktop and mobile (bonus: mobile X app support).
- Providing a simple onboarding flow for new and existing Farcaster users.
- Handling rate limits, errors, and edge cases (e.g., deleted tweets, failed posts).
- Ensuring user privacy and security, especially with API tokens.

# High-level Task Breakdown

1. **Research Feasibility and APIs**
   - Success: Documented notes on X API, Farcaster API, and Chrome extension capabilities for automation and OAuth.
2. **Chrome Extension Boilerplate Setup**
   - Success: Minimal extension loads in Chrome, with popup and background script.
3. **X (Twitter) OAuth Integration**
   - Success: User can authenticate with X and grant necessary permissions.
4. **Farcaster Onboarding Flow**
   - Success: After X OAuth, user is prompted to sign up for or connect a Farcaster account.
5. **Tweet Detection and Cross-Posting Logic**
   - Success: Extension detects new tweets by the user and posts them to Farcaster automatically.
6. **Mobile Support Research and Implementation (Bonus)**
   - Success: Documented and, if possible, implemented a way to support X mobile app tweets.
7. **User Settings and 'Switch On/Off' Toggle**
   - Success: User can enable/disable auto-posting and view status in the extension popup.
8. **Testing and Debugging**
   - Success: All flows tested, edge cases handled, and debug info included in output.
9. **Documentation and Packaging**
   - Success: README and onboarding instructions for new users.

# Project Status Board

- [x] Research Feasibility and APIs
- [x] Chrome Extension Boilerplate Setup
- [ ] X (Twitter) OAuth Integration (in progress)
- [ ] Farcaster Onboarding Flow
- [ ] Tweet Detection and Cross-Posting Logic
- [ ] Mobile Support Research and Implementation (Bonus)
- [ ] User Settings and 'Switch On/Off' Toggle
- [ ] Testing and Debugging
- [ ] Documentation and Packaging

# Current Status / Progress Tracking

## Research Feasibility and APIs

### X (Twitter) API (Pro Plan)
- **Endpoints:**
  - User timeline: Retrieve up to 3,200 most recent posts (tweets, retweets, replies, quotes) for a user. Supports polling for new posts.
  - Manage posts: Create (POST) and delete (DELETE) tweets. 200 POSTs per 15 min/user.
- **Authentication:** OAuth 1.0a User Context or OAuth 2.0 Authorization Code with PKCE. Requires user to authorize the app.
- **Rate Limits:** Generous for Pro plan (300,000 posts/month at app level, 1,000,000 GETs/month at app level).
- **Chrome Extension:** OAuth flow can be implemented using a background script and a callback page. Example repos exist for Twitter OAuth in Chrome extensions.

### Farcaster API
- **Endpoints:**
  - Posting ("casting"): Requires submitting a signed protobuf message to the Farcaster Hub (HTTP API or via third-party services like Neynar or far.quest).
  - Authentication: Uses Ed25519 key pairs (user custody or app key). AuthKit and wallet-based sign-in flows are available for onboarding.
  - Onboarding: Farcaster AuthKit supports sign-in with Ethereum wallet and profile creation. Existing users can connect via FID.
- **Docs:** https://docs.farcaster.xyz/reference/warpcast/api, https://docs.farcaster.xyz/auth-kit/client/wallet/authenticate

### Chrome Extension OAuth Best Practices
- Use the Chrome Identity API or implement OAuth in a background script with a callback page.
- Store tokens securely in chrome.storage.local.
- For Twitter, use a content script to parse the callback URL and send tokens to the background script.
- Example: https://github.com/lambtron/chrome-extension-twitter-oauth-example

### Feasibility
- **Automated cross-posting is feasible**: Both X and Farcaster provide APIs for reading user tweets and posting to Farcaster.
- **OAuth flows are supported** in Chrome extensions, with existing open-source examples.
- **Farcaster onboarding** can be integrated post-X OAuth, using AuthKit or direct API calls.
- **Mobile support**: Chrome extensions do not run on mobile browsers, but mobile X app tweets could be handled via polling the user's timeline (with some delay). For true mobile support, a separate mobile app or integration with Farcaster's mobile onboarding may be needed.

## Chrome Extension Boilerplate Setup
- Starting setup of a minimal Chrome extension (Manifest V3) with popup and background script. Will verify extension loads in Chrome and basic UI appears.

## X (Twitter) OAuth Integration
- User confirmed extension loads and popup appears. Starting implementation of X (Twitter) OAuth flow in the extension.
- Added Connect X (Twitter) button to popup, message passing to background script, and status updates. Next: implement actual OAuth flow.

# Executor's Feedback or Assistance Requests

- User confirmed extension loads. Proceeding with X (Twitter) OAuth Integration.
- Connect X (Twitter) button and message passing implemented. Next: implement actual OAuth flow. If you have X API credentials (consumer key/secret), please provide them or let me know if you want to use test credentials for development.

# Lessons

- Include info useful for debugging in the program output.
- Read the file before you try to edit it.
- If there are vulnerabilities that appear in the terminal, run npm audit before proceeding.
- Always ask before using the -force git command. 