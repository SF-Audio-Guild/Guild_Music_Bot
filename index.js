const { Client, GuildMember, GatewayIntentBits } = require("discord.js");
const { Player, useQueue } = require("discord-player");
const { SpotifyExtractor } = require('@discord-player/extractor');

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
player.extractors.register(SpotifyExtractor, {});

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
  if (!interaction.isCommand() || !interaction.guild.id) return;

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
        if (!channel) {
          return interaction.reply("You are not connected to a voice channel!");
        }

        // get query
        const query = interaction.options.getString("query", true);
        // handle queue
        let queue = useQueue(interaction.guild.id);
        if (!queue) {
          const queue = player.nodes.create(interaction.guild.id, {
            metadata: interaction,
          });
          const result = await player.search(query);
          // acquire task entry
          const entry = queue.tasksQueue.acquire();
          // wait for previous task to be released and our task to be resolved
          await entry.getTask();
          // connect
          await queue.connect(channel);
          // add track(s) (this will add playlist or single track from the result)
          if (!result.playlist) {
            queue.addTrack(result.tracks[0]);
          } else {
            queue.addTrack(result.playlist);
          }
          // shuffle
          queue.tracks.shuffle();
          // if player node was not previously playing, play a song
          await queue.node.play(null);
          // release the task we acquired to let other tasks to be executed
          // make sure you are releasing your entry, otherwise your bot won't
          // accept new play requests
          queue.tasksQueue.release();
        } else {
          const { track } = await player.play(channel, query, {
            nodeOptions: {
              metadata: interaction,
            },
          });
          // shuffle
          queue.tracks.shuffle();
        }

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
        list.push(queue.currentTrack.toJSON().title);
        for (var track of tracks) list.push(track.title);
        if (list.length < 2)
          return interaction.followUp("No tracks in the queue");
        const result = list.join("\n");
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
