# 🎵 FxA Music Bot

A production-ready Discord music bot built with **discord.js v14**, **@discordjs/voice**, and **play-dl**. Supports YouTube, Spotify, playlists, interactive button controls, smart shuffle, autoplay, and multi-server operation.

---

## ✨ Features

| Feature | Details |
|---|---|
| `/play` | YouTube URL, song name search, or Spotify URL/playlist |
| `/search` | Interactive YouTube search with select menu |
| **Button Controls** | Pause, Resume, Skip, Stop, Loop, Shuffle, Autoplay, Volume |
| **Queue System** | Add, view, remove, clear songs |
| **Loop Modes** | Off / Track / Queue |
| **Smart Shuffle** | Fisher-Yates shuffle, no repeats |
| **Autoplay** | Auto-plays related songs when queue ends |
| **Multi-Server** | Independent queue per guild |
| **Auto-Disconnect** | Leaves when alone or queue ends (5 min timeout) |

---

## 📁 Project Structure

```
fxa-music-bot/
├── index.js                  # Bot entry point
├── register-commands.js      # Slash command registration script
├── ecosystem.config.js       # PM2 deployment config
├── package.json
├── .env.example              # Environment variable template
├── .gitignore
│
├── config/
│   └── config.js             # Central config (colors, timeouts, etc.)
│
├── commands/
│   ├── play.js               # /play — main playback command
│   ├── search.js             # /search — interactive song picker
│   ├── queue.js              # /queue — show queue
│   ├── nowplaying.js         # /nowplaying — current song info
│   ├── skip.js               # /skip
│   ├── pause.js              # /pause
│   ├── resume.js             # /resume
│   ├── stop.js               # /stop — stop + clear queue
│   ├── volume.js             # /volume <0-100>
│   ├── loop.js               # /loop <off|track|queue>
│   ├── shuffle.js            # /shuffle — toggle
│   ├── autoplay.js           # /autoplay — toggle
│   ├── remove.js             # /remove <position>
│   ├── clear.js              # /clear — clear upcoming songs
│   ├── disconnect.js         # /disconnect — leave voice channel
│   └── help.js               # /help — command list
│
├── events/
│   ├── ready.js              # Bot ready event
│   ├── interactionCreate.js  # Slash commands + button handler
│   └── voiceStateUpdate.js   # Auto-disconnect when alone
│
├── player/
│   ├── MusicQueue.js         # Core queue + audio player per guild
│   └── MusicManager.js       # Map of guildId → MusicQueue
│
└── utils/
    ├── helpers.js            # formatDuration, truncate, isUrl, etc.
    ├── songResolver.js       # Resolves YouTube / Spotify / search → Song[]
    └── embeds.js             # Reusable EmbedBuilder helpers
```

---

## ⚙️ Prerequisites

- **Node.js v18+** — [Download](https://nodejs.org)
- **FFmpeg** installed on your system
- A **Discord Bot** created at [Discord Developer Portal](https://discord.com/developers/applications)
- (Optional) **Spotify API** credentials for Spotify support

---

## 🚀 Local Setup

### 1. Clone / Download the project

```bash
git clone https://github.com/yourname/fxa-music-bot.git
cd fxa-music-bot
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in your values:

```env
DISCORD_TOKEN=your_discord_bot_token_here
CLIENT_ID=your_discord_application_client_id_here

# Optional — for Spotify support
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret

# Optional — for instant guild command registration during dev
GUILD_ID=your_test_guild_id

# Defaults (optional to change)
DEFAULT_VOLUME=50
MAX_QUEUE_SIZE=100
INACTIVITY_TIMEOUT=300000
```

### 4. Set up play-dl Spotify (optional but recommended)

Run this once to enable Spotify URL support:

```js
// run-once: setup-spotify.js
const play = require('play-dl');
play.setToken({
  spotify: {
    client_id: 'YOUR_SPOTIFY_CLIENT_ID',
    client_secret: 'YOUR_SPOTIFY_CLIENT_SECRET',
    refresh_token: '', // leave blank
    market: 'US',
  },
});
```

```bash
node setup-spotify.js
```

### 5. Register slash commands

```bash
npm run register
```

> If you added `GUILD_ID` to `.env`, commands appear **instantly** in that server.  
> Without `GUILD_ID`, global registration takes up to **1 hour**.

### 6. Start the bot

```bash
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

---

## 🤖 Discord Bot Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. **New Application** → give it a name
3. Go to **Bot** tab → **Add Bot**
4. Copy the **Token** → paste into `.env` as `DISCORD_TOKEN`
5. Copy the **Application ID** from General Information → paste as `CLIENT_ID`
6. Go to **OAuth2 → URL Generator**:
   - Scopes: `bot`, `applications.commands`
   - Bot Permissions: `Connect`, `Speak`, `Send Messages`, `Embed Links`, `Read Message History`, `Use Slash Commands`
7. Open the generated URL in your browser and invite the bot to your server

---

## 🖥 VPS Deployment (Ubuntu/Debian)

### 1. Install Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Install FFmpeg

```bash
sudo apt-get install -y ffmpeg
```

### 3. Install PM2 (process manager)

```bash
npm install -g pm2
```

### 4. Clone and set up the bot

```bash
git clone https://github.com/yourname/fxa-music-bot.git
cd fxa-music-bot
npm install
cp .env.example .env
nano .env   # fill in your tokens
npm run register
mkdir -p logs
```

### 5. Start with PM2

```bash
pm2 start ecosystem.config.js
```

### 6. Save and enable auto-start on reboot

```bash
pm2 save
pm2 startup
# Follow the instructions printed by pm2 startup
```

### Useful PM2 commands

```bash
pm2 status              # Check bot status
pm2 logs fxa-music-bot  # View live logs
pm2 restart fxa-music-bot
pm2 stop fxa-music-bot
pm2 delete fxa-music-bot
```

---

## 🎛 Commands Reference

| Command | Description |
|---|---|
| `/play <query>` | Play from YouTube URL, song name, or Spotify URL |
| `/search <query>` | Search YouTube and pick from top 5 results |
| `/queue [page]` | View the current song queue |
| `/nowplaying` | Show detailed now-playing card |
| `/skip` | Skip the current song |
| `/pause` | Pause playback |
| `/resume` | Resume playback |
| `/stop` | Stop and clear the entire queue |
| `/volume <0-100>` | Adjust playback volume |
| `/loop <off\|track\|queue>` | Set loop mode |
| `/shuffle` | Toggle smart shuffle |
| `/autoplay` | Toggle autoplay (plays related songs) |
| `/remove <position>` | Remove a song from the queue |
| `/clear` | Clear all upcoming songs |
| `/disconnect` | Disconnect from voice channel |
| `/help` | Show all commands |

---

## 🔘 Button Controls

The **Now Playing** embed includes three rows of interactive buttons:

**Row 1** — Core controls:  
⏸ Pause · ▶️ Resume · ⏭ Skip · ⏹ Stop

**Row 2** — Smart features:  
🔁 Loop (cycles Off→Track→Queue) · 🔀 Shuffle · ♾️ Autoplay · 📋 Queue

**Row 3** — Volume:  
🔉 Vol -10 · 🔊 Vol +10

---

## 🐛 Troubleshooting

| Problem | Solution |
|---|---|
| Bot doesn't respond to commands | Run `npm run register` and wait up to 1 hour (or use `GUILD_ID`) |
| No audio / silence | Ensure FFmpeg is installed: `ffmpeg -version` |
| Spotify links don't work | Set up play-dl Spotify credentials (see step 4 above) |
| `DISCORD_TOKEN is missing` | Check your `.env` file is in the project root |
| Bot disconnects immediately | Check bot has `Connect` + `Speak` permissions in the voice channel |
| High memory on VPS | PM2 auto-restarts at 500MB (`max_memory_restart` in ecosystem.config.js) |

---

## 📄 License

MIT — free to use, modify, and distribute.
