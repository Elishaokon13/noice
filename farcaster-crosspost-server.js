const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 4000;

// Replace with your Neynar API key
const NEYNAR_API_KEY = '1897E719-3316-4B56-9FB7-21C7568665FD';

app.use(cors());
app.use(express.json());

// POST /crosspost - expects { text, embeds, signer_uuid }
app.post('/crosspost', async (req, res) => {
  const { text, embeds, signer_uuid } = req.body;
  if (!text || !signer_uuid) {
    return res.status(400).json({ error: 'Missing text or signer_uuid' });
  }

  try {
    const response = await axios.post(
      'https://api.neynar.com/v2/farcaster/cast',
      {
        signer_uuid,
        text,
        embeds: Array.isArray(embeds) ? embeds : []
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'api_key': NEYNAR_API_KEY
        }
      }
    );
    console.log('Farcaster API response:', response.data);
    res.json(response.data);
  } catch (error) {
    console.error('Error posting to Farcaster:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to post to Farcaster', details: error.response ? error.response.data : error.message });
  }
});

app.listen(port, () => {
  console.log(`Farcaster crosspost server listening at http://localhost:${port}`);
}); 