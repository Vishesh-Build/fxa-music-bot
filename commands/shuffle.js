// commands/shuffle.js
const { SlashCommandBuilder } = require('discord.js');
const Embeds = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder().setName('shuffle').setDescription('Toggle shuffle mode'),

  async execute(interaction) {
    const queue = interaction.client.musicManager.getQueue(interaction.guild.id);
    if (!queue) return interaction.reply({ embeds: [Embeds.error('Nothing is playing.')] });

    const on = queue.toggleShuffle();
    return interaction.reply({ embeds: [Embeds.success(`Shuffle **${on ? 'enabled' : 'disabled'}**.`)] });
  },
};
