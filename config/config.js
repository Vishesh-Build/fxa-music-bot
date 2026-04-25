// config/config.js
// Central configuration file for FxA Music Bot

require('dotenv').config();

module.exports = {
  // Discord credentials
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,

  // Spotify credentials (optional)
  spotify: {
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  },

  // Player defaults
  defaultVolume: parseInt(process.env.DEFAULT_VOLUME) || 50,
  maxQueueSize: parseInt(process.env.MAX_QUEUE_SIZE) || 100,

  // Auto-disconnect after inactivity (ms)
  inactivityTimeout: parseInt(process.env.INACTIVITY_TIMEOUT) || 300000, // 5 minutes

  // Loop modes
  loopModes: {
    OFF: 'off',
    TRACK: 'track',
    QUEUE: 'queue',
  },

  // Embed colors
  colors: {
    primary: 0x5865F2,   // Discord blurple
    success: 0x57F287,   // Green
    error: 0xED4245,     // Red
    warning: 0xFEE75C,   // Yellow
    info: 0x5865F2,      // Blue
  },

  // Bot branding
  botName: 'FxA Music Bot',
  botEmoji: '🎵',
};
