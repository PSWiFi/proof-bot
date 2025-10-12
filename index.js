import { readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import * as colors from "colors";
import { Client, Collection, Events, GatewayIntentBits, MessageFlags } from "discord.js";
import { loadStorage } from "./structures/storage.js";
import "dotenv/config";
import { stdout } from "node:process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages, GatewayIntentBits.DirectMessages ] });

loadStorage();
Storage.importDatabases();

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag.cyan}`);
});

client.login(process.env.DISCORD_TOKEN);

client.on(Events.MessageCreate, (message) => {
  console.log(message);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = interaction.client.commands.get(interaction.commandName);

  console.log(
    `Command: ${interaction.commandName.green} received from ${
      interaction.user.username.yellow
    } ${`(${interaction.user.id})`.grey} in ${
      interaction.guild
        ? `${interaction.guild.name.cyan} ${`(${interaction.guild.id})`.grey}`
        : "DM".cyan
    }`
  );

  if (!command) {
    console.error(
      `No command matching ${interaction.commandName.red} was found.`
    );
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "There was an error while executing this command!",
        flags: MessageFlags.Ephemeral,
      });
    } else {
      await interaction.reply({
        content: "There was an error while executing this command!",
        flags: MessageFlags.Ephemeral,
      });
    }
  }
});

client.commands = new Collection();

const foldersPath = join(__dirname, "commands");
const commandFolders = readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = join(foldersPath, folder);
  const commandFiles = readdirSync(commandsPath).filter((file) =>
    file.endsWith(".js")
  );
  for (const file of commandFiles) {
    const filePath = join(commandsPath, file);
    import("file://" + filePath).then((command) => {
      if ("data" in command && "execute" in command) {
        stdout.write(
          `Loading ${command.data.name.yellow} command...`
        );
        client.commands.set(command.data.name, command);
        console.log(" DONE".green);
      } else {
        console.warn(
          `${
            "[WARNING]".red
          } The command at ${filePath} is missing a required "data" or "execute" property.`
        );
      }
    });
  }
}
