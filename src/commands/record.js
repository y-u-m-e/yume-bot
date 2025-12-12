/**
 * /record - Log attendance for an event (Admin only)
 */

import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { createApiClient } from '../lib/api.js';

export const data = new SlashCommandBuilder()
  .setName('record')
  .setDescription('Log attendance for a clan event (Admin only)')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addStringOption(option =>
    option
      .setName('player')
      .setDescription('RuneScape player name')
      .setRequired(true)
  )
  .addStringOption(option =>
    option
      .setName('event')
      .setDescription('Event name (e.g., "Wildy Wednesday")')
      .setRequired(true)
      .addChoices(
        { name: 'Wildy Wednesday', value: 'Wildy Wednesday' },
        { name: 'PvM Sunday', value: 'PvM Sunday' },
        { name: 'Skill & Chill', value: 'Skill & Chill' },
        { name: 'Bingo Night', value: 'Bingo Night' },
        { name: 'CoX Mass', value: 'CoX Mass' },
        { name: 'ToB Mass', value: 'ToB Mass' },
        { name: 'ToA Mass', value: 'ToA Mass' },
        { name: 'Other', value: 'Other' },
      )
  )
  .addStringOption(option =>
    option
      .setName('custom_event')
      .setDescription('Custom event name (if "Other" selected)')
      .setRequired(false)
  )
  .addStringOption(option =>
    option
      .setName('date')
      .setDescription('Date of event (YYYY-MM-DD, defaults to today)')
      .setRequired(false)
  );

export async function execute(interaction, config) {
  // Check if API key is configured for write operations
  if (!config.apiKey) {
    const errorEmbed = new EmbedBuilder()
      .setColor(0xFF4444)
      .setTitle('❌ Not Configured')
      .setDescription('API key not configured. Contact an administrator.')
      .setTimestamp();

    return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
  }

  await interaction.deferReply();

  const api = createApiClient(config.apiBase, config.apiKey);
  
  const player = interaction.options.getString('player');
  let event = interaction.options.getString('event');
  const customEvent = interaction.options.getString('custom_event');
  const dateInput = interaction.options.getString('date');

  // Handle custom event
  if (event === 'Other') {
    if (!customEvent) {
      const errorEmbed = new EmbedBuilder()
        .setColor(0xFF4444)
        .setTitle('❌ Missing Custom Event Name')
        .setDescription('Please provide a custom event name when selecting "Other".')
        .setTimestamp();

      return interaction.editReply({ embeds: [errorEmbed] });
    }
    event = customEvent;
  }

  // Parse and validate date
  let date = new Date().toISOString().split('T')[0]; // Default to today
  
  if (dateInput) {
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      const errorEmbed = new EmbedBuilder()
        .setColor(0xFF4444)
        .setTitle('❌ Invalid Date Format')
        .setDescription('Date must be in YYYY-MM-DD format (e.g., 2025-12-25)')
        .setTimestamp();

      return interaction.editReply({ embeds: [errorEmbed] });
    }
    date = dateInput;
  }

  try {
    const result = await api.createAttendanceRecord({
      name: player,
      event: event,
      date: date,
    });

    const successEmbed = new EmbedBuilder()
      .setColor(0x4CAF50)
      .setTitle('✅ Attendance Recorded')
      .setDescription(`Successfully logged attendance for **${player}**`)
      .addFields(
        { name: '🎯 Event', value: event, inline: true },
        { name: '📅 Date', value: date, inline: true },
        { name: '🆔 Record ID', value: result.id?.toString() || 'Created', inline: true },
      )
      .setFooter({ text: `Recorded by ${interaction.user.tag}` })
      .setTimestamp();

    await interaction.editReply({ embeds: [successEmbed] });
  } catch (error) {
    console.error('Record error:', error);
    
    const errorEmbed = new EmbedBuilder()
      .setColor(0xFF4444)
      .setTitle('❌ Failed to Record')
      .setDescription(error.message || 'Failed to create attendance record. Please try again.')
      .setTimestamp();

    await interaction.editReply({ embeds: [errorEmbed] });
  }
}

