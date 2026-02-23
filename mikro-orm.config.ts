import { Options } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { FileRecord } from './src/entities/file-record.entity';

const config: Options = {
  entities: [FileRecord],
  dbName: process.env.DATABASE_PATH || 'data/tracking.db',
  driver: SqliteDriver,
  debug: process.env.NODE_ENV === 'development',
  allowGlobalContext: true, // Allow EM usage in scheduled tasks
};

export default config;
