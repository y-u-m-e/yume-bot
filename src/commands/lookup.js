/**
 * /lookup - Look up a player's attendance history
 */

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { createApiClient } from '../lib/api.js';

export const data = new SlashCommandBuilder()
  .setName('lookup')
  .setDescription('Look up a player\'s attendance history')
  .addStringOption(option =>
    option
      .setName('name')
      .setDescription('Player name to look up (RuneScape name)')
      .setRequired(true)
  )
  .addIntegerOption(option =>
    option
      .setName('limit')
      .setDescription('Number of recent events to show (default: 10)')
      .setRequired(false)
      .setMinValue(1)
      .setMaxValue(25)
  );

export async function execute(interaction, config) {
  await interaction.deferReply();

  const api = createApiClient(config.apiBase, config.apiKey);
  
  const name = interaction.options.getString('name');
  const limit = interaction.options.getInteger('limit') || 10;

  try {
    const data = await api.getAttendanceRecords({
      name,
      limit,
    });

    if (!data.results || data.results.length === 0) {
      const noDataEmbed = new EmbedBuilder()
        .setColor(0xF5A623)
        .setTitle(`🔍 Player Lookup: ${name}`)
        .setDescription('No attendance records found for this player.')
        .addFields(
          { name: '💡 Tip', value: 'Make sure you\'re using the exact RuneScape name (spaces matter!)' }
        )
        .setTimestamp();

      return interaction.editReply({ embeds: [noDataEmbed] });
    }

    // Get unique events attended
    const events = [...new Set(data.results.map(r => r.event))];
    
    // Format recent events list
    const recentEvents = data.results.slice(0, 10).map(record => {
      const date = new Date(record.date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: record.date.startsWith(new Date().getFullYear().toString()) ? undefined : 'numeric'
      });
      return `• **${record.event}** — ${date}`;
    });

    const embed = new EmbedBuilder()
      .setColor(0xE8B4D8)
      .setTitle(`🔍 Player Lookup: ${data.results[0].name}`)
      .setDescription(recentEvents.join('\n'))
      .addFields(
        { name: '📊 Total Events', value: data.total?.toString() || data.results.length.toString(), inline: true },
        { name: '🎯 Unique Events', value: events.length.toString(), inline: true },
      )
      .setFooter({ text: `Showing ${Math.min(limit, data.results.length)} most recent events` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Lookup error:', error);
    
    const errorEmbed = new EmbedBuilder()
      .setColor(0xFF4444)
      .setTitle('❌ Error')
      .setDescription('Failed to look up player. Please try again later.')
      .setTimestamp();

    await interaction.editReply({ embeds: [errorEmbed] });
  }
}

