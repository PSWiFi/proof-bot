import { InteractionContextType, PermissionFlagsBits, SlashCommandBuilder, MessageFlags } from "discord.js";
import { exec } from "node:child_process";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const allowed_users = ["legofigure11", "b.illo"];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const base = path.resolve(__dirname, "..", "..");

export const data = new SlashCommandBuilder()
  .setName("pull")
  .setDescription("Performs `git pull`")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .setContexts(InteractionContextType.BotDM)
export async function execute(interaction) {
  if (!allowed_users.includes(interaction.user.username)) await interaction.reply({
        content: "Oops! Looks like you don't have permission to do that...", flags: MessageFlags.Ephemeral 
  });

  await interaction.deferReply();

  exec(`cd ${base} && git pull`, (err, stdout, stderr) => {
    if (err) {
        interaction.editReply("Something went wrong executing `git pull`! ```" + err + "```");
      console.error(err);
    }
    if (stdout) return interaction.editReply("```" + stdout + "```");
    console.error(stderr);
    interaction.editReply("Done!");
  });
}
