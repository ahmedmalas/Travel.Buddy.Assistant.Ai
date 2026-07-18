/**
 * Slice 45 — Store domain module index.
 * Public behaviour remains on `useTripStore`; these modules hold extracted/new domain logic.
 */
export {
  STORAGE_KEYS,
  LOCAL_STORAGE_KEY,
  VAULT_STORAGE_KEY,
  TEMPLATE_STORAGE_KEY,
  AUTH_STORAGE_KEY,
  SYNC_QUEUE_STORAGE_KEY,
  NOTIFICATION_STORAGE_KEY,
  BACKUP_VERSION,
  APPLICATION_VERSION,
} from '../storeConstants';
export {
  SUPABASE_ADAPTER_PLAN,
  createLocalDataRepositories,
  createSupabaseDataRepositories,
} from '../repositories';
export * as authShell from '../auth/authShell';
export * as liveAuth from '../auth/liveAuth';
export * as syncEngine from '../sync/syncEngine';
export * as cloudSync from '../sync/cloudSync';
export * as notificationCentre from '../notifications/notificationCentre';
export * as commandCentre from '../commandCentre/commandCentre';
export * as collaborationLifecycle from '../collaboration/collaborationLifecycle';
export * as cloudCollaboration from '../collaboration/cloudCollaboration';
export * as secureStorage from '../documents/secureStorage';
export * as accountSettings from '../settings/accountSettings';

export {
  migrateVaultState,
  validateVaultImportPayload,
  createVaultTrip,
  toVaultTrip,
} from '../vaultDomain';
export { canPerform, filterAndSortVaultTrips, searchVault } from '../vaultCalculations';
export { validateTripSetup, migrateTrip, sanitizeTrip } from '../tripDomain';
