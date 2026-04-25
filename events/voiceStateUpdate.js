module.exports = {
  name: 'voiceStateUpdate',
  once: false,

  execute(oldState, newState) {
    const client = oldState.client;
    const guildId = oldState.guild.id;
    const queue = client.musicManager?.getQueue(guildId);

    if (!queue) return;

    // Bot khud disconnect hua
    if (oldState.id === client.user.id && !newState.channelId) {
      try { queue.destroy(); } catch { /* ignore */ }
      return;
    }

    const botChannel = queue.voiceChannel;
    if (!botChannel) return;

    const members = botChannel.members.filter((m) => !m.user.bot);
    if (members.size === 0) {
      if (queue._aloneTimer) return;
      queue._aloneTimer = setTimeout(async () => {
        const currentMembers = botChannel.members.filter((m) => !m.user.bot);
        if (currentMembers.size === 0) {
          try {
            queue.textChannel.send({
              embeds: [{ color: 0x5865f2, description: '👋 Left voice channel — everyone left.' }],
            });
            queue.destroy();
          } catch { /* ignore */ }
        }
        queue._aloneTimer = null;
      }, 30_000);
    } else {
      if (queue._aloneTimer) {
        clearTimeout(queue._aloneTimer);
        queue._aloneTimer = null;
      }
    }
  },
};