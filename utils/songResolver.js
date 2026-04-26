// utils/songResolver.js

const ytDlp = require('yt-dlp-exec');
const { formatDuration, isSpotifyUrl, isYouTubeUrl } = require('./helpers');
const play = require('play-dl');
const fs = require('fs');
const path = require('path');

// ── YouTube cookies setup ──────────────────────────────────────────────────
const COOKIE_PATH = path.join('/tmp', 'yt-cookies.txt');

function setupCookies() {
  const cookie = process.env.YT_COOKIE;
  if (!cookie) return null;

  // Convert "NAME=value; NAME2=value2" format to Netscape cookie file
  const lines = ['# Netscape HTTP Cookie File'];
  cookie.split(';').forEach(pair => {
    const [name, ...rest] = pair.trim().split('=');
    if (name && rest.length) {
      lines.push(`.youtube.com\tTRUE\t/\tFALSE\t2099999999\t${name.trim()}\t${rest.join('=').trim()}`);
    }
  });

  fs.writeFileSync(COOKIE_PATH, lines.join('\n'));
  return COOKIE_PATH;
}

const cookiePath = setupCookies();

function getYtDlpOptions(extra = {}) {
  const opts = {
    noWarnings: true,
    noCallHome: true,
    noCheckCertificates: true,
    preferFreeFormats: true,
    ...extra,
  };
  if (cookiePath && fs.existsSync(cookiePath)) {
    opts.cookies = cookiePath;
  }
  return opts;
}

// ── Main resolver ──────────────────────────────────────────────────────────

async function resolveSongs(query, requestedBy) {
  if (isSpotifyUrl(query)) return await resolveSpotify(query, requestedBy);
  if (isYouTubeUrl(query) && (query.includes('list=') || query.includes('playlist=')))
    return await resolveYouTubePlaylist(query, requestedBy);
  return await resolveSearch(query, requestedBy);
}

async function resolveSearch(query, requestedBy) {
  try {
    const isUrl = isYouTubeUrl(query);
    const target = isUrl ? query : `ytsearch1:${query}`;

    const info = await ytDlp(target, getYtDlpOptions({
      dumpSingleJson: true,
      noPlaylist: true,
    }));

    const video = info;

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
    const info = await ytDlp(url, getYtDlpOptions({
      dumpSingleJson: true,
      flatPlaylist: true,
    }));
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