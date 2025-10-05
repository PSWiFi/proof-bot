import { InteractionContextType, PermissionFlagsBits, SlashCommandBuilder, MessageFlags } from "discord.js";
import { execFile } from "node:child_process";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const allowed_users = ["legofigure11", "b.illo"];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const reloaddir = path.resolve(__dirname, "..", "..", "deploy-commands.js");

export const data = new SlashCommandBuilder()
  .setName("reloadcommands")
  .setDescription("Reloads all the bot's application commands")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .setContexts(InteractionContextType.BotDM)
export async function execute(interaction) {
  if (!allowed_users.includes(interaction.user.username)) await interaction.reply({
        content: "Oops! Looks like you don't have permission to do that...", flags: MessageFlags.Ephemeral 
  });

  await interaction.deferReply();
  execFile("node", [reloaddir], (err, stdout, strerr) => {
    if (err) {
      interaction.editReply("Something went wrong re-deploying commands! Check the console for details.");
      console.error(err);
    }
    console.log(stdout);
    interaction.editReply("Commands re-deployed!");
  });
}
