import { Entity, PrimaryKey, Property, Enum } from '@mikro-orm/core';

export enum FileStatus {
  NEW = 'new',
  UNCHANGED = 'unchanged',
  MODIFIED = 'modified',
  DELETED = 'deleted',
}

@Entity()
export class FileRecord {
  @PrimaryKey()
  id!: number;

  @Property()
  filename!: string; // Timestamped filename stored locally

  @Property()
  originalFilename!: string; // Original filename from SFTP

  @Property()
  storedPath!: string; // Full path where file is stored locally

  @Property()
  sftpPath!: string; // Remote path on SFTP server

  @Property()
  fileSize!: number; // File size in bytes

  @Property()
  lastModifiedOnSftp!: Date; // Last modification time on SFTP server

  @Property()
  downloadedAt: Date = new Date(); // When the file was downloaded

  @Enum(() => FileStatus)
  status: FileStatus = FileStatus.NEW;
}
