/**
 * /leaderboard - View event attendance leaderboard
 */

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { createApiClient } from '../lib/api.js';

export const data = new SlashCommandBuilder()
  .setName('leaderboard')
  .setDescription('View event attendance leaderboard')
  .addStringOption(option =>
    option
      .setName('event')
      .setDescription('Filter by event name (e.g., "Wildy Wednesday")')
      .setRequired(false)
  )
  .addStringOption(option =>
    option
      .setName('period')
      .setDescription('Time period for the leaderboard')
      .setRequired(false)
      .addChoices(
        { name: 'This Month', value: 'month' },
        { name: 'This Year', value: 'year' },
        { name: 'All Time', value: 'all' },
      )
  )
  .addIntegerOption(option =>
    option
      .setName('limit')
      .setDescription('Number of results to show (default: 10)')
      .setRequired(false)
      .setMinValue(1)
      .setMaxValue(25)
  );

export async function execute(interaction, config) {
  await interaction.deferReply();

  const api = createApiClient(config.apiBase, config.apiKey);
  
  const event = interaction.options.getString('event');
  const period = interaction.options.getString('period') || 'all';
  const limit = interaction.options.getInteger('limit') || 10;

  // Calculate date range based on period
  const now = new Date();
  let start = null;
  let periodLabel = 'All Time';

  if (period === 'month') {
    start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    periodLabel = now.toLocaleString('default', { month: 'long', year: 'numeric' });
  } else if (period === 'year') {
    start = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
    periodLabel = now.getFullYear().toString();
  }

  try {
    const data = await api.getLeaderboard({
      event: event || undefined,
      start: start || undefined,
      limit,
    });

    if (!data.results || data.results.length === 0) {
      const noDataEmbed = new EmbedBuilder()
        .setColor(0xF5A623)
        .setTitle('📊 Attendance Leaderboard')
        .setDescription('No attendance records found for the specified criteria.')
        .setTimestamp();

      return interaction.editReply({ embeds: [noDataEmbed] });
    }

    // Build leaderboard entries
    const entries = data.results.map((entry, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
      return `${medal} **${entry.name}** — ${entry.count} events`;
    });

    const embed = new EmbedBuilder()
      .setColor(0xE8B4D8)
      .setTitle('📊 Attendance Leaderboard')
      .setDescription(entries.join('\n'))
      .addFields(
        { name: '📅 Period', value: periodLabel, inline: true },
        { name: '🎯 Event', value: event || 'All Events', inline: true },
        { name: '👥 Total Players', value: data.total?.toString() || data.results.length.toString(), inline: true },
      )
      .setFooter({ text: 'Yume Tools • Data from api.itai.gg' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Leaderboard error:', error);
    
    const errorEmbed = new EmbedBuilder()
      .setColor(0xFF4444)
      .setTitle('❌ Error')
      .setDescription('Failed to fetch leaderboard data. Please try again later.')
      .setTimestamp();

    await interaction.editReply({ embeds: [errorEmbed] });
  }
}

