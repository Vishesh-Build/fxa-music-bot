// utils/songResolver.js
const ytDlp = require('yt-dlp-exec');
const { formatDuration, isSpotifyUrl, isYouTubeUrl } = require('./helpers');
const play = require('play-dl');
const fs = require('fs');
const path = require('path');

const COOKIE_PATH = path.join(__dirname, '..', 'cookies.txt');

function getYtDlpOptions(extra = {}) {
  const opts = {
    noWarnings: true,
    noCheckCertificates: true,
    addHeader: [
      'referer:youtube.com',
      'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    ],
    ...extra,
  };
  if (fs.existsSync(COOKIE_PATH)) opts.cookies = COOKIE_PATH;
  return opts;
}

async function resolveSongs(query, requestedBy) {
  if (isSpotifyUrl(query)) return await resolveSpotify(query, requestedBy);
  if (isYouTubeUrl(query) && (query.includes('list=') || query.includes('playlist=')))
    return await resolveYouTubePlaylist(query, requestedBy);
  return await resolveSearch(query, requestedBy);
}

async function resolveSearch(query, requestedBy) {
  try {
    if (isYouTubeUrl(query)) {
      const info = await ytDlp(query, getYtDlpOptions({ dumpSingleJson: true, noPlaylist: true }));
      return [{
        title: info.title || query,
        url: info.webpage_url || query,
        duration: formatDuration(info.duration || 0),
        thumbnail: info.thumbnail || '',
        requestedBy,
      }];
    }

    // Text search
    const info = await ytDlp(`ytsearch5:${query}`, getYtDlpOptions({
      dumpSingleJson: true,
      flatPlaylist: true,
    }));

    const entries = info.entries || [];
    const video = entries.find(e => e.id && e.title) || entries[0];
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
    const info = await ytDlp(url, getYtDlpOptions({ dumpSingleJson: true, flatPlaylist: true }));
    const videos = (Array.isArray(info.entries) ? info.entries : [info]).slice(0, 100);
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