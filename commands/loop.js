// commands/loop.js
const { SlashCommandBuilder } = require('discord.js');
const Embeds = require('../utils/embeds');
const config = require('../config/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('loop')
    .setDescription('Set loop mode')
    .addStringOption((opt) =>
      opt
        .setName('mode')
        .setDescription('Loop mode')
        .setRequired(true)
        .addChoices(
          { name: 'Off', value: 'off' },
          { name: 'Track (repeat current song)', value: 'track' },
          { name: 'Queue (repeat all songs)', value: 'queue' },
        ),
    ),

  async execute(interaction) {
    const queue = interaction.client.musicManager.getQueue(interaction.guild.id);
    if (!queue) return interaction.reply({ embeds: [Embeds.error('Nothing is playing.')] });

    const mode = interaction.options.getString('mode');
    queue.setLoop(mode);

    const labels = { off: 'Off', track: 'Track 🔂', queue: 'Queue 🔁' };
    return interaction.reply({ embeds: [Embeds.success(`Loop mode set to **${labels[mode]}**.`)] });
  },
};
