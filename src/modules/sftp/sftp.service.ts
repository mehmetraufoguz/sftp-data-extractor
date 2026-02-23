import { Injectable, Logger } from '@nestjs/common';
import SftpClient from 'pure-js-sftp';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface RemoteFile {
  name: string;
  path: string;
  size: number;
  modifyTime: Date;
}

@Injectable()
export class SftpService {
  private readonly logger = new Logger(SftpService.name);
  private client: SftpClient | null = null;

  async connect(): Promise<void> {
    try {
      this.logger.log('Connecting to SFTP server...');
      
      this.client = new SftpClient();
      await this.client.connect({
        host: process.env.SFTP_HOST,
        port: parseInt(process.env.SFTP_PORT, 10),
        username: process.env.SFTP_USERNAME,
        password: process.env.SFTP_PASSWORD,
      });

      this.logger.log('Successfully connected to SFTP server');
    } catch (error) {
      this.logger.error('Failed to connect to SFTP server', error);
      throw error;
    }
  }

  async listFiles(remotePath: string): Promise<RemoteFile[]> {
    if (!this.client) {
      throw new Error('SFTP client not connected. Call connect() first.');
    }

    try {
      this.logger.log(`Listing files in remote path: ${remotePath}`);
      
      const files = await this.client.list(remotePath);
      
      // Filter only CSV files and map to RemoteFile interface
      const csvFiles = files
        .filter((file: any) => 
          file.type === '-' && // Regular file
          file.name.toLowerCase().endsWith('.csv')
        )
        .map((file: any) => ({
          name: file.name,
          path: path.posix.join(remotePath, file.name),
          size: parseInt(file.size, 10),
          modifyTime: new Date(file.modifyTime * 1000), // Convert Unix timestamp to Date
        }));

      this.logger.log(`Found ${csvFiles.length} CSV files`);
      return csvFiles;
    } catch (error) {
      this.logger.error(`Failed to list files in ${remotePath}`, error);
      throw error;
    }
  }

  async downloadFile(remotePath: string, localPath: string): Promise<void> {
    if (!this.client) {
      throw new Error('SFTP client not connected. Call connect() first.');
    }

    try {
      this.logger.log(`Downloading ${remotePath} to ${localPath}`);
      
      // Ensure local directory exists
      const localDir = path.dirname(localPath);
      await fs.mkdir(localDir, { recursive: true });

      // Download file using fastGet
      await this.client.fastGet(remotePath, localPath);

      this.logger.log(`Successfully downloaded ${remotePath}`);
    } catch (error) {
      this.logger.error(`Failed to download ${remotePath}`, error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.disconnect();
        this.client = null;
        this.logger.log('Disconnected from SFTP server');
      } catch (error) {
        this.logger.error('Error disconnecting from SFTP server', error);
        throw error;
      }
    }
  }
}
