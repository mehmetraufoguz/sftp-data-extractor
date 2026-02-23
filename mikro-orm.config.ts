import { defineConfig } from '@mikro-orm/better-sqlite';
import { FileRecord } from './src/entities/file-record.entity';

const config = defineConfig({
  entities: [FileRecord],
  dbName: process.env.DATABASE_PATH || 'data/tracking.db',
  debug: process.env.NODE_ENV === 'development',
  allowGlobalContext: true, // Allow EM usage in scheduled tasks
});

export default config;
