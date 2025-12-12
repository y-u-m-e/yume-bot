/**
 * /ping - Simple ping command to check bot latency
 */

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Check bot latency and API status');

export async function execute(interaction, config) {
  const response = await interaction.reply({ content: '🏓 Pinging...', withResponse: true });
  const latency = response.resource.message.createdTimestamp - interaction.createdTimestamp;
  const wsLatency = interaction.client.ws.ping;

  // Check API health
  let apiStatus = '❓ Unknown';
  let apiLatency = 'N/A';
  
  try {
    const start = Date.now();
    const response = await fetch(`${config.apiBase}/health`);
    apiLatency = `${Date.now() - start}ms`;
    
    if (response.ok) {
      const data = await response.json();
      apiStatus = data.status === 'ok' ? '✅ Online' : '⚠️ Degraded';
    } else {
      apiStatus = '❌ Error';
    }
  } catch {
    apiStatus = '❌ Offline';
  }

  const embed = new EmbedBuilder()
    .setColor(0xE8B4D8) // Soft pink (Yume theme)
    .setTitle('🌸 Yume Bot Status')
    .addFields(
      { name: '🤖 Bot Latency', value: `${latency}ms`, inline: true },
      { name: '💓 WebSocket', value: `${wsLatency}ms`, inline: true },
      { name: '🔗 API Status', value: apiStatus, inline: true },
      { name: '⚡ API Latency', value: apiLatency, inline: true },
    )
    .setFooter({ text: 'Yume Tools' })
    .setTimestamp();

  await interaction.editReply({ content: null, embeds: [embed] });
}

