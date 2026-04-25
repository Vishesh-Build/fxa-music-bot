// events/ready.js
// Fired once when the bot connects to Discord

const { ActivityType } = require('discord.js');
const config = require('../config/config');

module.exports = {
  name: 'ready',
  once: true, // Only fire once

  execute(client) {
    console.log(`✅ Logged in as ${client.user.tag}`);
    console.log(`📡 Serving ${client.guilds.cache.size} guild(s)`);

    // Set bot presence / status
    client.user.setPresence({
      activities: [
        {
          name: '/play to start music • FxA Music Bot',
          type: ActivityType.Listening,
        },
      ],
      status: 'online',
    });

    console.log(`🎵 ${config.botName} is ready!`);
  },
};
