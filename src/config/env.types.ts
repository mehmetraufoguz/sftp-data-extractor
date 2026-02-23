declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // SFTP Configuration
      SFTP_HOST: string;
      SFTP_PORT: string;
      SFTP_USERNAME: string;
      SFTP_PASSWORD: string;
      SFTP_TARGET_FOLDER: string;

      // Telegram Configuration
      TELEGRAM_BOT_TOKEN: string;
      TELEGRAM_CHAT_ID: string;

      // Application Configuration
      TIMEZONE: string;
      DATABASE_PATH: string;

      // Node Environment
      NODE_ENV: 'development' | 'production' | 'test';
    }
  }
}

export {};
