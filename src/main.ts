import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import './config/env.types'; // Import for type-safe process.env

const logger = new Logger('Bootstrap');

async function bootstrap() {
  try {
    // Create application context (no HTTP server)
    const app = await NestFactory.createApplicationContext(AppModule, {
      logger: ['log', 'error', 'warn', 'debug', 'verbose'],
    });

    // Enable graceful shutdown
    app.enableShutdownHooks();

    logger.log('🚀 SFTP Data Extractor Service started');
    logger.log(`📅 Scheduled syncs at: 03:10, 09:10, 15:10, 21:10 ${process.env.TIMEZONE}`);
    logger.log(`📂 Data folder: ${process.env.DATABASE_PATH}`);
    logger.log(`🤖 Telegram bot configured for chat: ${process.env.TELEGRAM_CHAT_ID}`);

    // Handle termination signals
    process.on('SIGTERM', async () => {
      logger.log('SIGTERM signal received: closing application');
      await app.close();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      logger.log('SIGINT signal received: closing application');
      await app.close();
      process.exit(0);
    });

    // Keep process alive
    await app.init();
  } catch (error) {
    logger.error('Failed to start application', error);
    process.exit(1);
  }
}

bootstrap();
