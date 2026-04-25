require('dotenv').config();
const play = require('play-dl');

(async () => {
  await play.setToken({
    spotify: {
      client_id: process.env.SPOTIFY_CLIENT_ID,
      client_secret: process.env.SPOTIFY_CLIENT_SECRET,
      refresh_token: '',
      market: 'IN',
    },
  });
  console.log('✅ Spotify setup complete!');
})();