/**
 * =============================================================================
 * YUME BOT - Discord Bot for Yume Tools
 * =============================================================================
 * 
 * Main entry point for the Discord bot. Handles:
 * - Bot initialization and event handling
 * - Slash command registration and execution
 * - Integration with yume-api for clan management
 * 
 * Designed to be deployed on Railway with environment variables.
 * 
 * @author Yume Tools Team
 */

import { Client, GatewayIntentBits, Collection, Events, REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readdirSync } from 'fs';

// Load environment variables
dotenv.config();

// ES module dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// =============================================================================
// CONFIGURATION
// =============================================================================

const config = {
  // Discord bot token (required)
  token: process.env.DISCORD_TOKEN,
  // Discord application client ID
  clientId: process.env.DISCORD_CLIENT_ID || '1446582844553035918',
  // Guild ID for development (optional - for instant command updates)
  guildId: process.env.DISCORD_GUILD_ID,
  // Yume API base URL
  apiBase: process.env.API_BASE_URL || 'https://api.itai.gg',
  // API authentication (if needed for bot actions)
  apiKey: process.env.API_KEY,
};

// Validate required configuration
if (!config.token) {
  console.error('❌ DISCORD_TOKEN environment variable is required!');
  process.exit(1);
}

// =============================================================================
// BOT INITIALIZATION
// =============================================================================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
  ],
});

// Collection to store commands
client.commands = new Collection();

// =============================================================================
// COMMAND LOADING
// =============================================================================

/**
 * Dynamically load all commands from the commands directory
 */
async function loadCommands() {
  const commandsPath = join(__dirname, 'commands');
  
  try {
    const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
      const filePath = join(commandsPath, file);
      const command = await import(`file://${filePath}`);
      
      if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        console.log(`✅ Loaded command: ${command.data.name}`);
      } else {
        console.warn(`⚠️ Command ${file} is missing required "data" or "execute" property`);
      }
    }
  } catch (error) {
    console.error('Error loading commands:', error);
  }
}

// =============================================================================
// EVENT HANDLERS
// =============================================================================

// Bot ready event
client.once(Events.ClientReady, (readyClient) => {
  console.log('═'.repeat(50));
  console.log(`🌸 Yume Bot is online!`);
  console.log(`📛 Logged in as: ${readyClient.user.tag}`);
  console.log(`🏠 Serving ${readyClient.guilds.cache.size} guild(s)`);
  console.log(`🔗 API: ${config.apiBase}`);
  console.log('═'.repeat(50));
  
  // Set bot status
  readyClient.user.setPresence({
    activities: [{ name: '🌸 /help for commands', type: 0 }],
    status: 'online',
  });
});

// Interaction handler (slash commands)
client.on(Events.InteractionCreate, async (interaction) => {
  // Only handle chat input commands
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`❌ No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction, config);
  } catch (error) {
    console.error(`Error executing ${interaction.commandName}:`, error);
    
    const errorMessage = {
      content: '❌ There was an error executing this command!',
      ephemeral: true,
    };
    
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorMessage);
    } else {
      await interaction.reply(errorMessage);
    }
  }
});

// Handle autocomplete interactions
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isAutocomplete()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command || !command.autocomplete) return;

  try {
    await command.autocomplete(interaction, config);
  } catch (error) {
    console.error(`Autocomplete error for ${interaction.commandName}:`, error);
  }
});

// =============================================================================
// START BOT
// =============================================================================

async function start() {
  console.log('🚀 Starting Yume Bot...');
  
  // Load commands
  await loadCommands();
  
  // Login to Discord
  await client.login(config.token);
}

start().catch(console.error);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down Yume Bot...');
  client.destroy();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Received SIGTERM, shutting down...');
  client.destroy();
  process.exit(0);
});

