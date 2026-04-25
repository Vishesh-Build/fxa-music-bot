// utils/helpers.js
// Shared utility functions

/**
 * Format seconds into HH:MM:SS or MM:SS string.
 * @param {number} seconds
 * @returns {string}
 */
function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return 'Live';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Truncate a string to max length, appending '…' if needed.
 * @param {string} str
 * @param {number} max
 * @returns {string}
 */
function truncate(str, max = 100) {
  if (!str) return '';
  return str.length > max ? str.slice(0, max - 1) + '…' : str;
}

/**
 * Check if a string is a valid URL.
 * @param {string} str
 * @returns {boolean}
 */
function isUrl(str) {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a URL is a Spotify URL.
 * @param {string} url
 * @returns {boolean}
 */
function isSpotifyUrl(url) {
  return url.includes('open.spotify.com');
}

/**
 * Check if a URL is a YouTube URL.
 * @param {string} url
 * @returns {boolean}
 */
function isYouTubeUrl(url) {
  return url.includes('youtube.com') || url.includes('youtu.be');
}

/**
 * Build a progress bar string.
 * @param {number} current - current seconds
 * @param {number} total - total seconds
 * @param {number} [size=20] - bar length
 * @returns {string}
 */
function progressBar(current, total, size = 20) {
  if (!total || total === 0) return '─'.repeat(size);
  const progress = Math.round((current / total) * size);
  return '▬'.repeat(progress) + '🔘' + '─'.repeat(size - progress);
}

module.exports = { formatDuration, truncate, isUrl, isSpotifyUrl, isYouTubeUrl, progressBar };
