/**
 * =============================================================================
 * DEPLOY SLASH COMMANDS
 * =============================================================================
 * 
 * This script registers/updates slash commands with Discord.
 * Run this whenever you add, remove, or modify commands.
 * 
 * Usage:
 *   npm run deploy-commands
 * 
 * For guild-specific deployment (instant updates during development):
 *   Set DISCORD_GUILD_ID environment variable
 * 
 * For global deployment (takes up to 1 hour to propagate):
 *   Leave DISCORD_GUILD_ID unset
 * 
 * @author Yume Tools Team
 */

import { REST, Routes } from 'discord.js';
import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// =============================================================================
// CONFIGURATION
// =============================================================================

const config = {
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.DISCORD_CLIENT_ID || '1446582844553035918',
  guildId: process.env.DISCORD_GUILD_ID, // Optional: for guild-specific deployment
};

if (!config.token) {
  console.error('❌ DISCORD_TOKEN environment variable is required!');
  process.exit(1);
}

// =============================================================================
// LOAD COMMANDS
// =============================================================================

const commands = [];
const commandsPath = join(__dirname, 'commands');
const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));

console.log('📦 Loading commands...');

for (const file of commandFiles) {
  const filePath = join(commandsPath, file);
  const command = await import(`file://${filePath}`);
  
  if ('data' in command && 'execute' in command) {
    commands.push(command.data.toJSON());
    console.log(`  ✅ ${command.data.name}`);
  } else {
    console.warn(`  ⚠️ ${file} is missing required "data" or "execute" property`);
  }
}

// =============================================================================
// DEPLOY
// =============================================================================

const rest = new REST().setToken(config.token);

console.log('\n🚀 Deploying commands...');

try {
  let result;
  
  if (config.guildId) {
    // Guild-specific deployment (instant updates)
    console.log(`📍 Deploying to guild: ${config.guildId}`);
    result = await rest.put(
      Routes.applicationGuildCommands(config.clientId, config.guildId),
      { body: commands },
    );
  } else {
    // Global deployment (can take up to 1 hour)
    console.log('🌍 Deploying globally (may take up to 1 hour to propagate)');
    result = await rest.put(
      Routes.applicationCommands(config.clientId),
      { body: commands },
    );
  }

  console.log(`\n✅ Successfully deployed ${result.length} command(s)!`);
  
  // List deployed commands
  console.log('\n📋 Deployed commands:');
  result.forEach(cmd => {
    console.log(`  /${cmd.name} - ${cmd.description}`);
  });

} catch (error) {
  console.error('❌ Error deploying commands:', error);
  process.exit(1);
}

