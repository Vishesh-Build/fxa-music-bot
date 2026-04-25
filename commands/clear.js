// commands/clear.js
// Clear all upcoming songs from the queue (keeps current song playing)

const { SlashCommandBuilder } = require('discord.js');
const Embeds = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Clear all upcoming songs from the queue'),

  async execute(interaction) {
    const queue = interaction.client.musicManager.getQueue(interaction.guild.id);
    if (!queue || !queue.getCurrentSong()) {
      return interaction.reply({ embeds: [Embeds.error('The queue is empty.')] });
    }

    const count = queue.getUpcomingSongs().length;
    queue.clearQueue();
    return interaction.reply({
      embeds: [Embeds.success(`Cleared **${count}** song(s) from the queue.`)],
    });
  },
};
