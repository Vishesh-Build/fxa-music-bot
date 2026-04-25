// commands/skip.js
const { SlashCommandBuilder } = require('discord.js');
const Embeds = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skip the current song'),

  async execute(interaction) {
    const queue = interaction.client.musicManager.getQueue(interaction.guild.id);
    if (!queue) return interaction.reply({ embeds: [Embeds.error('Nothing is playing.')] });
    if (!interaction.member.voice?.channel) return interaction.reply({ embeds: [Embeds.error('Join a voice channel first.')] });

    const song = queue.getCurrentSong();
    await queue.skip();
    return interaction.reply({ embeds: [Embeds.success(`Skipped **${song?.title || 'current song'}**.`)] });
  },
};
