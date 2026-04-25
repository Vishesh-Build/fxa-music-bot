// commands/resume.js
const { SlashCommandBuilder } = require('discord.js');
const Embeds = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder().setName('resume').setDescription('Resume the paused song'),

  async execute(interaction) {
    const queue = interaction.client.musicManager.getQueue(interaction.guild.id);
    if (!queue) return interaction.reply({ embeds: [Embeds.error('Nothing is playing.')] });
    const ok = queue.resume();
    return interaction.reply({ embeds: [ok ? Embeds.success('Resumed.') : Embeds.warning('Not paused.')] });
  },
};
