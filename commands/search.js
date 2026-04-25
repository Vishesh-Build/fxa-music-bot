// commands/search.js
// Search YouTube and let the user pick from top 5 results

const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} = require('discord.js');
const play = require('play-dl');
const Embeds = require('../utils/embeds');
const config = require('../config/config');
const { formatDuration, truncate } = require('../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('search')
    .setDescription('Search YouTube and pick a song to play')
    .addStringOption((opt) =>
      opt.setName('query').setDescription('Search query').setRequired(true),
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const query = interaction.options.getString('query');

    // ── Voice channel check ────────────────────────────────────────────────
    if (!interaction.member.voice?.channel) {
      return interaction.editReply({ embeds: [Embeds.error('Join a voice channel first!')] });
    }

    // ── Search YouTube ─────────────────────────────────────────────────────
    let results;
    try {
      results = await play.search(query, { limit: 5, source: { youtube: 'video' } });
    } catch (err) {
      return interaction.editReply({ embeds: [Embeds.error('Search failed. Please try again.')] });
    }

    if (!results.length) {
      return interaction.editReply({ embeds: [Embeds.error(`No results found for **${query}**.`)] });
    }

    // ── Build embed + select menu ──────────────────────────────────────────
    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle(`🔍 Search Results for: ${truncate(query, 50)}`)
      .setDescription(
        results
          .map(
            (v, i) =>
              `**${i + 1}.** [${truncate(v.title, 60)}](${v.url})\n` +
              `⏱ \`${formatDuration(v.durationInSec)}\` • 👁 ${(v.views || 0).toLocaleString()} views`,
          )
          .join('\n\n'),
      )
      .setFooter({ text: 'Select a song below • Times out in 30s' });

    const menu = new StringSelectMenuBuilder()
      .setCustomId('search_select')
      .setPlaceholder('Choose a song...')
      .addOptions(
        results.map((v, i) => ({
          label: truncate(v.title, 100),
          description: `Duration: ${formatDuration(v.durationInSec)}`,
          value: v.url,
          emoji: ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'][i],
        })),
      );

    const row = new ActionRowBuilder().addComponents(menu);
    const reply = await interaction.editReply({ embeds: [embed], components: [row] });

    // ── Collect user selection ─────────────────────────────────────────────
    try {
      const collected = await reply.awaitMessageComponent({
        filter: (i) => i.user.id === interaction.user.id && i.customId === 'search_select',
        time: 30_000,
      });

      const selectedUrl = collected.values[0];
      const selected = results.find((v) => v.url === selectedUrl);

      // Disable menu after selection
      menu.setDisabled(true);
      await collected.update({ components: [new ActionRowBuilder().addComponents(menu)] });

      // Add to queue and play
      const voiceChannel = interaction.member.voice?.channel;
      if (!voiceChannel) {
        return interaction.followUp({ embeds: [Embeds.error('You left the voice channel!')] });
      }

      const song = {
        title: selected.title,
        url: selected.url,
        duration: formatDuration(selected.durationInSec),
        thumbnail: selected.thumbnails?.[0]?.url || '',
        requestedBy: interaction.user.tag,
      };

      const manager = interaction.client.musicManager;
      let queue = manager.getQueue(interaction.guild.id);
      const isNew = !queue;

      if (isNew) {
        queue = manager.getOrCreate(interaction.guild, interaction.channel, voiceChannel);
        await queue.connect();
      }

      queue.addSong(song);
      if (!isNew) {
        await interaction.followUp({
          embeds: [Embeds.success(`Added **${song.title}** to the queue.`)],
        });
      }

      if (!queue.playing) await queue.play();
    } catch {
      // Timeout — disable the menu
      menu.setDisabled(true);
      await interaction.editReply({
        embeds: [embed.setFooter({ text: 'Search timed out.' })],
        components: [new ActionRowBuilder().addComponents(menu)],
      });
    }
  },
};
