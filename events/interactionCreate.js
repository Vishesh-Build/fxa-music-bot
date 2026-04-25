// events/interactionCreate.js
const Embeds = require('../utils/embeds');
const config = require('../config/config');

module.exports = {
  name: 'interactionCreate',
  once: false,

  async execute(interaction) {
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);
      if (!command) {
        return interaction.reply({
          embeds: [Embeds.error(`Unknown command: \`${interaction.commandName}\``)],
          ephemeral: true,
        });
      }
      try {
        await command.execute(interaction);
      } catch (err) {
        console.error(`[Command Error] /${interaction.commandName}:`, err);
        const errMsg = Embeds.error('An error occurred while executing this command.');
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply({ embeds: [errMsg] });
        } else {
          await interaction.reply({ embeds: [errMsg], ephemeral: true });
        }
      }
      return;
    }

    if (interaction.isButton()) {
      await handleButton(interaction);
      return;
    }
  },
};

async function handleButton(interaction) {
  const queue = interaction.client.musicManager.getQueue(interaction.guild.id);

  if (!queue) {
    return interaction.reply({
      embeds: [Embeds.error('Nothing is playing right now.')],
      ephemeral: true,
    });
  }

  const userVC = interaction.member.voice?.channel;
  if (!userVC || userVC.id !== queue.voiceChannel.id) {
    return interaction.reply({
      embeds: [Embeds.error('You must be in the same voice channel to use controls.')],
      ephemeral: true,
    });
  }

  const { customId } = interaction;

  try {
    switch (customId) {
      case 'music_pause': {
        const ok = queue.pause();
        await interaction.reply({
          embeds: [ok ? Embeds.success('⏸ Paused.') : Embeds.warning('Already paused.')],
          ephemeral: true,
        });
        break;
      }

      case 'music_resume': {
        const ok = queue.resume();
        await interaction.reply({
          embeds: [ok ? Embeds.success('▶️ Resumed.') : Embeds.warning('Not paused.')],
          ephemeral: true,
        });
        break;
      }

      case 'music_skip': {
        const song = queue.getCurrentSong();
        await queue.skip();
        await interaction.reply({
          embeds: [Embeds.success(`⏭ Skipped **${song?.title || 'current song'}**.`)],
          ephemeral: true,
        });
        break;
      }

      case 'music_stop': {
        queue.stop();
        interaction.client.musicManager.removeQueue(interaction.guild.id);
        await interaction.reply({
          embeds: [Embeds.success('⏹ Stopped and cleared the queue.')],
          ephemeral: true,
        });
        break;
      }

      case 'music_loop': {
        const modes = Object.values(config.loopModes);
        const nextMode = modes[(modes.indexOf(queue.loopMode) + 1) % modes.length];
        queue.setLoop(nextMode);
        const labels = { off: 'Off', track: 'Track 🔂', queue: 'Queue 🔁' };
        await interaction.reply({
          embeds: [Embeds.success(`🔁 Loop set to **${labels[nextMode]}**.`)],
          ephemeral: true,
        });
        break;
      }

      case 'music_shuffle': {
        const on = queue.toggleShuffle();
        await interaction.reply({
          embeds: [Embeds.success(`🔀 Shuffle **${on ? 'enabled' : 'disabled'}**.`)],
          ephemeral: true,
        });
        break;
      }

      case 'music_autoplay': {
        const on = queue.toggleAutoplay();
        await interaction.reply({
          embeds: [Embeds.success(`♾️ Autoplay **${on ? 'enabled' : 'disabled'}**.`)],
          ephemeral: true,
        });
        break;
      }

      case 'music_queue': {
        await interaction.reply({
          embeds: [Embeds.queueList(queue, 1)],
          ephemeral: true,
        });
        break;
      }

      case 'music_vol_down': {
        const newVol = Math.max(0, queue.volume - 10);
        queue.setVolume(newVol);
        await interaction.reply({
          embeds: [Embeds.success(`🔉 Volume set to **${newVol}%**.`)],
          ephemeral: true,
        });
        break;
      }

      case 'music_vol_up': {
        const newVol = Math.min(100, queue.volume + 10);
        queue.setVolume(newVol);
        await interaction.reply({
          embeds: [Embeds.success(`🔊 Volume set to **${newVol}%**.`)],
          ephemeral: true,
        });
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error(`[Button Error] ${customId}:`, err);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ embeds: [Embeds.error('Something went wrong.')], ephemeral: true });
    }
  }
}