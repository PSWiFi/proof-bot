import { SlashCommandBuilder } from "discord.js";
import { setupNewRepo, checkRemoteExists, pull } from "../../structures/git.js";

export const data = new SlashCommandBuilder()
    .setName("createalbum")
    .setDescription("Creates a proof album")
    .addStringOption(opt =>
        opt
            .setName("name")
            .setDescription("The name of the proof album.")
            .setRequired(true),
    )

    export async function execute(interaction) {
        // interaction.user is the object representing the User who ran the command
        // interaction.member is the GuildMember object, which represents the user in the specific guild
        const name = interaction.options.get("name");

        let repo = Storage.getDatabase("repo");
        if (!repo) repo = {};
        if (!repo.repo) repo.repo = 1;

        interaction.deferReply();

        if (!await Storage.checkLocalRepoExists(repo.repo)) {
            await checkRemoteExists(repo.repo);
        } 
        await pull(repo.repo);

        const stat = await Storage.statRepo(repo.repo);
        if (stat?.[2]) {
            await setupNewRepo(interaction);
        }

        repo = Storage.getDatabase("repo");

        const username = interaction.user.username;

        await Storage.makeDirectory(repo.repo, username);


};

const getHash = str => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
  }
  // Convert to 32bit unsigned integer in base 36 and pad with "0" to ensure length is 7.
  return (hash >>> 0).toString(36).padStart(7, '0');
};
