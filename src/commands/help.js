/**
 * /help - Display available commands and bot info
 */

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription('Display available commands and bot information');

export async function execute(interaction) {
  const embed = new EmbedBuilder()
    .setColor(0xE8B4D8)
    .setTitle('🌸 Yume Bot Commands')
    .setDescription('Your companion for clan event tracking and management!')
    .addFields(
      {
        name: '📊 Attendance',
        value: [
          '`/leaderboard` - View event attendance leaderboard',
          '`/lookup <name>` - Look up a player\'s attendance history',
          '`/record` - Log attendance for an event (Admin)',
        ].join('\n'),
      },
      {
        name: '🎮 Tile Events',
        value: [
          '`/tileevent list` - View active tile events',
          '`/tileevent progress <event>` - Check your progress',
          '`/tileevent leaderboard <event>` - View event leaderboard',
        ].join('\n'),
      },
      {
        name: '🔧 Utility',
        value: [
          '`/ping` - Check bot and API status',
          '`/help` - Show this help message',
        ].join('\n'),
      },
    )
    .setFooter({ text: 'Yume Tools • github.com/yume-tools' })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

