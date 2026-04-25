// commands/queue.js
// /queue command — display the current song queue

const { SlashCommandBuilder } = require('discord.js');
const Embeds = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Show the current song queue')
    .addIntegerOption((opt) =>
      opt.setName('page').setDescription('Page number').setMinValue(1).setRequired(false),
    ),

  async execute(interaction) {
    const queue = interaction.client.musicManager.getQueue(interaction.guild.id);

    if (!queue || !queue.getCurrentSong()) {
      return interaction.reply({ embeds: [Embeds.info('The queue is empty.')] });
    }

    const page = interaction.options.getInteger('page') || 1;
    return interaction.reply({ embeds: [Embeds.queueList(queue, page)] });
  },
};
