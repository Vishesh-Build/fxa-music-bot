// commands/pause.js
const { SlashCommandBuilder } = require('discord.js');
const Embeds = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder().setName('pause').setDescription('Pause the current song'),

  async execute(interaction) {
    const queue = interaction.client.musicManager.getQueue(interaction.guild.id);
    if (!queue) return interaction.reply({ embeds: [Embeds.error('Nothing is playing.')] });
    const ok = queue.pause();
    return interaction.reply({ embeds: [ok ? Embeds.success('Paused.') : Embeds.warning('Already paused.')] });
  },
};
