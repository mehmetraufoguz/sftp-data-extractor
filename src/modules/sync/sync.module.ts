import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { SyncService } from './sync.service';
import { FileRecord } from '../../entities/file-record.entity';
import { SftpModule } from '../sftp/sftp.module';
import { TelegramModule } from '../telegram/telegram.module';

@Module({
  imports: [
    MikroOrmModule.forFeature([FileRecord]),
    SftpModule,
    TelegramModule,
  ],
  providers: [SyncService],
  exports: [SyncService],
})
export class SyncModule {}
