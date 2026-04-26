// install-yt-dlp.js
const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');

// Windows pe skip
if (process.platform === 'win32') {
  console.log('Windows - skipping.');
  process.exit(0);
}

const BIN_PATH = path.join(__dirname, 'yt-dlp-bin');

// Already downloaded?
if (fs.existsSync(BIN_PATH)) {
  console.log('yt-dlp-bin already exists!');
  process.exit(0);
}

console.log('Downloading yt-dlp binary...');

function download(url, destPath, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    if (redirectCount > 10) return reject(new Error('Too many redirects'));
    const https_ = require('https');
    https_.get(url, { headers: { 'User-Agent': 'node.js' } }, (res) => {
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
    // Download yt-dlp binary (no python needed - standalone binary)
    await download(
      'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux',
      BIN_PATH
    );
    fs.chmodSync(BIN_PATH, '755');
    console.log('yt-dlp_linux downloaded successfully at:', BIN_PATH);
    
    // Test it
    const result = spawnSync(BIN_PATH, ['--version']);
    if (result.stdout) {
      console.log('yt-dlp version:', result.stdout.toString().trim());
    }
  } catch (err) {
    console.error('Failed:', err.message);
    process.exit(0);
  }
})();
