import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  // SFTP Configuration
  SFTP_HOST: Joi.string().required().description('SFTP server hostname'),
  SFTP_PORT: Joi.number().default(22).description('SFTP server port'),
  SFTP_USERNAME: Joi.string().required().description('SFTP username'),
  SFTP_PASSWORD: Joi.string().required().description('SFTP password'),
  SFTP_TARGET_FOLDER: Joi.string()
    .required()
    .description('Remote folder path containing CSV files'),

  // Telegram Configuration
  TELEGRAM_BOT_TOKEN: Joi.string()
    .required()
    .description('Telegram bot token from BotFather'),
  TELEGRAM_CHAT_ID: Joi.string()
    .required()
    .description('Telegram chat ID to send messages'),

  // Application Configuration
  TIMEZONE: Joi.string()
    .default('Europe/Kiev')
    .description('Timezone for cron jobs (EET)'),
  DATABASE_PATH: Joi.string()
    .default('data/tracking.db')
    .description('SQLite database file path'),

  // Node Environment
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
});
