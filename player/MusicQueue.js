// player/MusicQueue.js
// yt-dlp-wrap based streaming — no PATH needed

const {
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
  joinVoiceChannel,
  StreamType,
} = require('@discordjs/voice');
const ytDlp = require('yt-dlp-exec');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const ffmpegPath = require('ffmpeg-static');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config/config');
const { truncate, formatDuration } = require('../utils/helpers');
const { resolveLazySong } = require('../utils/songResolver');

const COOKIE_PATH = path.join('/tmp', 'yt-cookies.txt');

class MusicQueue {
  constructor(guild, textChannel, voiceChannel) {
    this.guild = guild;
    this.textChannel = textChannel;
    this.voiceChannel = voiceChannel;

    this.songs = [];
    this.currentIndex = 0;
    this.volume = config.defaultVolume;
    this.loopMode = config.loopModes.OFF;
    this.isShuffled = false;
    this.autoplay = false;
    this.playing = false;
    this.paused = false;
    this._advancing = false;

    this.connection = null;
    this.audioPlayer = null;
    this.resource = null;
    this.nowPlayingMessage = null;
    this.inactivityTimer = null;
    this.shuffleHistory = new Set();
    this._aloneTimer = null;
  }

  // ─── Connection ────────────────────────────────────────────────────────────

  async connect() {
    this.connection = joinVoiceChannel({
      channelId: this.voiceChannel.id,
      guildId: this.guild.id,
      adapterCreator: this.guild.voiceAdapterCreator,
      selfDeaf: true,
    });

    try {
      await entersState(this.connection, VoiceConnectionStatus.Ready, 30_000);
    } catch {
      this.connection.destroy();
      throw new Error('Voice channel join nahi hua.');
    }

    this.connection.on(VoiceConnectionStatus.Disconnected, async () => {
      try {
        await Promise.race([
          entersState(this.connection, VoiceConnectionStatus.Signalling, 5_000),
          entersState(this.connection, VoiceConnectionStatus.Connecting, 5_000),
        ]);
      } catch { this.destroy(); }
    });

    this._setupPlayer();
  }

  _setupPlayer() {
    this.audioPlayer = createAudioPlayer();
    this.connection.subscribe(this.audioPlayer);

    this.audioPlayer.on(AudioPlayerStatus.Idle, () => {
      if (this._advancing) return;
      this._onSongEnd();
    });

    this.audioPlayer.on('error', (err) => {
      console.error(`[AudioPlayer Error] ${err.message}`);
      this.textChannel.send({ embeds: [this._errorEmbed(`Audio error. Skipping...`)] });
      this._advanceQueue();
    });
  }

  // ─── Streaming ─────────────────────────────────────────────────────────────

  async _createStream(url) {
    // Build yt-dlp options with cookies
    const ytOpts = {
      getUrl: true,
      format: 'bestaudio/best',
      noPlaylist: true,
      noWarnings: true,
      noCallHome: true,
      noCheckCertificates: true,
    };
    if (fs.existsSync(COOKIE_PATH)) ytOpts.cookies = COOKIE_PATH;

    const info = await ytDlp(url, ytOpts);
    const directUrl = info.trim().split('\n')[0];

    // Stream via ffmpeg
    const ffmpeg = spawn(ffmpegPath, [
      '-reconnect', '1',
      '-reconnect_streamed', '1',
      '-reconnect_delay_max', '5',
      '-i', directUrl,
      '-analyzeduration', '0',
      '-loglevel', '0',
      '-f', 's16le',
      '-ar', '48000',
      '-ac', '2',
      'pipe:1',
    ], { stdio: ['ignore', 'pipe', 'ignore'] });

    return createAudioResource(ffmpeg.stdout, {
      inputType: StreamType.Raw,
      inlineVolume: true,
    });
  }

  // ─── Playback ──────────────────────────────────────────────────────────────

  async play() {
    let song = this.getCurrentSong();
    if (!song) { this._startInactivityTimer(); return; }

    try {
      if (song.isLazy) {
        song = await resolveLazySong(song);
        this.songs[this.currentIndex] = song;
      }

      this.resource = await this._createStream(song.url);
      this.resource.volume.setVolumeLogarithmic(this.volume / 100);
      this.audioPlayer.play(this.resource);
      this.playing = true;
      this.paused = false;
      this._advancing = false;

      this._clearInactivityTimer();
      await this._sendNowPlaying(song);
    } catch (err) {
      console.error(`[Play Error] ${err.message}`);
      this.textChannel.send({
        embeds: [this._errorEmbed(`**${song.title}** play nahi hua. Skipping...`)],
      });
      this._advanceQueue();
    }
  }

  async _onSongEnd() {
    if (this.loopMode === config.loopModes.TRACK) { await this.play(); return; }
    if (this.loopMode === config.loopModes.QUEUE) {
      this.currentIndex = (this.currentIndex + 1) % this.songs.length;
      await this.play(); return;
    }
    this.currentIndex++;
    if (this.currentIndex < this.songs.length) {
      await this.play();
    } else if (this.autoplay) {
      await this._autoplayNext();
    } else {
      this.playing = false;
      this.textChannel.send({ embeds: [this._infoEmbed('Queue khatam! `/play` se aur songs add karo.')] });
      this._startInactivityTimer();
    }
  }

  async _advanceQueue() {
    if (this._advancing) return;
    this._advancing = true;
    this.currentIndex++;
    if (this.currentIndex < this.songs.length) {
      await this.play();
    } else if (this.autoplay) {
      await this._autoplayNext();
    } else {
      this.playing = false;
      this.songs = [];
      this.currentIndex = 0;
      this._advancing = false;
      this._startInactivityTimer();
    }
  }

  // ─── Controls ──────────────────────────────────────────────────────────────

  pause() {
    if (this.audioPlayer && !this.paused) { this.audioPlayer.pause(); this.paused = true; return true; }
    return false;
  }

  resume() {
    if (this.audioPlayer && this.paused) { this.audioPlayer.unpause(); this.paused = false; return true; }
    return false;
  }

  async skip() {
    if (!this.audioPlayer) return false;
    this._advancing = true;
    this.audioPlayer.stop(true);
    await this._advanceQueue();
    return true;
  }

  stop() {
    this.songs = []; this.currentIndex = 0;
    this.playing = false; this.paused = false; this._advancing = false;
    if (this.audioPlayer) this.audioPlayer.stop(true);
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(100, vol));
    if (this.resource?.volume) this.resource.volume.setVolumeLogarithmic(this.volume / 100);
  }

  setLoop(mode) {
    if (Object.values(config.loopModes).includes(mode)) { this.loopMode = mode; return true; }
    return false;
  }

  toggleShuffle() {
    this.isShuffled = !this.isShuffled;
    if (this.isShuffled) this._shuffleQueue();
    return this.isShuffled;
  }

  toggleAutoplay() { this.autoplay = !this.autoplay; return this.autoplay; }

  _shuffleQueue() {
    const rest = this.songs.slice(this.currentIndex + 1);
    for (let i = rest.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rest[i], rest[j]] = [rest[j], rest[i]];
    }
    this.songs = [...this.songs.slice(0, this.currentIndex + 1), ...rest];
  }

  addSong(song) {
    if (this.songs.length >= config.maxQueueSize) throw new Error(`Queue full (max ${config.maxQueueSize}).`);
    this.songs.push(song);
  }

  removeSong(index) {
    const i = index - 1;
    if (i < 0 || i >= this.songs.length || i === this.currentIndex) return null;
    if (i < this.currentIndex) this.currentIndex--;
    return this.songs.splice(i, 1)[0];
  }

  clearQueue() {
    const current = this.songs[this.currentIndex];
    this.songs = current ? [current] : []; this.currentIndex = 0;
  }

  getCurrentSong() { return this.songs[this.currentIndex] || null; }
  getUpcomingSongs() { return this.songs.slice(this.currentIndex + 1); }

  async _autoplayNext() {
    try {
      const last = this.songs[this.songs.length - 1];
      if (!last) return;
      const { resolveSongs } = require('../utils/songResolver');
      const results = await resolveSongs(`${last.title} official audio`, 'Autoplay');
      if (!results.length) { this.playing = false; return; }
      this.addSong({ ...results[0], requestedBy: 'Autoplay', isAutoplay: true });
      await this.play();
    } catch (err) {
      console.error('[Autoplay Error]', err.message);
      this.playing = false;
    }
  }

  async _sendNowPlaying(song) {
    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setAuthor({ name: '🎵 Now Playing' })
      .setTitle(truncate(song.title, 256))
      .setURL(song.url)
      .setThumbnail(song.thumbnail || null)
      .addFields(
        { name: '⏱ Duration', value: song.duration || 'Unknown', inline: true },
        { name: '👤 Requested By', value: String(song.requestedBy), inline: true },
        { name: '🔁 Loop', value: this._loopLabel(), inline: true },
        { name: '📋 Queue', value: `${this.songs.length} song(s)`, inline: true },
        { name: '🔊 Volume', value: `${this.volume}%`, inline: true },
        { name: '🔀 Shuffle', value: this.isShuffled ? 'On' : 'Off', inline: true },
      )
      .setFooter({ text: config.botName }).setTimestamp();

    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('music_pause').setLabel('⏸ Pause').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('music_resume').setLabel('▶️ Resume').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('music_skip').setLabel('⏭ Skip').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('music_stop').setLabel('⏹ Stop').setStyle(ButtonStyle.Danger),
    );
    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('music_loop').setLabel(`🔁 Loop: ${this._loopLabel()}`).setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('music_shuffle').setLabel(this.isShuffled ? '🔀 On' : '🔀 Off').setStyle(this.isShuffled ? ButtonStyle.Success : ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('music_autoplay').setLabel(this.autoplay ? '♾️ On' : '♾️ Off').setStyle(this.autoplay ? ButtonStyle.Success : ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('music_queue').setLabel('📋 Queue').setStyle(ButtonStyle.Secondary),
    );
    const row3 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('music_vol_down').setLabel('🔉 -10').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('music_vol_up').setLabel('🔊 +10').setStyle(ButtonStyle.Secondary),
    );

    if (this.nowPlayingMessage) { try { await this.nowPlayingMessage.delete(); } catch { } }
    this.nowPlayingMessage = await this.textChannel.send({ embeds: [embed], components: [row1, row2, row3] });
  }

  _loopLabel() {
    if (this.loopMode === config.loopModes.TRACK) return 'Track';
    if (this.loopMode === config.loopModes.QUEUE) return 'Queue';
    return 'Off';
  }

  _errorEmbed(msg) { return new EmbedBuilder().setColor(config.colors.error).setDescription(`❌ ${msg}`); }
  _infoEmbed(msg) { return new EmbedBuilder().setColor(config.colors.info).setDescription(`ℹ️ ${msg}`); }

  _startInactivityTimer() {
    this._clearInactivityTimer();
    this.inactivityTimer = setTimeout(() => {
      this.textChannel.send({ embeds: [this._infoEmbed('Inactivity ke wajah se disconnect.')] });
      this.destroy();
    }, config.inactivityTimeout);
  }

  _clearInactivityTimer() {
    if (this.inactivityTimer) { clearTimeout(this.inactivityTimer); this.inactivityTimer = null; }
  }

  destroy() {
    this._clearInactivityTimer();
    if (this._aloneTimer) { clearTimeout(this._aloneTimer); this._aloneTimer = null; }
    if (this.nowPlayingMessage) { try { this.nowPlayingMessage.delete(); } catch { } }
    if (this.audioPlayer) this.audioPlayer.stop(true);
    if (this.connection && this.connection.state.status !== 'destroyed') {
      try { this.connection.destroy(); } catch { }
    }
    this.guild.client.musicManager?.delete(this.guild.id);
  }
}

module.exports = MusicQueue;