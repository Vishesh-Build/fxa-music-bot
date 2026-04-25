// commands/nowplaying.js
// Show detailed now-playing embed for the current song

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Embeds = require('../utils/embeds');
const config = require('../config/config');
const { truncate } = require('../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('Show the currently playing song'),

  async execute(interaction) {
    const queue = interaction.client.musicManager.getQueue(interaction.guild.id);
    if (!queue || !queue.getCurrentSong()) {
      return interaction.reply({ embeds: [Embeds.error('Nothing is currently playing.')] });
    }

    const song = queue.getCurrentSong();

    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setAuthor({ name: '🎵 Now Playing' })
      .setTitle(truncate(song.title, 256))
      .setURL(song.url)
      .setThumbnail(song.thumbnail || null)
      .addFields(
        { name: '⏱ Duration', value: song.duration || 'Unknown', inline: true },
        { name: '👤 Requested By', value: String(song.requestedBy), inline: true },
        { name: '🔁 Loop', value: queue.loopMode, inline: true },
        { name: '🔊 Volume', value: `${queue.volume}%`, inline: true },
        { name: '🔀 Shuffle', value: queue.isShuffled ? 'On' : 'Off', inline: true },
        { name: '♾️ Autoplay', value: queue.autoplay ? 'On' : 'Off', inline: true },
        { name: '📋 Queue', value: `${queue.songs.length} song(s) total`, inline: true },
        { name: '⏸ Status', value: queue.paused ? 'Paused' : 'Playing', inline: true },
      )
      .setFooter({ text: config.botName })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  },
};
