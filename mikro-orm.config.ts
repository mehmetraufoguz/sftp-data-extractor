import { defineConfig } from '@mikro-orm/better-sqlite';
import { FileRecord } from './src/entities/file-record.entity';

const config = defineConfig({
  entities: [FileRecord],
  dbName: process.env.DATABASE_PATH || 'data/tracking.db',
  debug: process.env.NODE_ENV === 'development',
  allowGlobalContext: true, // Allow EM usage in scheduled tasks
  migrations: {
    path: './migrations',
    pathTs: './migrations',
    glob: '!(*.d).{js,ts}',
    transactional: true,
    disableForeignKeys: false,
    allOrNothing: true,
    dropTables: true,
    safe: false,
    snapshot: true,
    emit: 'ts',
  },
});

export default config;
