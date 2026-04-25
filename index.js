// index.js
// FxA Music Bot — Entry point
// Bootstraps the Discord client, loads commands, registers events, and starts the bot.

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const MusicManager = require('./player/MusicManager');
const config = require('./config/config');

// ── Validate required environment variables ────────────────────────────────
if (!config.token) {
  console.error('❌ DISCORD_TOKEN is missing from your .env file!');
  process.exit(1);
}
if (!config.clientId) {
  console.error('❌ CLIENT_ID is missing from your .env file!');
  process.exit(1);
}

// ── Create Discord client ──────────────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// ── Attach music manager to client ────────────────────────────────────────
client.musicManager = new MusicManager();

// ── Load slash commands ────────────────────────────────────────────────────
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter((f) => f.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  if (!command.data || !command.execute) {
    console.warn(`⚠️  Skipping commands/${file} — missing data or execute.`);
    continue;
  }
  client.commands.set(command.data.name, command);
  console.log(`  ✔ Loaded command: /${command.data.name}`);
}

// ── Load events ────────────────────────────────────────────────────────────
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter((f) => f.endsWith('.js'));

for (const file of eventFiles) {
  const event = require(path.join(eventsPath, file));
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
  console.log(`  ✔ Registered event: ${event.name}`);
}

// ── Global error handlers ──────────────────────────────────────────────────
process.on('unhandledRejection', (err) => {
  console.error('[Unhandled Rejection]', err);
});

process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception]', err);
});

// ── Login ──────────────────────────────────────────────────────────────────
client.login(config.token);
const http = require('http');
http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Bot is alive!');
}).listen(3000);
