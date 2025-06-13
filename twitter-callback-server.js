// Sample Node.js/Express server for Twitter OAuth callback
const express = require('express');
const OAuth = require('oauth').OAuth;
const cors = require('cors');
const Twitter = require('twitter-lite'); // npm install twitter-lite
const app = express();
const port = process.env.PORT || 3000;

// Twitter app credentials
const consumerKey = 'UTNfnJ6b5fHpyjqAQ0B7hVjLL';
const consumerSecret = 'BEt1aawEkThiryrhi9lPxZOH5WTlLPZfvx3mMILcPdJtfSNcUj';
const callbackURL = 'https://ba13-102-90-80-88.ngrok-free.app/twitter-callback';

// In-memory store for request token secrets (for demo only)
const requestTokenSecrets = {};

const oa = new OAuth(
  'https://api.twitter.com/oauth/request_token',
  'https://api.twitter.com/oauth/access_token',
  consumerKey,
  consumerSecret,
  '1.0A',
  callbackURL,
  'HMAC-SHA1'
);

app.use(cors());
app.use(express.json());

// Endpoint to get a fresh request token
app.get('/twitter-request-token', (req, res) => {
  oa.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret, results) {
    if (error) {
      console.error('Error getting OAuth request token:', error);
      return res.status(500).json({ error: 'Failed to get request token' });
    }
    // Store the secret for later use in callback
    requestTokenSecrets[oauth_token] = oauth_token_secret;
    res.json({ oauth_token, oauth_token_secret });
  });
});

// Twitter OAuth callback endpoint
app.get('/twitter-callback', (req, res) => {
  const { oauth_token, oauth_verifier } = req.query;
  const oauth_token_secret = requestTokenSecrets[oauth_token];
  console.log('Received callback from Twitter:');
  console.log('oauth_token:', oauth_token);
  console.log('oauth_verifier:', oauth_verifier);
  console.log('oauth_token_secret:', oauth_token_secret);

  if (!oauth_token || !oauth_verifier || !oauth_token_secret) {
    return res.status(400).send(`
      <html>
        <body>
          <h2>Missing required OAuth parameters.</h2>
          <script>
            window.close();
          </script>
        </body>
      </html>
    `);
  }

  // Exchange for access token and secret
  oa.getOAuthAccessToken(
    oauth_token,
    oauth_token_secret,
    oauth_verifier,
    (error, access_token, access_token_secret, results) => {
      if (error) {
        console.error('Error getting access token:', error);
        return res.status(500).send(`
          <html>
            <body>
              <h2>Error getting access token from Twitter.</h2>
              <script>
                window.close();
              </script>
            </body>
          </html>
        `);
      }

      // Clean up the request token
      delete requestTokenSecrets[oauth_token];

      // Send success response with script to communicate with extension
      res.send(`
        <html>
          <body>
            <h2>Twitter OAuth Success!</h2>
            <p>You can close this window now.</p>
            <script>
              // Send message to extension
              window.opener.postMessage({
                type: 'TWITTER_OAUTH_SUCCESS',
                data: {
                  access_token: '${access_token}',
                  access_token_secret: '${access_token_secret}',
                  screen_name: '${results.screen_name}'
                }
              }, '*');
              
              // Close the window after a short delay
              setTimeout(() => window.close(), 1000);
            </script>
          </body>
        </html>
      `);
    }
  );
});

// Verify credentials endpoint
app.post('/verify-credentials', async (req, res) => {
  const { access_token, access_token_secret } = req.body;
  
  if (!access_token || !access_token_secret) {
    return res.status(400).json({ error: 'Missing access token or secret' });
  }

  const client = new Twitter({
    subdomain: 'api', // api is the default
    version: '1.1', // version 1.1 is the default
    consumer_key: consumerKey,
    consumer_secret: consumerSecret,
    access_token_key: access_token,
    access_token_secret: access_token_secret,
  });

  try {
    const user = await client.get('account/verify_credentials');
    res.json({ screen_name: user.screen_name });
  } catch (error) {
    console.error('Error verifying credentials:', error);
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.post('/user-timeline', async (req, res) => {
  const { access_token, access_token_secret, since_id } = req.body;
  const client = new Twitter({
    subdomain: 'api',
    version: '1.1',
    consumer_key: consumerKey,
    consumer_secret: consumerSecret,
    access_token_key: access_token,
    access_token_secret: access_token_secret,
  });

  try {
    const params = { count: 5, tweet_mode: 'extended' };
    if (since_id) params.since_id = since_id;
    const tweets = await client.get('statuses/user_timeline', params);
    res.json({ tweets });
  } catch (error) {
    console.error('Error fetching timeline:', error);
    res.status(500).json({ error: 'Failed to fetch timeline' });
  }
});

app.listen(port, () => {
  console.log(`Twitter callback server listening at http://localhost:${port}`);
}); 