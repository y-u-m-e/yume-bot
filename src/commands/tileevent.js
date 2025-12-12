/**
 * /tileevent - View and interact with tile events
 */

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { createApiClient } from '../lib/api.js';

export const data = new SlashCommandBuilder()
  .setName('tileevent')
  .setDescription('View tile event information')
  .addSubcommand(subcommand =>
    subcommand
      .setName('list')
      .setDescription('View all active tile events')
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('info')
      .setDescription('View details about a specific tile event')
      .addIntegerOption(option =>
        option
          .setName('event_id')
          .setDescription('The tile event ID')
          .setRequired(true)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('progress')
      .setDescription('Check your progress in a tile event')
      .addIntegerOption(option =>
        option
          .setName('event_id')
          .setDescription('The tile event ID')
          .setRequired(true)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('leaderboard')
      .setDescription('View tile event leaderboard')
      .addIntegerOption(option =>
        option
          .setName('event_id')
          .setDescription('The tile event ID')
          .setRequired(true)
      )
  );

export async function execute(interaction, config) {
  await interaction.deferReply();

  const api = createApiClient(config.apiBase, config.apiKey);
  const subcommand = interaction.options.getSubcommand();

  try {
    switch (subcommand) {
      case 'list':
        await handleList(interaction, api);
        break;
      case 'info':
        await handleInfo(interaction, api);
        break;
      case 'progress':
        await handleProgress(interaction, api);
        break;
      case 'leaderboard':
        await handleLeaderboard(interaction, api);
        break;
    }
  } catch (error) {
    console.error('Tile event error:', error);
    
    const errorEmbed = new EmbedBuilder()
      .setColor(0xFF4444)
      .setTitle('❌ Error')
      .setDescription('Failed to fetch tile event data. Please try again later.')
      .setTimestamp();

    await interaction.editReply({ embeds: [errorEmbed] });
  }
}

/**
 * Handle /tileevent list
 */
async function handleList(interaction, api) {
  const data = await api.getTileEvents();
  
  if (!data.events || data.events.length === 0) {
    const noDataEmbed = new EmbedBuilder()
      .setColor(0xF5A623)
      .setTitle('🎮 Tile Events')
      .setDescription('No tile events are currently active.')
      .setTimestamp();

    return interaction.editReply({ embeds: [noDataEmbed] });
  }

  const activeEvents = data.events.filter(e => e.is_active);
  const endedEvents = data.events.filter(e => !e.is_active);

  const fields = [];

  if (activeEvents.length > 0) {
    const activeList = activeEvents.map(e => 
      `**#${e.id}** ${e.name}\n↳ ${e.tile_count} tiles • ${e.participant_count} participants`
    ).join('\n\n');
    
    fields.push({
      name: '🟢 Active Events',
      value: activeList,
    });
  }

  if (endedEvents.length > 0 && endedEvents.length <= 3) {
    const endedList = endedEvents.map(e => 
      `**#${e.id}** ${e.name} (ended)`
    ).join('\n');
    
    fields.push({
      name: '⚫ Past Events',
      value: endedList,
    });
  }

  const embed = new EmbedBuilder()
    .setColor(0xE8B4D8)
    .setTitle('🎮 Tile Events')
    .setDescription('Use `/tileevent info <event_id>` for details')
    .addFields(fields)
    .setFooter({ text: 'Yume Tools' })
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

/**
 * Handle /tileevent info
 */
async function handleInfo(interaction, api) {
  const eventId = interaction.options.getInteger('event_id');
  const data = await api.getTileEventDetails(eventId);

  if (!data.event) {
    const noDataEmbed = new EmbedBuilder()
      .setColor(0xFF4444)
      .setTitle('❌ Event Not Found')
      .setDescription(`No tile event found with ID **${eventId}**`)
      .setTimestamp();

    return interaction.editReply({ embeds: [noDataEmbed] });
  }

  const event = data.event;
  const tiles = data.tiles || [];

  const statusEmoji = event.is_active ? '🟢' : '⚫';
  const statusText = event.is_active ? 'Active' : 'Ended';

  const embed = new EmbedBuilder()
    .setColor(event.is_active ? 0x4CAF50 : 0x9E9E9E)
    .setTitle(`🎮 ${event.name}`)
    .setDescription(event.description || 'No description provided.')
    .addFields(
      { name: 'Status', value: `${statusEmoji} ${statusText}`, inline: true },
      { name: 'Tiles', value: tiles.length.toString(), inline: true },
      { name: 'Participants', value: event.participant_count?.toString() || '0', inline: true },
    )
    .setFooter({ text: `Event ID: ${eventId}` })
    .setTimestamp();

  // Show first few tiles as a preview
  if (tiles.length > 0) {
    const tilePreview = tiles.slice(0, 5).map((t, i) => {
      const icon = t.is_start ? '🏁' : t.is_end ? '🏆' : '▫️';
      return `${icon} **${i + 1}.** ${t.title}`;
    }).join('\n');
    
    embed.addFields({
      name: `📋 Tile Path Preview (${tiles.length} total)`,
      value: tilePreview + (tiles.length > 5 ? '\n... and more' : ''),
    });
  }

  await interaction.editReply({ embeds: [embed] });
}

/**
 * Handle /tileevent progress
 */
async function handleProgress(interaction, api) {
  const eventId = interaction.options.getInteger('event_id');
  const discordId = interaction.user.id;

  const data = await api.getTileEventProgress(eventId, discordId);

  if (!data.progress || data.progress.length === 0) {
    const noDataEmbed = new EmbedBuilder()
      .setColor(0xF5A623)
      .setTitle('🎮 Your Progress')
      .setDescription('You haven\'t started this tile event yet!\n\nVisit the website to begin your journey.')
      .setTimestamp();

    return interaction.editReply({ embeds: [noDataEmbed] });
  }

  const progress = data.progress[0];
  const tilesUnlocked = progress.tiles_unlocked?.length || 0;
  const totalTiles = data.total_tiles || tilesUnlocked;
  const percentage = totalTiles > 0 ? Math.round((tilesUnlocked / totalTiles) * 100) : 0;

  // Create progress bar
  const barLength = 10;
  const filledBars = Math.round((percentage / 100) * barLength);
  const progressBar = '█'.repeat(filledBars) + '░'.repeat(barLength - filledBars);

  const embed = new EmbedBuilder()
    .setColor(progress.completed_at ? 0xFFD700 : 0xE8B4D8)
    .setTitle(progress.completed_at ? '🏆 Event Completed!' : '🎮 Your Progress')
    .setDescription(`**Event:** ${data.event_name || `Event #${eventId}`}`)
    .addFields(
      { name: 'Current Tile', value: `#${progress.current_tile + 1}`, inline: true },
      { name: 'Tiles Completed', value: `${tilesUnlocked}/${totalTiles}`, inline: true },
      { name: 'Progress', value: `${progressBar} ${percentage}%`, inline: false },
    )
    .setTimestamp();

  if (progress.completed_at) {
    embed.addFields({
      name: '🎉 Completed On',
      value: new Date(progress.completed_at).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
    });
  }

  await interaction.editReply({ embeds: [embed] });
}

/**
 * Handle /tileevent leaderboard
 */
async function handleLeaderboard(interaction, api) {
  const eventId = interaction.options.getInteger('event_id');
  const data = await api.getTileEventProgress(eventId);

  if (!data.progress || data.progress.length === 0) {
    const noDataEmbed = new EmbedBuilder()
      .setColor(0xF5A623)
      .setTitle('🏆 Tile Event Leaderboard')
      .setDescription('No participants yet for this event.')
      .setTimestamp();

    return interaction.editReply({ embeds: [noDataEmbed] });
  }

  // Sort by tiles unlocked (descending) and completion date (ascending)
  const sorted = [...data.progress].sort((a, b) => {
    const aTiles = a.tiles_unlocked?.length || 0;
    const bTiles = b.tiles_unlocked?.length || 0;
    if (aTiles !== bTiles) return bTiles - aTiles;
    if (a.completed_at && b.completed_at) {
      return new Date(a.completed_at) - new Date(b.completed_at);
    }
    return a.completed_at ? -1 : b.completed_at ? 1 : 0;
  });

  const entries = sorted.slice(0, 10).map((p, i) => {
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
    const name = p.discord_username || p.global_name || `User ${p.discord_id}`;
    const tiles = p.tiles_unlocked?.length || 0;
    const completed = p.completed_at ? ' ✅' : '';
    return `${medal} **${name}** — ${tiles} tiles${completed}`;
  });

  const embed = new EmbedBuilder()
    .setColor(0xE8B4D8)
    .setTitle(`🏆 Tile Event Leaderboard`)
    .setDescription(entries.join('\n'))
    .addFields(
      { name: 'Event', value: data.event_name || `Event #${eventId}`, inline: true },
      { name: 'Participants', value: data.progress.length.toString(), inline: true },
    )
    .setFooter({ text: 'Yume Tools' })
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

