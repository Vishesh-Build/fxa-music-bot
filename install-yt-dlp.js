// install-yt-dlp.js
const https = require('https');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

// Windows pe skip
if (process.platform === 'win32') {
  console.log('Windows - skipping.');
  process.exit(0);
}

const BIN_PATH = path.join(__dirname, 'yt-dlp-bin');
const COOKIE_PATH = path.join(__dirname, 'cookies.txt');

// YT_COOKIE env se cookies.txt banao
if (process.env.YT_COOKIE && !fs.existsSync(COOKIE_PATH)) {
  console.log('Creating cookies.txt from YT_COOKIE env...');
  const cookieStr = process.env.YT_COOKIE;
  // Netscape cookie format
  let cookieTxt = '# Netscape HTTP Cookie File\n';
  cookieStr.split(';').forEach(pair => {
    const [name, ...rest] = pair.trim().split('=');
    const value = rest.join('=');
    if (name && value) {
      cookieTxt += `.youtube.com\tTRUE\t/\tFALSE\t9999999999\t${name.trim()}\t${value.trim()}\n`;
    }
  });
  fs.writeFileSync(COOKIE_PATH, cookieTxt);
  console.log('cookies.txt created!');
}

// Already downloaded?
if (fs.existsSync(BIN_PATH)) {
  console.log('yt-dlp-bin already exists!');
  process.exit(0);
}

console.log('Downloading yt-dlp_linux standalone binary...');

function download(url, destPath, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    if (redirectCount > 10) return reject(new Error('Too many redirects'));
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
    await download(
      'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux',
      BIN_PATH
    );
    fs.chmodSync(BIN_PATH, '755');
    console.log('yt-dlp_linux downloaded!');
    const result = spawnSync(BIN_PATH, ['--version']);
    if (result.stdout) console.log('Version:', result.stdout.toString().trim());
  } catch (err) {
    console.error('Failed:', err.message);
    process.exit(0);
  }
})();