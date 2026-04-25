// commands/volume.js
const { SlashCommandBuilder } = require('discord.js');
const Embeds = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Set the playback volume (0-100)')
    .addIntegerOption((opt) =>
      opt.setName('level').setDescription('Volume level (0-100)').setMinValue(0).setMaxValue(100).setRequired(true),
    ),

  async execute(interaction) {
    const queue = interaction.client.musicManager.getQueue(interaction.guild.id);
    if (!queue) return interaction.reply({ embeds: [Embeds.error('Nothing is playing.')] });

    const level = interaction.options.getInteger('level');
    queue.setVolume(level);
    return interaction.reply({ embeds: [Embeds.success(`Volume set to **${level}%**.`)] });
  },
};
