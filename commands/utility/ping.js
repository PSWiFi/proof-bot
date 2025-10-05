import { SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies with Pong!");
export async function execute(interaction) {
    const sent = await interaction.reply({ content: "Pinging..." });
    interaction.editReply(
      `Pong! :ping_pong:\nWebsocket heartbeat: ${interaction.client.ws.ping}ms.\nRoundtrip latency: ${
        sent.createdTimestamp - interaction.createdTimestamp
      }ms`
    );
}
