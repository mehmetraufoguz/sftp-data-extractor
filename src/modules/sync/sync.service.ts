import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { FileRecord, FileStatus } from '../../entities/file-record.entity';
import { SftpService, RemoteFile } from '../sftp/sftp.service';
import { TelegramService } from '../telegram/telegram.service';
import { SyncSummary } from '../telegram/interfaces/sync-summary.interface';
import * as path from 'path';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    @InjectRepository(FileRecord)
    private readonly fileRecordRepository: EntityRepository<FileRecord>,
    private readonly em: EntityManager,
    private readonly sftpService: SftpService,
    private readonly telegramService: TelegramService,
  ) {}

  async performSync(): Promise<void> {
    this.logger.log('Starting SFTP sync...');

    const summary: SyncSummary = {
      timestamp: new Date(),
      newFiles: [],
      modifiedFiles: [],
      deletedFiles: [],
      unchangedFiles: [],
      errors: [],
    };

    try {
      // Step 1: Connect to SFTP
      await this.sftpService.connect();

      // Step 2: List remote CSV files
      const remoteFiles = await this.sftpService.listFiles(
        process.env.SFTP_TARGET_FOLDER,
      );

      // Step 3: Get existing file records from database
      const existingRecords = await this.fileRecordRepository.findAll();
      
      // Create a map for quick lookup by original filename and sftp path
      const existingFilesMap = new Map<string, FileRecord>();
      existingRecords.forEach(record => {
        const key = `${record.sftpPath}`;
        existingFilesMap.set(key, record);
      });

      // Step 4: Process each remote file
      for (const remoteFile of remoteFiles) {
        try {
          const existingRecord = existingFilesMap.get(remoteFile.path);

          if (!existingRecord) {
            // New file - download it
            await this.downloadAndSaveFile(remoteFile, FileStatus.NEW, summary);
          } else {
            // File exists - check if modified
            const isModified = this.isFileModified(remoteFile, existingRecord);
            
            if (isModified) {
              // File modified - download new version
              await this.downloadAndSaveFile(remoteFile, FileStatus.MODIFIED, summary);
            } else {
              // File unchanged
              summary.unchangedFiles.push(existingRecord.storedPath);
              this.logger.log(`File unchanged: ${remoteFile.name}`);
            }

            // Remove from map (remaining entries are deleted files)
            existingFilesMap.delete(remoteFile.path);
          }
        } catch (error) {
          const errorMsg = `Error processing ${remoteFile.name}: ${error.message}`;
          this.logger.error(errorMsg);
          summary.errors.push(errorMsg);
        }
      }

      // Step 5: Mark remaining files as deleted (they don't exist on SFTP anymore)
      for (const [, record] of existingFilesMap) {
        if (record.status !== FileStatus.DELETED) {
          record.status = FileStatus.DELETED;
          this.em.persist(record);
          summary.deletedFiles.push(record.originalFilename);
          this.logger.log(`File marked as deleted: ${record.originalFilename}`);
        }
      }
      await this.em.flush();

      // Step 6: Send summary to Telegram
      await this.telegramService.sendSummary(summary);

      this.logger.log('SFTP sync completed successfully');
    } catch (error) {
      const errorMsg = `Sync failed: ${error.message}`;
      this.logger.error(errorMsg, error.stack);
      summary.errors.push(errorMsg);

      // Try to send error summary to Telegram
      try {
        await this.telegramService.sendSummary(summary);
      } catch (telegramError) {
        this.logger.error('Failed to send error summary to Telegram', telegramError);
      }
    } finally {
      // Step 7: Always disconnect from SFTP
      try {
        await this.sftpService.disconnect();
      } catch (disconnectError) {
        this.logger.error('Error disconnecting from SFTP', disconnectError);
      }
    }
  }

  private async downloadAndSaveFile(
    remoteFile: RemoteFile,
    status: FileStatus,
    summary: SyncSummary,
  ): Promise<void> {
    const storedFilename = this.generateStoragePath(remoteFile.name);
    const localPath = path.join('data', storedFilename);

    // Download file
    await this.sftpService.downloadFile(remoteFile.path, localPath);

    // Create file record
    const fileRecord = this.fileRecordRepository.create({
      filename: storedFilename,
      originalFilename: remoteFile.name,
      storedPath: localPath,
      sftpPath: remoteFile.path,
      fileSize: remoteFile.size,
      lastModifiedOnSftp: remoteFile.modifyTime,
      downloadedAt: new Date(),
      status: status,
    });

    this.em.persist(fileRecord);
    await this.em.flush();

    // Update summary
    if (status === FileStatus.NEW) {
      summary.newFiles.push(localPath);
      this.logger.log(`New file downloaded: ${remoteFile.name} -> ${storedFilename}`);
    } else if (status === FileStatus.MODIFIED) {
      summary.modifiedFiles.push(localPath);
      this.logger.log(`Modified file downloaded: ${remoteFile.name} -> ${storedFilename}`);
    }
  }

  private isFileModified(remoteFile: RemoteFile, existingRecord: FileRecord): boolean {
    // Compare modification time (we're using modification time only per user's choice)
    const remoteModTime = remoteFile.modifyTime.getTime();
    const existingModTime = existingRecord.lastModifiedOnSftp.getTime();

    return remoteModTime > existingModTime;
  }

  private generateStoragePath(originalFilename: string): string {
    const now = new Date();
    const timestamp = now
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\..+/, '')
      .replace('T', '_');

    const ext = path.extname(originalFilename);
    const basename = path.basename(originalFilename, ext);

    return `${basename}_${timestamp}${ext}`;
  }
}
