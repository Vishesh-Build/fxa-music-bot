// player/MusicManager.js
// Manages a MusicQueue instance per guild (server)

const MusicQueue = require('./MusicQueue');

/**
 * MusicManager is a Map<guildId, MusicQueue>.
 * Attached to client.musicManager so it's accessible everywhere.
 */
class MusicManager extends Map {
  /**
   * Get or create a queue for a guild.
   * @param {import('discord.js').Guild} guild
   * @param {import('discord.js').TextChannel} textChannel
   * @param {import('discord.js').VoiceChannel} voiceChannel
   * @returns {MusicQueue}
   */
  getOrCreate(guild, textChannel, voiceChannel) {
    if (this.has(guild.id)) return this.get(guild.id);
    const queue = new MusicQueue(guild, textChannel, voiceChannel);
    this.set(guild.id, queue);
    return queue;
  }

  /**
   * Get an existing queue without creating one.
   * @param {string} guildId
   * @returns {MusicQueue|null}
   */
  getQueue(guildId) {
    return this.get(guildId) || null;
  }

  /**
   * Destroy and remove a guild's queue.
   * @param {string} guildId
   */
  removeQueue(guildId) {
    const queue = this.get(guildId);
    if (queue) {
      queue.destroy();
      this.delete(guildId);
    }
  }
}

module.exports = MusicManager;
