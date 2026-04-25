// commands/disconnect.js
// Disconnect the bot from the voice channel and clean up

const { SlashCommandBuilder } = require('discord.js');
const Embeds = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('disconnect')
    .setDescription('Disconnect the bot from the voice channel'),

  async execute(interaction) {
    const queue = interaction.client.musicManager.getQueue(interaction.guild.id);
    if (!queue) {
      return interaction.reply({ embeds: [Embeds.error('I am not in a voice channel.')] });
    }

    interaction.client.musicManager.removeQueue(interaction.guild.id);
    return interaction.reply({ embeds: [Embeds.success('Disconnected from the voice channel.')] });
  },
};
