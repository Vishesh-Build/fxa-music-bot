// utils/songResolver.js
const { execFile } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs');
const { formatDuration, isSpotifyUrl, isYouTubeUrl } = require('./helpers');
const play = require('play-dl');

const execFileAsync = promisify(execFile);
const COOKIE_PATH = path.join(__dirname, '..', 'cookies.txt');

function getYtDlpBin() {
  const winBin = path.join(__dirname, '..', 'yt-dlp.exe');
  if (process.platform === 'win32' && fs.existsSync(winBin)) return winBin;
  // Downloaded binary (Railway)
  const localBin = path.join(__dirname, '..', 'yt-dlp-bin');
  if (fs.existsSync(localBin)) return localBin;
  return 'yt-dlp';
}

function getBaseArgs() {
  const args = ['--no-warnings', '--no-check-certificates'];
  if (fs.existsSync(COOKIE_PATH)) args.push('--cookies', COOKIE_PATH);
  return args;
}

async function resolveSongs(query, requestedBy) {
  if (isSpotifyUrl(query)) return await resolveSpotify(query, requestedBy);
  if (isYouTubeUrl(query) && (query.includes('list=') || query.includes('playlist=')))
    return await resolveYouTubePlaylist(query, requestedBy);
  return await resolveSearch(query, requestedBy);
}

async function resolveSearch(query, requestedBy) {
  try {
    const bin = getYtDlpBin();
    const target = isYouTubeUrl(query) ? query : `ytsearch1:${query}`;
    const args = [...getBaseArgs(), '--dump-single-json', '--no-playlist', target];

    const { stdout } = await execFileAsync(bin, args, { timeout: 15000 });
    const info = JSON.parse(stdout.trim());
    const video = info.entries ? info.entries[0] : info;
    if (!video) throw new Error('No results');

    return [{
      title: video.title || query,
      url: video.webpage_url || `https://www.youtube.com/watch?v=${video.id}`,
      duration: formatDuration(video.duration || 0),
      thumbnail: video.thumbnail || '',
      requestedBy,
    }];
  } catch (err) {
    console.error('[Search Error]', err.message);
    throw new Error(`Koi result nahi mila: **${query}**`);
  }
}

async function resolveYouTubePlaylist(url, requestedBy) {
  try {
    const bin = getYtDlpBin();
    const args = [...getBaseArgs(), '--dump-single-json', '--flat-playlist', url];
    const { stdout } = await execFileAsync(bin, args, { timeout: 30000 });
    const info = JSON.parse(stdout.trim());
    const videos = (info.entries || []).slice(0, 100);
    return videos.map(v => ({
      title: v.title || 'Unknown',
      url: v.webpage_url || `https://www.youtube.com/watch?v=${v.id}`,
      duration: formatDuration(v.duration || 0),
      thumbnail: v.thumbnail || '',
      requestedBy,
    }));
  } catch (err) {
    throw new Error('Playlist load nahi hua.');
  }
}

async function resolveSpotify(url, requestedBy) {
  try {
    const spData = await play.spotify(url);
    if (spData.type === 'track') {
      return await resolveSearch(`${spData.name} ${spData.artists.map(a => a.name).join(' ')}`, requestedBy);
    }
    if (spData.type === 'album' || spData.type === 'playlist') {
      return spData.tracks.items.slice(0, 50).map(item => {
        const track = item.track || item;
        const artists = (track.artists || []).map(a => a.name).join(' ');
        return {
          title: `${track.name} — ${artists}`,
          url: '',
          duration: formatDuration(Math.floor((track.duration_ms || 0) / 1000)),
          thumbnail: track.album?.images?.[0]?.url || '',
          requestedBy,
          isLazy: true,
          searchQuery: `${track.name} ${artists}`,
        };
      });
    }
  } catch (err) {
    throw new Error('Spotify URL resolve nahi hua.');
  }
  return [];
}

async function resolveLazySong(song) {
  if (!song.isLazy) return song;
  const resolved = await resolveSearch(song.searchQuery, song.requestedBy);
  return { ...resolved[0], requestedBy: song.requestedBy };
}

module.exports = { resolveSongs, resolveLazySong };