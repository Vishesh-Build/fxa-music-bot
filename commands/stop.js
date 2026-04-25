// commands/stop.js
const { SlashCommandBuilder } = require('discord.js');
const Embeds = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stop music and clear the queue'),

  async execute(interaction) {
    const queue = interaction.client.musicManager.getQueue(interaction.guild.id);
    if (!queue) return interaction.reply({ embeds: [Embeds.error('Nothing is playing.')] });

    queue.stop();
    interaction.client.musicManager.removeQueue(interaction.guild.id);
    return interaction.reply({ embeds: [Embeds.success('Stopped playback and cleared the queue.')] });
  },
};
