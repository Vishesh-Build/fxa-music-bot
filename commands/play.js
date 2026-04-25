// commands/play.js
// /play command — accepts YouTube URL, search query, or Spotify URL

const { SlashCommandBuilder } = require('discord.js');
const { resolveSongs } = require('../utils/songResolver');
const Embeds = require('../utils/embeds');
const config = require('../config/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song or add it to the queue')
    .addStringOption((opt) =>
      opt
        .setName('query')
        .setDescription('Song name, YouTube URL, or Spotify URL')
        .setRequired(true),
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const query = interaction.options.getString('query');
    const member = interaction.member;
    const voiceChannel = member.voice?.channel;

    // ── Voice channel check ────────────────────────────────────────────────
    if (!voiceChannel) {
      return interaction.editReply({
        embeds: [Embeds.error('You must be in a voice channel to play music!')],
      });
    }

    // ── Bot permissions check ──────────────────────────────────────────────
    const permissions = voiceChannel.permissionsFor(interaction.guild.members.me);
    if (!permissions.has('Connect') || !permissions.has('Speak')) {
      return interaction.editReply({
        embeds: [Embeds.error('I need **Connect** and **Speak** permissions in your voice channel.')],
      });
    }

    // ── Resolve songs ──────────────────────────────────────────────────────
    let songs;
    try {
      songs = await resolveSongs(query, interaction.user.tag);
    } catch (err) {
      return interaction.editReply({ embeds: [Embeds.error(err.message)] });
    }

    if (!songs.length) {
      return interaction.editReply({ embeds: [Embeds.error('No results found.')] });
    }

    // ── Get or create queue ────────────────────────────────────────────────
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

    // ── Add songs ──────────────────────────────────────────────────────────
    try {
      for (const song of songs) {
        queue.addSong(song);
      }
    } catch (err) {
      return interaction.editReply({ embeds: [Embeds.error(err.message)] });
    }

    // ── Feedback ───────────────────────────────────────────────────────────
    if (!isNew || songs.length > 1) {
      // Already playing — just confirm the addition
      const msg =
        songs.length === 1
          ? `Added **${songs[0].title}** to the queue (position #${queue.songs.length}).`
          : `Added **${songs.length} songs** to the queue.`;
      await interaction.editReply({ embeds: [Embeds.success(msg)] });
    } else {
      await interaction.editReply({ embeds: [Embeds.success(`Starting playback…`)] });
    }

    // ── Start playing if not already ───────────────────────────────────────
    if (!queue.playing) {
      await queue.play();
    }
  },
};
