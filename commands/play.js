// commands/play.js
const { SlashCommandBuilder } = require('discord.js');
const { resolveSongs } = require('../utils/songResolver');
const Embeds = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song or add it to the queue')
    .addStringOption((opt) =>
      opt.setName('query').setDescription('Song name, YouTube URL, or Spotify URL').setRequired(true),
    ),

  async execute(interaction) {
    // Defer karo sabse pehle — ek baar hi
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferReply();
    }

    const query = interaction.options.getString('query');
    const voiceChannel = interaction.member.voice?.channel;

    if (!voiceChannel) {
      return interaction.editReply({ embeds: [Embeds.error('Pehle voice channel join karo!')] });
    }

    const permissions = voiceChannel.permissionsFor(interaction.guild.members.me);
    if (!permissions.has('Connect') || !permissions.has('Speak')) {
      return interaction.editReply({ embeds: [Embeds.error('Mujhe Connect aur Speak permission chahiye.')] });
    }

    // Resolve songs
    let songs;
    try {
      songs = await resolveSongs(query, interaction.user.tag);
    } catch (err) {
      return interaction.editReply({ embeds: [Embeds.error(err.message)] });
    }

    if (!songs || !songs.length) {
      return interaction.editReply({ embeds: [Embeds.error('Koi result nahi mila.')] });
    }

    // Queue setup
    const manager = interaction.client.musicManager;
    let queue = manager.getQueue(interaction.guild.id);
    const isNew = !queue;

    if (isNew) {
      queue = manager.getOrCreate(interaction.guild, interaction.channel, voiceChannel);
      try {
        await queue.connect();
      } catch (err) {
        manager.removeQueue(interaction.guild.id);
        return interaction.editReply({ embeds: [Embeds.error(err.message)] });
      }
    }

    // Add songs
    try {
      for (const song of songs) queue.addSong(song);
    } catch (err) {
      return interaction.editReply({ embeds: [Embeds.error(err.message)] });
    }

    // Reply
    if (!isNew || songs.length > 1) {
      const msg = songs.length === 1
        ? `**${songs[0].title}** queue mein add ho gaya (#${queue.songs.length}).`
        : `**${songs.length} songs** queue mein add ho gaye.`;
      await interaction.editReply({ embeds: [Embeds.success(msg)] });
    } else {
      await interaction.editReply({ embeds: [Embeds.success('Starting playback…')] });
    }

    // Play
    if (!queue.playing) {
      await queue.play();
    }
  },
};