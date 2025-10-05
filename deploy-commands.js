import { REST, Routes } from "discord.js";
import { readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import * as colors from "colors";
import "dotenv/config";
import { stdout } from "node:process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Grab all the command folders from the commands directory you created earlier
const foldersPath = join(__dirname, "commands");
const commandFolders = readdirSync(foldersPath);

async function getCommands() {
  const commands = [];
  for (const folder of commandFolders) {
    // Grab all the command files from the commands directory you created earlier
    const commandsPath = join(foldersPath, folder);
    const commandFiles = readdirSync(commandsPath).filter((file) =>
      file.endsWith(".js")
    );
    // Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
    for (const file of commandFiles) {
      const filePath = join(commandsPath, file);
      await import("file://" + filePath).then((command) => {
        if ("data" in command && "execute" in command) {
          stdout.write(`Loading "${command.data.name.yellow}" command...`);
          commands.push(command.data.toJSON());
          console.log(" DONE".green);
        } else {
          console.log(
            `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
          );
        }
      });
    }
  }
  return commands;
}

// and deploy your commands!
(async () => {
  try {
    await getCommands().then(async (commands) => {
      console.log(
        `Started refreshing ${commands.length} application (/) commands.`
      );

      const rest = new REST().setToken(process.env.DISCORD_TOKEN);

      // The put method is used to fully refresh all commands in the guild with the current set
      const data = await rest.put(
        Routes.applicationGuildCommands(
          process.env.CLIENT_ID,
          process.env.GUILD_ID
        ),
        { body: commands }
      );

      console.log(
        `Successfully reloaded ${data.length} application (/) commands.`
      );
    });
  } catch (error) {
    // And of course, make sure you catch and log any errors!
    console.error(error);
  }
})();
