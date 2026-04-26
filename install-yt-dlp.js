// scripts/install-yt-dlp.js
// Automatically downloads yt-dlp binary on Linux (Railway/server)
// On Windows, skips (uses local yt-dlp.exe)

const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BIN_PATH = path.join(__dirname, '..', 'yt-dlp-bin');

// Skip on Windows
if (process.platform === 'win32') {
  console.log('Windows detected — skipping yt-dlp auto-install.');
  process.exit(0);
}

// Check if already installed system-wide
try {
  execSync('yt-dlp --version', { stdio: 'ignore' });
  console.log('✅ yt-dlp already installed system-wide!');
  process.exit(0);
} catch {
  console.log('yt-dlp not found system-wide, downloading binary...');
}

// Download yt-dlp binary
const url = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp';

const file = fs.createWriteStream(BIN_PATH);

function download(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        // Follow redirect
        https.get(res.headers.location, (res2) => {
          res2.pipe(dest);
          dest.on('finish', () => { dest.close(); resolve(); });
        }).on('error', reject);
      } else {
        res.pipe(dest);
        dest.on('finish', () => { dest.close(); resolve(); });
      }
    }).on('error', reject);
  });
}

(async () => {
  try {
    await download(url, file);
    fs.chmodSync(BIN_PATH, '755');
    console.log('✅ yt-dlp binary downloaded to:', BIN_PATH);
  } catch (err) {
    console.error('❌ Failed to download yt-dlp:', err.message);
    // Don't fail the build
    process.exit(0);
  }
})();
