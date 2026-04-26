// install-yt-dlp.js
const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Windows pe skip karo
if (process.platform === 'win32') {
  console.log('Windows - skipping yt-dlp download.');
  process.exit(0);
}

// System mein already hai?
try {
  execSync('yt-dlp --version', { stdio: 'ignore' });
  console.log('yt-dlp already installed!');
  process.exit(0);
} catch {}

// Project root mein download karo
const BIN_PATH = path.join(__dirname, 'yt-dlp-bin');
console.log('Downloading yt-dlp to:', BIN_PATH);

function download(url, destPath, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    if (redirectCount > 5) return reject(new Error('Too many redirects'));
    https.get(url, { headers: { 'User-Agent': 'node.js' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return resolve(download(res.headers.location, destPath, redirectCount + 1));
      }
      if (res.statusCode !== 200) return reject(new Error('HTTP ' + res.statusCode));
      const file = fs.createWriteStream(destPath);
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
      file.on('error', reject);
    }).on('error', reject);
  });
}

(async () => {
  try {
    await download('https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp', BIN_PATH);
    fs.chmodSync(BIN_PATH, '755');
    console.log('yt-dlp downloaded successfully!');
  } catch (err) {
    console.error('Failed to download yt-dlp:', err.message);
    process.exit(0); // Don't fail the build
  }
})();
