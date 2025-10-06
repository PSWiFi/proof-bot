import { SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
    .setName("linkuser")
    .setDescription("Links a discord user with their PS! account")
    .addStringOption(opt =>
        opt
            .setName("username")
            .setDescription("The PS! username you want to connect to this discord account.")
            .setRequired(true),
    )

    export async function execute(interaction) {
        // interaction.user is the object representing the User who ran the command
        // interaction.member is the GuildMember object, which represents the user in the specific guild
        const usn = toId(interaction.options.getString("username"));
        const hash = getHash(Date.now() + usn);

        var db = Storage.getDatabase("linked-users");
        const lu = await Storage.checkLinkUser(usn);
        console.log(lu);
        if (!db.users) db.users = {};
        if (!db.users[interaction.user.id]) {
            db.users[interaction.user.id] = {};
        } else {
            if (lu?.verified) db.users[interaction.user.id].verified = true;
            if (db.users[interaction.user.id]?.verified && db.users[interaction.user.id]?.username) {
                return interaction.reply({ content: `Your discord account is linked to \`${db.users[interaction.user.id].username}\`.` });
            } else {
                return interaction.reply({ content: `Account \`${db.users[interaction.user.id].username}\` not yet linked! Please send \`/w pipbot, ~verify ${db.users[interaction.user.id].code}\` to any room on PS! to proceed.` });
            }
        }
        db.users[interaction.user.id].verified = false;
        db.users[interaction.user.id].username = usn;
        db.users[interaction.user.id].code = hash;

        await Storage.createLinkUser(usn, hash, interaction.user.id);
        await Storage.setDatabase("linked-users");

        interaction.reply({ content: `Please send \`/w pipbot, ~verify ${hash}\` to any room on PS! to link your account and use the bot.` });
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
