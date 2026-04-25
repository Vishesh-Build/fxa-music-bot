// fix-youtube.js
// Run this ONCE to fix YouTube "Invalid URL" / bot-detection errors
// Usage: node fix-youtube.js

require('dotenv').config();
const play = require('play-dl');
const fs = require('fs');
const path = require('path');

(async () => {
  console.log('🔧 Configuring play-dl for YouTube...');

  try {
    // This creates a .data/youtube.data file with proper config
    await play.setToken({
      useragent: [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      ],
    });

    // If Spotify credentials exist, set those too
    if (process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET) {
      await play.setToken({
        spotify: {
          client_id: process.env.SPOTIFY_CLIENT_ID,
          client_secret: process.env.SPOTIFY_CLIENT_SECRET,
          refresh_token: '',
          market: 'IN',
        },
      });
      console.log('✅ Spotify configured!');
    }

    console.log('✅ YouTube configured!');
    console.log('');
    console.log('Now run: npm start');
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
})();
