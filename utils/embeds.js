// utils/embeds.js
// Reusable Discord embed builders

const { EmbedBuilder } = require('discord.js');
const config = require('../config/config');

const Embeds = {
  success(message) {
    return new EmbedBuilder()
      .setColor(config.colors.success)
      .setDescription(`✅ ${message}`);
  },

  error(message) {
    return new EmbedBuilder()
      .setColor(config.colors.error)
      .setDescription(`❌ ${message}`);
  },

  info(message) {
    return new EmbedBuilder()
      .setColor(config.colors.info)
      .setDescription(`ℹ️ ${message}`);
  },

  warning(message) {
    return new EmbedBuilder()
      .setColor(config.colors.warning)
      .setDescription(`⚠️ ${message}`);
  },

  /**
   * Queue list embed.
   * @param {import('../player/MusicQueue')} queue
   * @param {number} page
   */
  queueList(queue, page = 1) {
    const itemsPerPage = 10;
    const upcoming = queue.getUpcomingSongs();
    const totalPages = Math.max(1, Math.ceil(upcoming.length / itemsPerPage));
    const start = (page - 1) * itemsPerPage;
    const slice = upcoming.slice(start, start + itemsPerPage);

    const current = queue.getCurrentSong();

    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle('📋 Music Queue')
      .setFooter({ text: `Page ${page}/${totalPages} • ${upcoming.length} song(s) in queue` });

    if (current) {
      embed.addFields({
        name: '▶️ Now Playing',
        value: `[${current.title}](${current.url}) • \`${current.duration}\` • ${current.requestedBy}`,
      });
    }

    if (slice.length > 0) {
      const list = slice
        .map((s, i) => `**${start + i + 1}.** [${s.title}](${s.url}) • \`${s.duration}\` • ${s.requestedBy}`)
        .join('\n');
      embed.addFields({ name: 'Up Next', value: list });
    } else {
      embed.addFields({ name: 'Up Next', value: 'No more songs in queue.' });
    }

    embed.addFields(
      { name: '🔁 Loop', value: queue.loopMode, inline: true },
      { name: '🔀 Shuffle', value: queue.isShuffled ? 'On' : 'Off', inline: true },
      { name: '♾️ Autoplay', value: queue.autoplay ? 'On' : 'Off', inline: true },
    );

    return embed;
  },
};

module.exports = Embeds;
