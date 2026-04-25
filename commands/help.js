// commands/help.js
// Show all available commands

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show all FxA Music Bot commands'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle(`${config.botEmoji} ${config.botName} — Commands`)
      .setDescription('A feature-rich Discord music bot. Use the buttons on the Now Playing embed for quick controls!')
      .addFields(
        {
          name: '🎵 Playback',
          value: [
            '`/play <query>` — Play a song (YouTube URL, name, or Spotify URL)',
            '`/search <query>` — Search YouTube and pick a result',
            '`/pause` — Pause playback',
            '`/resume` — Resume playback',
            '`/skip` — Skip the current song',
            '`/stop` — Stop and clear the queue',
            '`/disconnect` — Disconnect from voice channel',
          ].join('\n'),
        },
        {
          name: '📋 Queue',
          value: [
            '`/queue [page]` — Show the current queue',
            '`/nowplaying` — Show current song info',
            '`/remove <position>` — Remove a song from the queue',
            '`/clear` — Clear all upcoming songs',
          ].join('\n'),
        },
        {
          name: '⚙️ Settings',
          value: [
            '`/volume <0-100>` — Set playback volume',
            '`/loop <off|track|queue>` — Set loop mode',
            '`/shuffle` — Toggle shuffle mode',
            '`/autoplay` — Toggle autoplay (plays related songs)',
          ].join('\n'),
        },
        {
          name: '🎛 Button Controls',
          value: 'The **Now Playing** embed has interactive buttons:\n⏸ Pause • ▶️ Resume • ⏭ Skip • ⏹ Stop\n🔁 Loop • 🔀 Shuffle • ♾️ Autoplay • 📋 Queue\n🔉 Vol -10 • 🔊 Vol +10',
        },
      )
      .setFooter({ text: `${config.botName} • Supports YouTube & Spotify` })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  },
};
