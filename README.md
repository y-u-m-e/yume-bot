# 🌸 Yume Bot

Discord bot for Yume Tools - integrates with the [yume-api](https://api.itai.gg) for attendance tracking, tile events, and clan management.

## Features

- **📊 Attendance Tracking** - View leaderboards and look up player attendance
- **🎮 Tile Events** - Check progress, view leaderboards for tile-based events
- **🔧 Admin Tools** - Log attendance records (permission-restricted)
- **🔗 API Integration** - Real-time data from your clan management system

## Commands

| Command | Description |
|---------|-------------|
| `/ping` | Check bot latency and API status |
| `/help` | Display available commands |
| `/leaderboard` | View event attendance leaderboard |
| `/lookup <name>` | Look up a player's attendance history |
| `/tileevent list` | View active tile events |
| `/tileevent info <id>` | View tile event details |
| `/tileevent progress <id>` | Check your progress in an event |
| `/tileevent leaderboard <id>` | View tile event rankings |
| `/record` | Log attendance for an event (Admin) |

## Setup

### 1. Create Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and name it
3. Go to **Bot** tab → Click "Add Bot"
4. Enable these **Privileged Gateway Intents**:
   - Server Members Intent
5. Copy your **Bot Token** (keep it secret!)
6. Go to **OAuth2** → **URL Generator**:
   - Scopes: `bot`, `applications.commands`
   - Bot Permissions: `Send Messages`, `Embed Links`, `Use Slash Commands`
7. Use the generated URL to invite the bot to your server

### 2. Environment Variables

Create a `.env` file in the project root:

```bash
# Discord Bot Token (Required)
DISCORD_TOKEN=your_bot_token_here

# Discord Application Client ID
DISCORD_CLIENT_ID=1446582844553035918

# Guild ID for development (Optional - for instant command updates)
DISCORD_GUILD_ID=your_guild_id_here

# Yume API Configuration
API_BASE_URL=https://api.itai.gg

# API Key for authenticated requests (Optional)
API_KEY=
```

### 3. Install & Run

```bash
# Install dependencies
npm install

# Deploy slash commands (run once, or after command changes)
npm run deploy-commands

# Start the bot
npm start

# Development mode (auto-restart on changes)
npm run dev
```

## Deploying to Railway

### 1. Create Railway Project

1. Go to [Railway](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select the `yume-bot` repository

### 2. Add Environment Variables

In Railway dashboard → your project → **Variables**:

| Variable | Description |
|----------|-------------|
| `DISCORD_TOKEN` | Your bot token |
| `DISCORD_CLIENT_ID` | Your app's client ID |
| `API_BASE_URL` | `https://api.itai.gg` |
| `API_KEY` | (Optional) API key for write operations |

### 3. Deploy

Railway will automatically:
1. Detect the Node.js project
2. Install dependencies
3. Start the bot using `npm start`

The bot will auto-restart if it crashes and redeploy when you push to GitHub.

## Project Structure

```
yume-bot/
├── src/
│   ├── index.js              # Bot entry point
│   ├── deploy-commands.js    # Command registration script
│   ├── commands/             # Slash commands
│   │   ├── help.js
│   │   ├── leaderboard.js
│   │   ├── lookup.js
│   │   ├── ping.js
│   │   ├── record.js
│   │   └── tileevent.js
│   └── lib/
│       └── api.js            # API client
├── package.json
├── railway.json              # Railway deployment config
├── nixpacks.toml             # Build configuration
└── README.md
```

## Adding New Commands

1. Create a new file in `src/commands/`:

```javascript
import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('mycommand')
  .setDescription('My custom command');

export async function execute(interaction, config) {
  await interaction.reply('Hello!');
}
```

2. Run `npm run deploy-commands` to register the command

## API Integration

The bot connects to `yume-api` for:
- Attendance data (`/attendance`, `/attendance/records`)
- Tile events (`/tile-events`)
- User information (`/admin/users`)

See [API Documentation](https://api.itai.gg/docs) for full endpoint details.

## License

MIT © Yume Tools Team

