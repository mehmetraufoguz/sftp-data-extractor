import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SyncService } from '../sync/sync.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(private readonly syncService: SyncService) {}

  // Run at 03:10 AM EET (10 minutes after 03:00 upload time)
  @Cron('10 3 * * *', {
    timeZone: process.env.TIMEZONE || 'Europe/Kiev',
  })
  async handleSyncAt0310() {
    this.logger.log('Running scheduled sync at 03:10 EET');
    await this.executeSyncWithErrorHandling();
  }

  // Run at 09:10 AM EET (10 minutes after 09:00 upload time)
  @Cron('10 9 * * *', {
    timeZone: process.env.TIMEZONE || 'Europe/Kiev',
  })
  async handleSyncAt0910() {
    this.logger.log('Running scheduled sync at 09:10 EET');
    await this.executeSyncWithErrorHandling();
  }

  // Run at 15:10 PM EET (10 minutes after 15:00 upload time)
  @Cron('10 15 * * *', {
    timeZone: process.env.TIMEZONE || 'Europe/Kiev',
  })
  async handleSyncAt1510() {
    this.logger.log('Running scheduled sync at 15:10 EET');
    await this.executeSyncWithErrorHandling();
  }

  // Run at 21:10 PM EET (10 minutes after 21:00 upload time)
  @Cron('10 21 * * *', {
    timeZone: process.env.TIMEZONE || 'Europe/Kiev',
  })
  async handleSyncAt2110() {
    this.logger.log('Running scheduled sync at 21:10 EET');
    await this.executeSyncWithErrorHandling();
  }

  private async executeSyncWithErrorHandling(): Promise<void> {
    try {
      await this.syncService.performSync();
      this.logger.log('Scheduled sync completed successfully');
    } catch (error) {
      this.logger.error('Scheduled sync failed', error.stack);
      // Error is already handled and logged in SyncService
      // No need to throw here as we don't want to crash the scheduler
    }
  }
}
