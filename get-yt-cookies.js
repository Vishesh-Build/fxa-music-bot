// get-yt-cookies.js
// Run this ONCE to set up YouTube cookies for play-dl
// Usage: node get-yt-cookies.js

require('dotenv').config();
const play = require('play-dl');

(async () => {
  console.log('');
  console.log('=== YouTube Cookie Setup ===');
  console.log('');
  console.log('YouTube is blocking requests (429 error).');
  console.log('We need to give play-dl your YouTube cookies.');
  console.log('');
  console.log('Steps:');
  console.log('1. Chrome mein youtube.com open karo');
  console.log('2. F12 dabao (DevTools open hoga)');
  console.log('3. "Application" tab click karo');
  console.log('4. Left side: Storage > Cookies > https://www.youtube.com');
  console.log('5. Yeh values copy karo: VISITOR_INFO1_LIVE, YSC, CONSENT');
  console.log('');

  // Use play-dl's built-in authorization setup
  try {
    await play.setToken({
      youtube: {
        cookie: process.env.YT_COOKIE || '',
      },
    });

    if (!process.env.YT_COOKIE) {
      console.log('❌ YT_COOKIE not found in .env');
      console.log('');
      console.log('Add this to your .env file:');
      console.log('YT_COOKIE=VISITOR_INFO1_LIVE=xxxxx; YSC=xxxxx; CONSENT=YES+xxx');
      console.log('');
      console.log('Then run: node get-yt-cookies.js');
    } else {
      console.log('✅ YouTube cookies configured!');
      console.log('Now run: npm start');
    }

    // Also configure Spotify if available
    if (process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET) {
      await play.setToken({
        spotify: {
          client_id: process.env.SPOTIFY_CLIENT_ID,
          client_secret: process.env.SPOTIFY_CLIENT_SECRET,
          refresh_token: '',
          market: 'IN',
        },
      });
      console.log('✅ Spotify also configured!');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
