// register-commands.js
// Run this script ONCE to register (or update) slash commands with Discord.
// Usage: node register-commands.js
// To register to a specific guild only (instant): add GUILD_ID to .env

require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID; // Optional: for guild-specific (instant) registration

if (!token || !clientId) {
  console.error('❌ DISCORD_TOKEN and CLIENT_ID must be set in .env');
  process.exit(1);
}

// ── Collect all command data ───────────────────────────────────────────────
const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter((f) => f.endsWith('.js'));

for (const file of commandFiles) {
  const cmd = require(path.join(commandsPath, file));
  if (cmd.data) {
    commands.push(cmd.data.toJSON());
    console.log(`  + ${cmd.data.name}`);
  }
}

// ── Register with Discord REST API ─────────────────────────────────────────
const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log(`\n🔄 Registering ${commands.length} slash command(s)...`);

    let data;
    if (guildId) {
      // Guild-specific (appears instantly, great for testing)
      data = await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
        body: commands,
      });
      console.log(`✅ Successfully registered ${data.length} command(s) to guild ${guildId}.`);
    } else {
      // Global (takes up to 1 hour to propagate)
      data = await rest.put(Routes.applicationCommands(clientId), { body: commands });
      console.log(`✅ Successfully registered ${data.length} global command(s).`);
      console.log('⏳ Global commands may take up to 1 hour to appear in Discord.');
    }
  } catch (err) {
    console.error('❌ Failed to register commands:', err);
    process.exit(1);
  }
})();
