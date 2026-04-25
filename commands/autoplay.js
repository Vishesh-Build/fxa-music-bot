// commands/autoplay.js
const { SlashCommandBuilder } = require('discord.js');
const Embeds = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder().setName('autoplay').setDescription('Toggle autoplay mode (plays related songs when queue ends)'),

  async execute(interaction) {
    const queue = interaction.client.musicManager.getQueue(interaction.guild.id);
    if (!queue) return interaction.reply({ embeds: [Embeds.error('Nothing is playing.')] });

    const on = queue.toggleAutoplay();
    return interaction.reply({ embeds: [Embeds.success(`Autoplay **${on ? 'enabled' : 'disabled'}**.`)] });
  },
};
