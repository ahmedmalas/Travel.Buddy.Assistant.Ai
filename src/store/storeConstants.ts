import packageMetadata from '../../package.json';
import { TEMPLATE_STORAGE_KEY, VAULT_STORAGE_KEY } from './vaultDomain';

export const LOCAL_STORAGE_KEY = 'travel-buddy:trip-state:v1';
export const LOCAL_SNAPSHOT_STORAGE_KEY = 'travel-buddy:trip-snapshots:v1';
export const HISTORY_LIMIT = 50;
export const UNPINNED_SNAPSHOT_LIMIT = 10;
export const BACKUP_VERSION = 6;
export const MIN_SUPPORTED_BACKUP_VERSION = 2;
export const DEAL_ENGINE_STORAGE_KEY = 'travel-buddy:deal-engine:v1';
export const SNAPSHOT_HISTORY_VERSION = 1;
export const APPLICATION_VERSION =
  typeof packageMetadata.version === 'string' ? packageMetadata.version : '0.0.0';
export const SNAPSHOT_LABEL_LIMIT = 60;
export const SNAPSHOT_NOTES_LIMIT = 500;
export const INTEGRITY_REPAIR_BACKUP_STORAGE_KEY = 'travel-buddy:integrity-repair-backups:v1';
export const INTEGRITY_HISTORY_STORAGE_KEY = 'travel-buddy:integrity-history:v1';
export const INTEGRITY_HISTORY_BASELINE_STORAGE_KEY = 'travel-buddy:integrity-history-baseline:v1';
export const INTEGRITY_HISTORY_VERSION = 1;
export const INTEGRITY_HISTORY_LIMIT = 20;
export const DEFAULT_LOCAL_STORAGE_CAPACITY_BYTES = 5 * 1024 * 1024;
export const AUTH_STORAGE_KEY = 'travel-buddy:auth-shell:v1';
export const SYNC_QUEUE_STORAGE_KEY = 'travel-buddy:sync-queue:v1';
export const NOTIFICATION_STORAGE_KEY = 'travel-buddy:notifications:v1';
export { VAULT_STORAGE_KEY, TEMPLATE_STORAGE_KEY };

export const STORAGE_KEYS = {
  activeTrip: LOCAL_STORAGE_KEY,
  snapshotHistory: LOCAL_SNAPSHOT_STORAGE_KEY,
  tripVault: VAULT_STORAGE_KEY,
  tripTemplates: TEMPLATE_STORAGE_KEY,
  authShell: AUTH_STORAGE_KEY,
  syncQueue: SYNC_QUEUE_STORAGE_KEY,
  notifications: NOTIFICATION_STORAGE_KEY,
  integrityHistory: INTEGRITY_HISTORY_STORAGE_KEY,
  integrityBaseline: INTEGRITY_HISTORY_BASELINE_STORAGE_KEY,
  integrityRepairBackups: INTEGRITY_REPAIR_BACKUP_STORAGE_KEY,
  dealEngine: DEAL_ENGINE_STORAGE_KEY,
} as const;
