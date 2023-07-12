const { Client, GuildMember, GatewayIntentBits } = require("discord.js");
const { Player, useQueue } = require("discord-player");

require("dotenv").config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
  ],
});

client.on("ready", () => {
  console.log("Bot is online!");
  client.user.setActivity({
    name: "🎶 | Music Time",
    type: "LISTENING",
  });
});
client.on("error", console.error);
client.on("warn", console.warn);

const player = new Player(client);
player.extractors.loadDefault();

player.on("error", (queue, error) => {
  console.log(
    `[${queue.guild.name}] Error emitted from the queue: ${error.message}`
  );
});
player.on("connectionError", (queue, error) => {
  console.log(
    `[${queue.guild.name}] Error emitted from the connection: ${error.message}`
  );
});

// player.on("trackStart", (queue, track) => {
//   queue.metadata.send(
//     `🎶 | Started playing: **${track.title}** in **${queue.connection.channel.name}**!`
//   );
// });

// player.on("trackAdd", (queue, track) => {
//   queue.metadata.send(`🎶 | Track **${track.title}** queued!`);
// });

// player.on("botDisconnect", (queue) => {
//   queue.metadata.send(
//     "❌ | I was manually disconnected from the voice channel, clearing queue!"
//   );
// });

// player.on("channelEmpty", (queue) => {
//   queue.metadata.send("❌ | Nobody is in the voice channel, leaving...");
// });

// player.on("queueEnd", (queue) => {
//   queue.metadata.send("✅ | Queue finished!");
// });

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand() || !interaction.guildId) return;

  if (
    !(interaction.member instanceof GuildMember) ||
    !interaction.member.voice.channel
  ) {
    return void interaction.reply({
      content: "You are not in a voice channel!",
      ephemeral: true,
    });
  }

  switch (interaction.commandName) {
    case "play":
      await interaction.deferReply();

      try {
        const channel = interaction.member.voice.channel;
        if (!channel)
          return interaction.reply("You are not connected to a voice channel!");
        const query = interaction.options.getString("query", true);
        const { track } = await player.play(channel, query, {
          nodeOptions: {
            metadata: interaction,
          },
        });

        return interaction.followUp("Playing your tracks");
      } catch (e) {
        return interaction.followUp(`Something went wrong: ${e}`);
      }

    case "splay":
      await interaction.deferReply();

      try {
        const channel = interaction.member.voice.channel;
        if (!channel)
          return interaction.reply("You are not connected to a voice channel!");
        const query = interaction.options.getString("query", true);
        const { track } = await player.play(channel, query, {
          nodeOptions: {
            metadata: interaction,
          },
        });
        const queue = useQueue(interaction.guild.id);
        queue.tracks.shuffle();

        return interaction.followUp("Shuffle playing your tracks");
      } catch (e) {
        return interaction.followUp(`Something went wrong: ${e}`);
      }

    case "stop":
      await interaction.deferReply();

      try {
        const queue = useQueue(interaction.guild.id);
        queue.delete();
        return interaction.followUp(`Stopped`);
      } catch (e) {
        return interaction.followUp(`Something went wrong: ${e}`);
      }

    case "skip":
      await interaction.deferReply();

      try {
        const queue = useQueue(interaction.guild.id);
        queue.node.skip();
        return interaction.followUp(`Skipped`);
      } catch (e) {
        return interaction.followUp(`Something went wrong: ${e}`);
      }

    case "shuffle":
      await interaction.deferReply();

      try {
        const queue = useQueue(interaction.guild.id);
        queue.tracks.shuffle();
        return interaction.followUp(`Shuffled`);
      } catch (e) {
        return interaction.followUp(`Something went wrong: ${e}`);
      }

    case "clear":
      await interaction.deferReply();

      try {
        const queue = useQueue(interaction.guild.id);
        queue.clear();
        return interaction.followUp(`Cleared`);
      } catch (e) {
        return interaction.followUp(`Something went wrong: ${e}`);
      }

    case "list":
      await interaction.deferReply();

      try {
        const queue = useQueue(interaction.guild.id);
        const tracks = queue.tracks.toJSON();
        const list = [];
        for (var track of tracks) list.push(track.title);
        const result = list.join('\n');
        return interaction.followUp(result);
      } catch (e) {
        return interaction.followUp(`Something went wrong: ${e}`);
      }

    default:
      // Handle unknown commandName
      return interaction.followUp(
        `Unknown command: ${interaction.commandName}`
      );
  }
});

client.login(process.env.music_bot_discord_token);
