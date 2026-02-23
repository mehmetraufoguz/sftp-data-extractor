import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { envValidationSchema } from './config/env.schema';
import mikroOrmConfig from '../mikro-orm.config';
import { SftpModule } from './modules/sftp/sftp.module';
import { TelegramModule } from './modules/telegram/telegram.module';
import { SyncModule } from './modules/sync/sync.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module';

@Module({
  imports: [
    // Configuration with validation
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),

    // Scheduler for cron jobs
    ScheduleModule.forRoot(),

    // MikroORM database
    MikroOrmModule.forRoot(mikroOrmConfig),

    // Feature modules
    SftpModule,
    TelegramModule,
    SyncModule,
    SchedulerModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
