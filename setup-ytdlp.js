// setup-ytdlp.js
// Ek baar run karo — yt-dlp binary download ho jayega project mein
const YTDlpWrap = require('yt-dlp-wrap').default;
const path = require('path');

(async () => {
  console.log('⬇️  yt-dlp binary download ho raha hai...');
  try {
    const binaryPath = path.join(__dirname, 'yt-dlp.exe');
    await YTDlpWrap.downloadFromGithub(binaryPath);
    console.log('✅ yt-dlp ready hai!');
    console.log('Ab run karo: npm start');
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
})();
