// commands/remove.js
// Remove a specific song from the queue by position

const { SlashCommandBuilder } = require('discord.js');
const Embeds = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remove')
    .setDescription('Remove a song from the queue by its position')
    .addIntegerOption((opt) =>
      opt
        .setName('position')
        .setDescription('Position in the queue (use /queue to see positions)')
        .setMinValue(1)
        .setRequired(true),
    ),

  async execute(interaction) {
    const queue = interaction.client.musicManager.getQueue(interaction.guild.id);
    if (!queue || !queue.getCurrentSong()) {
      return interaction.reply({ embeds: [Embeds.error('The queue is empty.')] });
    }

    const pos = interaction.options.getInteger('position');
    const upcoming = queue.getUpcomingSongs();

    // Position is 1-based within the upcoming list
    if (pos < 1 || pos > upcoming.length) {
      return interaction.reply({
        embeds: [Embeds.error(`Invalid position. There are **${upcoming.length}** upcoming songs.`)],
      });
    }

    // Convert to absolute index: currentIndex + pos
    const absoluteIndex = queue.currentIndex + pos;
    const removed = queue.removeSong(absoluteIndex + 1); // removeSong is 1-based from start

    if (!removed) {
      return interaction.reply({ embeds: [Embeds.error('Could not remove that song (it may be currently playing).')] });
    }

    return interaction.reply({ embeds: [Embeds.success(`Removed **${removed.title}** from the queue.`)] });
  },
};
