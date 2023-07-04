const { REST, Routes } = require('discord.js');
require('dotenv').config()

const commands = [
  {
    name: "play",
    description: "Plays music from a URL",
    options: [
      {
        name: "query",
        type: 3,
        description: "The song or playlist you want to play",
        required: true,
      },
    ],
  },
  {
    name: "skip",
    description: "Skip the current song",
  },
  {
    name: "stop",
    description: "Stop the player",
  },
  {
    name: "shuffle",
    description: "Shuffle the player",
  },
]

const rest = new REST().setToken(process.env.music_bot_discord_token);

// and deploy your commands!
(async () => {
	try {

		// The put method is used to fully refresh all commands in the guild with the current set
		await rest.put(
			Routes.applicationCommands(process.env.music_bot_discord_client_id),
			{ body: commands },
		);

	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
})();