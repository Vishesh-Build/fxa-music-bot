// keepalive.js
// Render pe cold start rokne ke liye — ek simple HTTP server
// index.js mein require karo: require('./keepalive');

const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('FxA Music Bot is alive!');
});

server.listen(3000, () => {
  console.log('🌐 Keepalive server running on port 3000');
});
