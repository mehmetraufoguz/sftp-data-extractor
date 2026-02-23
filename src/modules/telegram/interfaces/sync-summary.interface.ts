export interface SyncSummary {
  timestamp: Date;
  newFiles: string[];
  modifiedFiles: string[];
  deletedFiles: string[];
  unchangedFiles: string[];
  errors: string[];
}
