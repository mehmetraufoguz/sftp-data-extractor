import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Bot, InputFile } from 'grammy';
import { SyncSummary } from './interfaces/sync-summary.interface';

@Injectable()
export class TelegramService implements OnModuleInit {
  private readonly logger = new Logger(TelegramService.name);
  private bot: Bot;
  private chatId: string;

  async onModuleInit() {
    await this.init();
  }

  async init(): Promise<void> {
    try {
      this.logger.log('Initializing Telegram bot...');
      
      this.bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);
      this.chatId = process.env.TELEGRAM_CHAT_ID;

      // Test bot connection
      const me = await this.bot.api.getMe();
      this.logger.log(`Telegram bot initialized: @${me.username}`);
    } catch (error) {
      this.logger.error('Failed to initialize Telegram bot', error);
      throw error;
    }
  }

  async sendSummary(summary: SyncSummary): Promise<void> {
    try {
      const message = this.formatSummaryMessage(summary);
      
      await this.bot.api.sendMessage(this.chatId, message, {
        parse_mode: 'HTML',
      });

      this.logger.log('Summary sent to Telegram');

      // Send files if there are new or modified files
      const filesToSend = [...summary.newFiles, ...summary.modifiedFiles];
      for (const filePath of filesToSend) {
        await this.sendFile(filePath, `📄 ${filePath.split('/').pop()}`);
      }
    } catch (error) {
      this.logger.error('Failed to send summary to Telegram', error);
      throw error;
    }
  }

  async sendFile(filePath: string, caption: string): Promise<void> {
    try {
      await this.bot.api.sendDocument(
        this.chatId,
        new InputFile(filePath),
        { caption }
      );

      this.logger.log(`File sent to Telegram: ${filePath}`);
    } catch (error) {
      this.logger.error(`Failed to send file ${filePath} to Telegram`, error);
      throw error;
    }
  }

  private formatSummaryMessage(summary: SyncSummary): string {
    const timestamp = summary.timestamp.toLocaleString('en-US', {
      timeZone: process.env.TIMEZONE,
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    let message = `<b>📊 SFTP Sync Report</b>\n`;
    message += `🕐 <i>${timestamp}</i>\n\n`;

    // Summary counts
    const totalChanges = 
      summary.newFiles.length + 
      summary.modifiedFiles.length + 
      summary.deletedFiles.length;

    if (totalChanges === 0) {
      message += `✅ <b>No changes detected</b>\n`;
      message += `📁 ${summary.unchangedFiles.length} file(s) unchanged\n`;
    } else {
      if (summary.newFiles.length > 0) {
        message += `🆕 <b>New files:</b> ${summary.newFiles.length}\n`;
        summary.newFiles.forEach(file => {
          const filename = file.split('/').pop();
          message += `   • ${filename}\n`;
        });
        message += '\n';
      }

      if (summary.modifiedFiles.length > 0) {
        message += `📝 <b>Modified files:</b> ${summary.modifiedFiles.length}\n`;
        summary.modifiedFiles.forEach(file => {
          const filename = file.split('/').pop();
          message += `   • ${filename}\n`;
        });
        message += '\n';
      }

      if (summary.deletedFiles.length > 0) {
        message += `🗑 <b>Deleted files:</b> ${summary.deletedFiles.length}\n`;
        summary.deletedFiles.forEach(file => {
          message += `   • ${file}\n`;
        });
        message += '\n';
      }

      if (summary.unchangedFiles.length > 0) {
        message += `✅ <b>Unchanged:</b> ${summary.unchangedFiles.length}\n`;
      }
    }

    if (summary.errors.length > 0) {
      message += `\n⚠️ <b>Errors:</b>\n`;
      summary.errors.forEach(error => {
        message += `   • ${error}\n`;
      });
    }

    return message;
  }
}
