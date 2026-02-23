# SFTP Data Extractor

A standalone NestJS service that automatically synchronizes CSV files from an SFTP server, tracks changes with SQLite, and sends batch summaries to Telegram.

## Overview

This service is designed for B2B businesses that receive stock lists via SFTP. Instead of manually downloading files, this automated service:

- 🔄 Syncs files 4 times daily (03:10, 09:10, 15:10, 21:10 EET)
- 📊 Tracks file changes (new, modified, deleted, unchanged)
- 💾 Stores all file versions with timestamps
- 📱 Sends summary reports and files to Telegram
- 🗄️ Uses SQLite database for tracking history

## Features

- **Scheduled Syncs**: Runs 10 minutes after files are published (giving upload time buffer)
- **Change Detection**: Tracks files using modification time comparison
- **File Versioning**: All downloaded files are timestamped and archived
- **Telegram Integration**: Batch reports after each sync with file attachments
- **Type-Safe Configuration**: Environment variables validated with Joi
- **Standalone Service**: No HTTP server - pure background scheduler
- **Error Handling**: Comprehensive error logging and Telegram error notifications

## Architecture

- **SFTP Module**: Connects to server, lists files, downloads CSV files
- **Sync Module**: Orchestrates file comparison and download logic
- **Telegram Module**: Sends formatted summaries and file attachments
- **Scheduler Module**: Manages 4 daily cron jobs with EET timezone
- **Database**: MikroORM with SQLite for file tracking

## Installation

```bash
$ pnpm install
```

## Configuration

1. Copy the example environment file:
```bash
$ cp .env.example .env
```

2. Fill in your credentials in `.env`:

```env
# SFTP Configuration
SFTP_HOST=your-sftp-server.com
SFTP_PORT=22
SFTP_USERNAME=your_username
SFTP_PASSWORD=your_password
SFTP_TARGET_FOLDER=/path/to/stock/files

# Telegram Configuration
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
TELEGRAM_CHAT_ID=123456789

# Application Configuration
TIMEZONE=Europe/Kiev
DATABASE_PATH=data/tracking.db
```

### Getting Telegram Credentials

1. **Bot Token**: 
   - Message [@BotFather](https://t.me/botfather) on Telegram
   - Send `/newbot` and follow instructions
   - Copy the token provided

2. **Chat ID**:
   - Message [@userinfobot](https://t.me/userinfobot) on Telegram
   - Copy your user ID
   - Or use a group chat ID to send to a group

## Running the Service

```bash
# Development mode (with auto-reload)
$ pnpm run start:dev

# Production mode
$ pnpm run start:prod

# Build for production
$ pnpm run build
```

## Sync Schedule

Files are synchronized at the following times (EET timezone):
- **03:10** - Morning batch
- **09:10** - Mid-morning batch  
- **15:10** - Afternoon batch
- **21:10** - Evening batch

*10-minute buffer after upload times (03:00, 09:00, 15:00, 21:00) ensures files are fully uploaded before sync.*

## File Storage

Downloaded files are stored in the `data/` folder with timestamps:

```
data/
├── tracking.db                           # SQLite database
├── stocklist_20260223_031045.csv        # Original filename + timestamp
├── stocklist_20260223_091032.csv
└── ...
```

## Database Schema

The `FileRecord` entity tracks:
- `id`: Primary key
- `filename`: Timestamped filename (stored locally)
- `originalFilename`: Original name from SFTP
- `storedPath`: Full local path
- `sftpPath`: Remote path on SFTP
- `fileSize`: File size in bytes
- `lastModifiedOnSftp`: Modification time on SFTP
- `downloadedAt`: When downloaded
- `status`: `new`, `unchanged`, `modified`, or `deleted`

## Telegram Notifications

After each sync, you'll receive a formatted summary:

```
📊 SFTP Sync Report
🕐 Feb 23, 2026, 3:10 AM

🆕 New files: 2
   • product_list.csv
   • inventory.csv

📝 Modified files: 1
   • stocklist.csv

✅ Unchanged: 5

⚠️ Errors:
   • None
```

New and modified files are automatically sent as attachments.

## Monitoring

Check logs for sync activity:

```bash
# View real-time logs in development
$ pnpm run start:dev

# Production logs (using PM2 or similar)
$ pm2 logs sftp-extractor
```

## Production Deployment

Using PM2 (recommended):

```bash
# Install PM2
$ npm install -g pm2

# Build the project
$ pnpm run build

# Start with PM2
$ pm2 start dist/src/main.js --name sftp-extractor

# Save PM2 configuration
$ pm2 save

# Setup auto-restart on reboot
$ pm2 startup
```

## Troubleshooting

### SFTP Connection Failed
- Verify credentials in `.env`
- Check SFTP server accessibility and port
- Ensure IP is whitelisted if required

### Telegram Not Sending
- Verify bot token is correct
- Check chat ID matches your user/group
- Ensure bot is started (send `/start` to your bot)
- For groups, bot must be added as member

### Database Errors
- Ensure `data/` folder exists and is writable
- Check disk space availability
- Verify MikroORM migrations are up to date

### Timezone Issues
- Confirm `TIMEZONE` is set correctly (default: `Europe/Kiev`)
- Verify system timezone if issues persist

## Manual Database Inspection

```bash
# Open SQLite database
$ sqlite3 data/tracking.db

# List all tracked files
sqlite> SELECT * FROM file_record ORDER BY downloaded_at DESC LIMIT 10;

# Check deleted files
sqlite> SELECT * FROM file_record WHERE status = 'deleted';
```

## Project Structure

```
src/
├── config/
│   ├── env.schema.ts          # Joi validation schema
│   └── env.types.ts           # TypeScript type definitions
├── entities/
│   └── file-record.entity.ts  # MikroORM entity
├── modules/
│   ├── sftp/                  # SFTP connection & file operations
│   ├── telegram/              # Telegram bot & messaging
│   ├── sync/                  # File synchronization logic
│   └── scheduler/             # Cron job scheduling
├── app.module.ts              # Root module with all imports
└── main.ts                    # Standalone application bootstrap
```

## Technologies

- **NestJS** - Framework
- **MikroORM** - Database ORM
- **SQLite** - Database
- **pure-js-sftp** - SFTP client
- **grammy** - Telegram bot framework
- **Joi** - Environment validation
- **TypeScript** - Type safety

## License

MIT

## Support

For issues or questions, please open an issue in the repository.

