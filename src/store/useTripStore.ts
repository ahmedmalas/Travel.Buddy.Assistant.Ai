import { useEffect, useMemo, useRef, useState } from 'react';
import packageMetadata from '../../package.json';

export type TripStop = {
  id: string;
  title: string;
  day: number;
  order: number;
  notes: string;
};

export type TripData = {
  tripName: string;
  stops: TripStop[];
};

type TripBackup = {
  schema: 'travel-buddy-backup';
  backupVersion: number;
  applicationVersion: string;
  exportedAt: string;
  tripTitle: string;
  trip: TripData;
};

type LegacyTripBackup = {
  schema: 'travel-buddy-backup-v1';
  exportedAt: string;
  trip: TripData;
};

type HistoryState = {
  past: TripData[];
  present: TripData;
  future: TripData[];
};

export type ImportPreview = {
  backupVersion: string;
  applicationVersion: string;
  exportedAt: string;
  tripTitle: string;
  itineraryItemCount: number;
  linkedRecordCount: number | null;
};

export type BackupSnapshot = {
  id: string;
  createdAt: string;
  tripTitle: string;
  itineraryItemCount: number;
  backupVersion: number;
  applicationVersion: string;
  linkedRecordCount: number | null;
  pinned: boolean;
  label: string;
  notes: string;
  trip: TripData;
};

export type SnapshotHistoryImportPreview = {
  historyVersion: number;
  applicationVersion: string;
  exportedAt: string;
  totalSnapshotCount: number;
};

export type SnapshotCleanupMode = 'all-unpinned' | 'older-than-7' | 'older-than-30' | 'older-than-90';

type PersistenceErrorTarget = 'active-trip' | 'snapshot-history';

export type PersistenceErrorInfo = {
  target: PersistenceErrorTarget;
  message: string;
  occurredAt: string;
};

export type StorageHealthSummary = {
  activeTripStorageStatus: 'healthy' | 'error';
  snapshotHistoryStorageStatus: 'healthy' | 'error';
  totalSnapshotCount: number;
  pinnedSnapshotCount: number;
  unpinnedSnapshotCount: number;
  estimatedStoredBytes: number;
  lastSuccessfulPersistenceAt: string | null;
  mostRecentPersistenceError: PersistenceErrorInfo | null;
  activeTripPersistenceError: PersistenceErrorInfo | null;
  snapshotHistoryPersistenceError: PersistenceErrorInfo | null;
};

type StorageParseStatus = 'valid' | 'missing' | 'corrupted';
type StorageTarget = 'active-trip' | 'snapshot-history';

export type StorageCorruptionState = {
  target: StorageTarget;
  parseStatus: 'corrupted';
  message: string;
  rawPayloadAvailable: boolean;
  detectedAt: string;
};

export type StorageDiagnosticsSummary = {
  applicationVersion: string;
  backupVersion: number;
  snapshotHistoryVersion: number;
  activeTripStorageKey: string;
  snapshotHistoryStorageKey: string;
  activeTripRawPayloadSize: number;
  snapshotHistoryRawPayloadSize: number;
  totalEstimatedStoredSize: number;
  activeTripParseStatus: StorageParseStatus;
  snapshotHistoryParseStatus: StorageParseStatus;
  lastSuccessfulPersistenceAt: string | null;
  latestActiveTripPersistenceError: PersistenceErrorInfo | null;
  latestSnapshotHistoryPersistenceError: PersistenceErrorInfo | null;
  totalSnapshotCount: number;
  pinnedSnapshotCount: number;
  unpinnedSnapshotCount: number;
  browserTimestamp: string;
};

export type IntegrityIssueSeverity = 'warning' | 'repairable-error' | 'blocking-error';
export type IntegrityIssueTarget = 'active-trip' | 'snapshot-history';

export type IntegrityIssue = {
  id: string;
  target: IntegrityIssueTarget;
  issueType: string;
  severity: IntegrityIssueSeverity;
  affectedRecord: string;
  description: string;
  proposedRepair: string;
  automaticRepairAvailable: boolean;
};

export type IntegrityAuditReport = {
  generatedAt: string;
  applicationVersion: string;
  backupVersion: number;
  snapshotHistoryVersion: number;
  issueCount: number;
  warningCount: number;
  repairableErrorCount: number;
  blockingErrorCount: number;
  repairableIssueIds: string[];
  issues: IntegrityIssue[];
};

export type IntegrityAuditRunType = 'manual-audit' | 'before-repair' | 'after-repair';

export type IntegrityAuditRun = {
  id: string;
  generatedAt: string;
  applicationVersion: string;
  backupVersion: number;
  snapshotHistoryVersion: number;
  totalIssueCount: number;
  warningCount: number;
  repairableErrorCount: number;
  blockingErrorCount: number;
  repairableIssueCount: number;
  unresolvedIssueCount: number;
  activeTripIssueCount: number;
  snapshotHistoryIssueCount: number;
  durationMs: number;
  issueFingerprints: string[];
  runType: IntegrityAuditRunType;
};

export type IntegrityHistoryChangeSummary = {
  baselineRunId: string;
  latestRunId: string;
  totalIssueDelta: number;
  warningDelta: number;
  repairableErrorDelta: number;
  blockingErrorDelta: number;
  activeTripIssueDelta: number;
  snapshotHistoryIssueDelta: number;
  newlyIntroducedFingerprints: string[];
  resolvedFingerprints: string[];
  unchangedFingerprints: string[];
  result: 'Improved' | 'Unchanged' | 'Regressed';
};

export type IntegrityHistoryImportPreview = {
  historyVersion: number;
  exportedAt: string;
  totalRunCount: number;
  importedRunCount: number;
  baselineRunId: string | null;
};

type SnapshotHistoryBackup = {
  schema: 'travel-buddy-snapshot-history';
  snapshotHistoryVersion: number;
  applicationVersion: string;
  exportedAt: string;
  totalSnapshotCount: number;
  snapshots: BackupSnapshot[];
};

type IntegrityHistoryBackup = {
  schema: 'travel-buddy-integrity-history';
  integrityHistoryVersion: number;
  exportedAt: string;
  selectedBaselineRunId: string | null;
  runs: IntegrityAuditRun[];
};

const LOCAL_STORAGE_KEY = 'travel-buddy:trip-state:v1';
const LOCAL_SNAPSHOT_STORAGE_KEY = 'travel-buddy:trip-snapshots:v1';
const HISTORY_LIMIT = 50;
const UNPINNED_SNAPSHOT_LIMIT = 10;
const BACKUP_VERSION = 2;
const SNAPSHOT_HISTORY_VERSION = 1;
const APPLICATION_VERSION = typeof packageMetadata.version === 'string' ? packageMetadata.version : '0.0.0';
const SNAPSHOT_LABEL_LIMIT = 60;
const SNAPSHOT_NOTES_LIMIT = 500;
const INTEGRITY_REPAIR_BACKUP_STORAGE_KEY = 'travel-buddy:integrity-repair-backups:v1';
const INTEGRITY_HISTORY_STORAGE_KEY = 'travel-buddy:integrity-history:v1';
const INTEGRITY_HISTORY_BASELINE_STORAGE_KEY = 'travel-buddy:integrity-history-baseline:v1';
const INTEGRITY_HISTORY_VERSION = 1;
const INTEGRITY_HISTORY_LIMIT = 20;

const bytesInString = (value: string): number => {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(value).length;
  }
  return value.length;
};

const getPersistenceErrorMessage = (error: unknown, target: PersistenceErrorTarget): string => {
  const targetLabel = target === 'active-trip' ? 'active trip' : 'snapshot history';
  if (error instanceof DOMException && error.name === 'QuotaExceededError') {
    return `Local storage quota exceeded while saving ${targetLabel}.`;
  }
  if (error instanceof Error && error.message.trim().length > 0) {
    return `Failed to save ${targetLabel}: ${error.message}`;
  }
  return `Failed to save ${targetLabel} to local storage.`;
};

const createCorruptionState = (
  target: StorageTarget,
  message: string,
  rawPayloadAvailable: boolean,
): StorageCorruptionState => ({
  target,
  parseStatus: 'corrupted',
  message,
  rawPayloadAvailable,
  detectedAt: new Date().toISOString(),
});

const seededTrip: TripData = {
  tripName: 'Japan Discovery',
  stops: [
    { id: 's1', title: 'Arrive in Tokyo', day: 1, order: 1, notes: 'Narita transfer and hotel check-in' },
    { id: 's2', title: 'Asakusa and Senso-ji', day: 1, order: 2, notes: 'Evening street food walk' },
    { id: 's3', title: 'Kyoto day trip', day: 2, order: 1, notes: 'Shinkansen + temple route' },
  ],
};

const isTripStop = (value: unknown): value is TripStop => {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const stop = value as Partial<TripStop>;
  return (
    typeof stop.id === 'string' &&
    typeof stop.title === 'string' &&
    typeof stop.notes === 'string' &&
    typeof stop.day === 'number' &&
    Number.isInteger(stop.day) &&
    stop.day > 0 &&
    typeof stop.order === 'number' &&
    Number.isInteger(stop.order) &&
    stop.order > 0
  );
};

const isTripData = (value: unknown): value is TripData => {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const trip = value as Partial<TripData>;
  return typeof trip.tripName === 'string' && Array.isArray(trip.stops) && trip.stops.every(isTripStop);
};

const cloneTrip = (trip: TripData): TripData => ({
  tripName: trip.tripName,
  stops: trip.stops.map((stop) => ({ ...stop })),
});

type ParsedActiveTripStorage = {
  trip: TripData;
  parseStatus: StorageParseStatus;
  corruption: StorageCorruptionState | null;
  rawPayloadSize: number;
};

const isBackupSnapshot = (value: unknown): value is BackupSnapshot => {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const snapshot = value as Partial<BackupSnapshot>;
  return (
    typeof snapshot.id === 'string' &&
    typeof snapshot.createdAt === 'string' &&
    typeof snapshot.tripTitle === 'string' &&
    typeof snapshot.itineraryItemCount === 'number' &&
    typeof snapshot.backupVersion === 'number' &&
    typeof snapshot.applicationVersion === 'string' &&
    (typeof snapshot.linkedRecordCount === 'number' || snapshot.linkedRecordCount === null || snapshot.linkedRecordCount === undefined) &&
    (typeof snapshot.pinned === 'boolean' || snapshot.pinned === undefined) &&
    (typeof snapshot.label === 'string' || snapshot.label === undefined) &&
    (typeof snapshot.notes === 'string' || snapshot.notes === undefined) &&
    isTripData(snapshot.trip)
  );
};

const normalizeSnapshot = (value: unknown): BackupSnapshot | null => {
  if (!isBackupSnapshot(value)) {
    return null;
  }
  const snapshot = value as BackupSnapshot;
  return {
    ...snapshot,
    linkedRecordCount: typeof snapshot.linkedRecordCount === 'number' ? snapshot.linkedRecordCount : null,
    pinned: snapshot.pinned === true,
    label: typeof snapshot.label === 'string' ? snapshot.label.slice(0, SNAPSHOT_LABEL_LIMIT) : '',
    notes: typeof snapshot.notes === 'string' ? snapshot.notes.slice(0, SNAPSHOT_NOTES_LIMIT) : '',
    trip: sanitizeTrip(snapshot.trip),
  };
};

const applySnapshotRetention = (snapshots: BackupSnapshot[]): BackupSnapshot[] => {
  let keptUnpinned = 0;
  return snapshots.filter((snapshot) => {
    if (snapshot.pinned) {
      return true;
    }
    if (keptUnpinned >= UNPINNED_SNAPSHOT_LIMIT) {
      return false;
    }
    keptUnpinned += 1;
    return true;
  });
};

const isSnapshotOlderThanDays = (snapshot: BackupSnapshot, days: number): boolean => {
  const createdAt = new Date(snapshot.createdAt);
  if (Number.isNaN(createdAt.getTime())) {
    return false;
  }
  return Date.now() - createdAt.getTime() > days * 24 * 60 * 60 * 1000;
};

const getSnapshotsMatchingCleanup = (snapshots: BackupSnapshot[], mode: SnapshotCleanupMode): BackupSnapshot[] => {
  if (mode === 'all-unpinned') {
    return snapshots.filter((snapshot) => !snapshot.pinned);
  }
  const dayLimit = mode === 'older-than-7' ? 7 : mode === 'older-than-30' ? 30 : 90;
  return snapshots.filter((snapshot) => !snapshot.pinned && isSnapshotOlderThanDays(snapshot, dayLimit));
};

type ParsedSnapshotStorage = {
  snapshots: BackupSnapshot[];
  parseStatus: StorageParseStatus;
  corruption: StorageCorruptionState | null;
  rawPayloadSize: number;
};

const parsePersistedTripStorage = (rawValue: string | null): ParsedActiveTripStorage => {
  if (rawValue === null) {
    return {
      trip: cloneTrip(seededTrip),
      parseStatus: 'missing',
      corruption: null,
      rawPayloadSize: 0,
    };
  }

  const rawPayloadSize = bytesInString(rawValue);
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawValue);
  } catch {
    return {
      trip: cloneTrip(seededTrip),
      parseStatus: 'corrupted',
      corruption: createCorruptionState('active-trip', 'Active trip storage contains malformed JSON.', true),
      rawPayloadSize,
    };
  }

  if (isTripData(parsed)) {
    return {
      trip: sanitizeTrip(parsed),
      parseStatus: 'valid',
      corruption: null,
      rawPayloadSize,
    };
  }

  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && 'schema' in (parsed as Record<string, unknown>)) {
    return {
      trip: cloneTrip(seededTrip),
      parseStatus: 'corrupted',
      corruption: createCorruptionState(
        'active-trip',
        'Active trip storage has unsupported schema/version for trip-state key.',
        true,
      ),
      rawPayloadSize,
    };
  }

  return {
    trip: cloneTrip(seededTrip),
    parseStatus: 'corrupted',
    corruption: createCorruptionState(
      'active-trip',
      'Active trip storage is structurally invalid or missing required fields.',
      true,
    ),
    rawPayloadSize,
  };
};

const parsePersistedSnapshotStorage = (rawValue: string | null): ParsedSnapshotStorage => {
  if (rawValue === null) {
    return {
      snapshots: [],
      parseStatus: 'missing',
      corruption: null,
      rawPayloadSize: 0,
    };
  }

  const rawPayloadSize = bytesInString(rawValue);
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawValue);
  } catch {
    return {
      snapshots: [],
      parseStatus: 'corrupted',
      corruption: createCorruptionState('snapshot-history', 'Snapshot history storage contains malformed JSON.', true),
      rawPayloadSize,
    };
  }

  if (!Array.isArray(parsed)) {
    if (parsed && typeof parsed === 'object' && 'schema' in (parsed as Record<string, unknown>)) {
      return {
        snapshots: [],
        parseStatus: 'corrupted',
        corruption: createCorruptionState(
          'snapshot-history',
          'Snapshot history storage has unsupported schema/version for snapshots key.',
          true,
        ),
        rawPayloadSize,
      };
    }
    return {
      snapshots: [],
      parseStatus: 'corrupted',
      corruption: createCorruptionState(
        'snapshot-history',
        'Snapshot history storage is structurally invalid or missing required fields.',
        true,
      ),
      rawPayloadSize,
    };
  }

  const normalizedSnapshots = parsed.map(normalizeSnapshot);
  if (normalizedSnapshots.some((snapshot) => snapshot === null)) {
    return {
      snapshots: [],
      parseStatus: 'corrupted',
      corruption: createCorruptionState(
        'snapshot-history',
        'Snapshot history storage contains unreadable or unsupported snapshot entries.',
        true,
      ),
      rawPayloadSize,
    };
  }

  return {
    snapshots: applySnapshotRetention(normalizedSnapshots as BackupSnapshot[]),
    parseStatus: 'valid',
    corruption: null,
    rawPayloadSize,
  };
};

const dedupe = (items: string[]): string[] => Array.from(new Set(items));

const buildSearchIndex = (trip: TripData): Map<string, string[]> => {
  const index = new Map<string, string[]>();
  for (const stop of trip.stops) {
    const tokens = `${stop.title} ${stop.notes}`.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
    for (const token of dedupe(tokens)) {
      const existing = index.get(token) ?? [];
      index.set(token, dedupe([...existing, stop.id]));
    }
  }
  return index;
};

const updateHistory = (history: HistoryState, next: TripData): HistoryState => ({
  past: [...history.past, history.present].slice(-HISTORY_LIMIT),
  present: next,
  future: [],
});

const sortStops = (stops: TripStop[]): TripStop[] =>
  [...stops].sort((a, b) => {
    if (a.day !== b.day) {
      return a.day - b.day;
    }
    return a.order - b.order;
  });

const sanitizeTrip = (trip: TripData): TripData => ({
  tripName: trip.tripName.trim() || 'Untitled Trip',
  stops: sortStops(trip.stops).map((stop) => ({
    ...stop,
    title: stop.title.trim(),
    notes: stop.notes.trim(),
  })),
});

const assertRecord = (value: unknown, message: string): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(message);
  }
  return value as Record<string, unknown>;
};

const ensureString = (value: unknown, message: string): string => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(message);
  }
  return value;
};

const ensureNumber = (value: unknown, message: string): number => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new Error(message);
  }
  return value;
};

const countLinkedRecords = (root: Record<string, unknown>): number | null => {
  const possibleCounts: number[] = [];
  const sources: unknown[] = [
    root.vaultRecords,
    root.docRecords,
    root.documents,
    root.linkedRecords,
    root.vault,
    (root.trip as Record<string, unknown> | undefined)?.vaultRecords,
    (root.trip as Record<string, unknown> | undefined)?.docRecords,
    (root.trip as Record<string, unknown> | undefined)?.documents,
    (root.trip as Record<string, unknown> | undefined)?.linkedRecords,
    (root.trip as Record<string, unknown> | undefined)?.vault,
  ];

  for (const source of sources) {
    if (Array.isArray(source)) {
      possibleCounts.push(source.length);
      continue;
    }
    if (source && typeof source === 'object') {
      possibleCounts.push(Object.keys(source).length);
    }
  }

  if (possibleCounts.length === 0) {
    return null;
  }
  return Math.max(...possibleCounts);
};

const parseTripBackupPreview = (rawValue: string): { trip: TripData; preview: ImportPreview } => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawValue);
  } catch {
    throw new Error('Backup file is not valid JSON.');
  }

  const parsedObject = assertRecord(parsed, 'Backup file must contain an object.');

  if ('schema' in parsedObject && parsedObject.schema === 'travel-buddy-backup-v1') {
    const legacyBackup = parsedObject as Partial<LegacyTripBackup>;
    if (!isTripData(legacyBackup.trip)) {
      throw new Error('Legacy backup is missing trip data.');
    }
    const trip = sanitizeTrip(legacyBackup.trip);
    return {
      trip,
      preview: {
        backupVersion: 'legacy-v1',
        applicationVersion: 'Not provided',
        exportedAt: typeof legacyBackup.exportedAt === 'string' ? legacyBackup.exportedAt : 'Not provided',
        tripTitle: trip.tripName,
        itineraryItemCount: trip.stops.length,
        linkedRecordCount: countLinkedRecords(parsedObject),
      },
    };
  }

  if (!('schema' in parsedObject)) {
    if (isTripData(parsedObject)) {
      const trip = sanitizeTrip(parsedObject);
      return {
        trip,
        preview: {
          backupVersion: 'plain-trip-data',
          applicationVersion: 'Not provided',
          exportedAt: 'Not provided',
          tripTitle: trip.tripName,
          itineraryItemCount: trip.stops.length,
          linkedRecordCount: countLinkedRecords(parsedObject),
        },
      };
    }
    throw new Error('Backup is missing required schema metadata.');
  }

  if (parsedObject.schema !== 'travel-buddy-backup') {
    throw new Error('Backup schema is unsupported.');
  }

  const backupVersion = ensureNumber(parsedObject.backupVersion, 'Backup version is missing or invalid.');
  if (!Number.isInteger(backupVersion)) {
    throw new Error('Backup version must be an integer.');
  }
  if (backupVersion !== BACKUP_VERSION) {
    throw new Error(`Backup version ${backupVersion} is not supported by this app.`);
  }

  const applicationVersion = ensureString(parsedObject.applicationVersion, 'Application version is missing from backup.');
  const exportedAt = ensureString(parsedObject.exportedAt, 'Export timestamp is missing from backup.');
  const tripTitle = ensureString(parsedObject.tripTitle, 'Trip title is missing from backup.');

  if (!isTripData(parsedObject.trip)) {
    throw new Error('Trip data structure is malformed or missing required fields.');
  }

  const trip = sanitizeTrip(parsedObject.trip);
  return {
    trip,
    preview: {
      backupVersion: String(backupVersion),
      applicationVersion,
      exportedAt,
      tripTitle,
      itineraryItemCount: trip.stops.length,
      linkedRecordCount: countLinkedRecords(parsedObject),
    },
  };
};

const parseTripBackup = (rawValue: string): TripData => parseTripBackupPreview(rawValue).trip;

const parseSnapshotHistoryBackup = (
  rawValue: string,
): { preview: SnapshotHistoryImportPreview; snapshots: BackupSnapshot[] } => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawValue);
  } catch {
    throw new Error('Snapshot history file is not valid JSON.');
  }

  const parsedObject = assertRecord(parsed, 'Snapshot history file must contain an object.');
  if (parsedObject.schema !== 'travel-buddy-snapshot-history') {
    throw new Error('Snapshot history schema is unsupported.');
  }

  const historyVersion = ensureNumber(parsedObject.snapshotHistoryVersion, 'Snapshot history version is missing or invalid.');
  if (!Number.isInteger(historyVersion)) {
    throw new Error('Snapshot history version must be an integer.');
  }
  if (historyVersion !== SNAPSHOT_HISTORY_VERSION) {
    throw new Error(`Snapshot history version ${historyVersion} is not supported by this app.`);
  }

  const applicationVersion = ensureString(parsedObject.applicationVersion, 'Application version is missing from snapshot history.');
  const exportedAt = ensureString(parsedObject.exportedAt, 'Export timestamp is missing from snapshot history.');
  const totalSnapshotCount = ensureNumber(parsedObject.totalSnapshotCount, 'Total snapshot count is missing or invalid.');
  if (!Number.isInteger(totalSnapshotCount) || totalSnapshotCount < 0) {
    throw new Error('Total snapshot count must be a non-negative integer.');
  }

  if (!Array.isArray(parsedObject.snapshots)) {
    throw new Error('Snapshot history payload is missing snapshots array.');
  }

  const normalizedSnapshots = parsedObject.snapshots
    .map(normalizeSnapshot)
    .filter((snapshot): snapshot is BackupSnapshot => snapshot !== null);

  return {
    preview: {
      historyVersion,
      applicationVersion,
      exportedAt,
      totalSnapshotCount,
    },
    snapshots: applySnapshotRetention(normalizedSnapshots),
  };
};

const tripSignature = (trip: TripData): string => JSON.stringify(sanitizeTrip(trip));

const makeSnapshot = (trip: TripData, linkedRecordCount: number | null = null): BackupSnapshot => {
  const sanitizedTrip = sanitizeTrip(trip);
  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    tripTitle: sanitizedTrip.tripName,
    itineraryItemCount: sanitizedTrip.stops.length,
    backupVersion: BACKUP_VERSION,
    applicationVersion: APPLICATION_VERSION,
    linkedRecordCount,
    pinned: false,
    label: '',
    notes: '',
    trip: sanitizedTrip,
  };
};

const formatBackupTimestamp = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}-${hours}${minutes}`;
};

const formatSnapshotHistoryTimestamp = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}-${hours}${minutes}`;
};

const formatDiagnosticsTimestamp = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}-${hours}${minutes}`;
};

const safeReadStorageValue = (key: string): string | null => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const buildIntegrityIssueFingerprint = (issue: IntegrityIssue): string =>
  `${issue.target}|${issue.issueType}|${issue.affectedRecord}|${issue.severity}`;

const trimIntegrityHistoryRuns = (runs: IntegrityAuditRun[]): IntegrityAuditRun[] =>
  runs.slice(0, INTEGRITY_HISTORY_LIMIT);

const sortIntegrityHistoryRuns = (runs: IntegrityAuditRun[]): IntegrityAuditRun[] =>
  [...runs].sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());

const isIntegrityAuditRun = (value: unknown): value is IntegrityAuditRun => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const run = value as Partial<IntegrityAuditRun>;
  return (
    typeof run.id === 'string' &&
    typeof run.generatedAt === 'string' &&
    typeof run.applicationVersion === 'string' &&
    typeof run.backupVersion === 'number' &&
    typeof run.snapshotHistoryVersion === 'number' &&
    typeof run.totalIssueCount === 'number' &&
    typeof run.warningCount === 'number' &&
    typeof run.repairableErrorCount === 'number' &&
    typeof run.blockingErrorCount === 'number' &&
    typeof run.repairableIssueCount === 'number' &&
    typeof run.unresolvedIssueCount === 'number' &&
    typeof run.activeTripIssueCount === 'number' &&
    typeof run.snapshotHistoryIssueCount === 'number' &&
    typeof run.durationMs === 'number' &&
    Array.isArray(run.issueFingerprints) &&
    run.issueFingerprints.every((entry) => typeof entry === 'string') &&
    (run.runType === 'manual-audit' || run.runType === 'before-repair' || run.runType === 'after-repair')
  );
};

const parsePersistedIntegrityHistoryRuns = (rawValue: string | null): IntegrityAuditRun[] => {
  if (!rawValue) {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return trimIntegrityHistoryRuns(sortIntegrityHistoryRuns(parsed.filter(isIntegrityAuditRun)));
  } catch {
    return [];
  }
};

const parsePersistedIntegrityBaselineId = (rawValue: string | null, runs: IntegrityAuditRun[]): string | null => {
  if (!rawValue) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(rawValue);
    if (typeof parsed !== 'string') {
      return null;
    }
    return runs.some((run) => run.id === parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const classifyIntegrityHistoryChange = (delta: {
  totalIssueDelta: number;
  warningDelta: number;
  repairableErrorDelta: number;
  blockingErrorDelta: number;
}): 'Improved' | 'Unchanged' | 'Regressed' => {
  if (
    delta.totalIssueDelta === 0 &&
    delta.warningDelta === 0 &&
    delta.repairableErrorDelta === 0 &&
    delta.blockingErrorDelta === 0
  ) {
    return 'Unchanged';
  }
  const weighted =
    delta.blockingErrorDelta * 5 +
    delta.repairableErrorDelta * 3 +
    delta.warningDelta * 2 +
    delta.totalIssueDelta;
  if (weighted > 0) {
    return 'Regressed';
  }
  if (weighted < 0) {
    return 'Improved';
  }
  return 'Unchanged';
};

const isIsoDateLike = (value: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(value);

const normalizeDateUnambiguous = (value: string): string | null => {
  const trimmed = value.trim();
  if (isIsoDateLike(trimmed)) {
    return trimmed;
  }
  const asDate = new Date(trimmed);
  if (Number.isNaN(asDate.getTime())) {
    return null;
  }
  return asDate.toISOString().slice(0, 10);
};

const normalizeTimeUnambiguous = (value: string): string | null => {
  const trimmed = value.trim();
  const hhmm = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(trimmed);
  if (hhmm) {
    return `${hhmm[1].padStart(2, '0')}:${hhmm[2]}`;
  }
  return null;
};

const timeToMinutes = (value: string): number | null => {
  const normalized = normalizeTimeUnambiguous(value);
  if (!normalized) {
    return null;
  }
  const [hours, minutes] = normalized.split(':').map((part) => Number(part));
  return hours * 60 + minutes;
};

export function useTripStore() {
  const initialActiveTripStorage = parsePersistedTripStorage(safeReadStorageValue(LOCAL_STORAGE_KEY));
  const initialSnapshotStorage = parsePersistedSnapshotStorage(safeReadStorageValue(LOCAL_SNAPSHOT_STORAGE_KEY));
  const initialIntegrityHistoryRuns = parsePersistedIntegrityHistoryRuns(
    safeReadStorageValue(INTEGRITY_HISTORY_STORAGE_KEY),
  );
  const initialIntegrityBaselineRunId = parsePersistedIntegrityBaselineId(
    safeReadStorageValue(INTEGRITY_HISTORY_BASELINE_STORAGE_KEY),
    initialIntegrityHistoryRuns,
  );
  const [history, setHistory] = useState<HistoryState>(() => ({
    past: [],
    present: initialActiveTripStorage.trip,
    future: [],
  }));
  const [snapshots, setSnapshots] = useState<BackupSnapshot[]>(() => initialSnapshotStorage.snapshots);
  const [activeTripParseStatus, setActiveTripParseStatus] = useState<StorageParseStatus>(initialActiveTripStorage.parseStatus);
  const [snapshotHistoryParseStatus, setSnapshotHistoryParseStatus] = useState<StorageParseStatus>(
    initialSnapshotStorage.parseStatus,
  );
  const [activeTripCorruption, setActiveTripCorruption] = useState<StorageCorruptionState | null>(
    initialActiveTripStorage.corruption,
  );
  const [snapshotHistoryCorruption, setSnapshotHistoryCorruption] = useState<StorageCorruptionState | null>(
    initialSnapshotStorage.corruption,
  );
  const [activeTripRawPayloadSize, setActiveTripRawPayloadSize] = useState<number>(initialActiveTripStorage.rawPayloadSize);
  const [snapshotHistoryRawPayloadSize, setSnapshotHistoryRawPayloadSize] = useState<number>(
    initialSnapshotStorage.rawPayloadSize,
  );
  const [activeTripPersistenceError, setActiveTripPersistenceError] = useState<PersistenceErrorInfo | null>(null);
  const [snapshotHistoryPersistenceError, setSnapshotHistoryPersistenceError] = useState<PersistenceErrorInfo | null>(null);
  const [lastSuccessfulPersistenceAt, setLastSuccessfulPersistenceAt] = useState<string | null>(null);
  const [integrityAuditReport, setIntegrityAuditReport] = useState<IntegrityAuditReport | null>(null);
  const [integrityAuditRuns, setIntegrityAuditRuns] = useState<IntegrityAuditRun[]>(initialIntegrityHistoryRuns);
  const [selectedIntegrityBaselineRunId, setSelectedIntegrityBaselineRunId] = useState<string | null>(
    initialIntegrityBaselineRunId,
  );
  const integrityRepairOperationsRef = useRef<
    Map<string, (context: { activeTripDraft: Record<string, unknown> | null; snapshotDraft: unknown[] | null }) => void>
  >(new Map());

  const persistActiveTrip = (trip: TripData): boolean => {
    if (activeTripCorruption) {
      setActiveTripPersistenceError((currentError) =>
        currentError ??
        {
          target: 'active-trip',
          message: 'Cannot persist active trip while active-trip storage is marked as corrupted. Use Diagnostics & Recovery.',
          occurredAt: new Date().toISOString(),
        },
      );
      return false;
    }
    const serializedTrip = JSON.stringify(trip);
    try {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, serializedTrip);
      setActiveTripPersistenceError(null);
      setLastSuccessfulPersistenceAt(new Date().toISOString());
      setActiveTripParseStatus('valid');
      setActiveTripRawPayloadSize(bytesInString(serializedTrip));
      return true;
    } catch (error) {
      setActiveTripPersistenceError({
        target: 'active-trip',
        message: getPersistenceErrorMessage(error, 'active-trip'),
        occurredAt: new Date().toISOString(),
      });
      return false;
    }
  };

  const persistSnapshotHistory = (nextSnapshots: BackupSnapshot[]): boolean => {
    if (snapshotHistoryCorruption) {
      setSnapshotHistoryPersistenceError((currentError) =>
        currentError ??
        {
          target: 'snapshot-history',
          message: 'Cannot persist snapshot history while snapshot storage is marked as corrupted. Use Diagnostics & Recovery.',
          occurredAt: new Date().toISOString(),
        },
      );
      return false;
    }
    const serializedSnapshots = JSON.stringify(nextSnapshots);
    try {
      window.localStorage.setItem(LOCAL_SNAPSHOT_STORAGE_KEY, serializedSnapshots);
      setSnapshotHistoryPersistenceError(null);
      setLastSuccessfulPersistenceAt(new Date().toISOString());
      setSnapshotHistoryParseStatus('valid');
      setSnapshotHistoryRawPayloadSize(bytesInString(serializedSnapshots));
      return true;
    } catch (error) {
      setSnapshotHistoryPersistenceError({
        target: 'snapshot-history',
        message: getPersistenceErrorMessage(error, 'snapshot-history'),
        occurredAt: new Date().toISOString(),
      });
      return false;
    }
  };

  useEffect(() => {
    persistActiveTrip(history.present);
  }, [history.present]);
  useEffect(() => {
    persistSnapshotHistory(snapshots);
  }, [snapshots]);
  useEffect(() => {
    window.localStorage.setItem(INTEGRITY_HISTORY_STORAGE_KEY, JSON.stringify(integrityAuditRuns));
  }, [integrityAuditRuns]);
  useEffect(() => {
    if (selectedIntegrityBaselineRunId) {
      window.localStorage.setItem(
        INTEGRITY_HISTORY_BASELINE_STORAGE_KEY,
        JSON.stringify(selectedIntegrityBaselineRunId),
      );
      return;
    }
    window.localStorage.removeItem(INTEGRITY_HISTORY_BASELINE_STORAGE_KEY);
  }, [selectedIntegrityBaselineRunId]);
  useEffect(() => {
    if (!selectedIntegrityBaselineRunId) {
      return;
    }
    if (!integrityAuditRuns.some((run) => run.id === selectedIntegrityBaselineRunId)) {
      setSelectedIntegrityBaselineRunId(null);
    }
  }, [integrityAuditRuns, selectedIntegrityBaselineRunId]);

  const searchIndex = useMemo(() => buildSearchIndex(history.present), [history.present]);

  const pushSnapshot = (trip: TripData, linkedRecordCount: number | null = null) => {
    const snapshot = makeSnapshot(trip, linkedRecordCount);
    setSnapshots((currentSnapshots) => applySnapshotRetention([snapshot, ...currentSnapshots]));
  };

  const updateTrip = (
    updater: (current: TripData) => TripData,
    options?: { createSnapshot?: boolean; snapshotLinkedRecordCount?: number | null },
  ) => {
    const shouldCreateSnapshot = options?.createSnapshot ?? false;
    const snapshotLinkedRecordCount = options?.snapshotLinkedRecordCount ?? null;
    setHistory((currentHistory) => {
      const nextTrip = sanitizeTrip(updater(currentHistory.present));
      if (tripSignature(nextTrip) === tripSignature(currentHistory.present)) {
        return currentHistory;
      }
      if (shouldCreateSnapshot) {
        pushSnapshot(nextTrip, snapshotLinkedRecordCount);
      }
      return updateHistory(currentHistory, nextTrip);
    });
  };

  const replaceTrip = (
    trip: TripData,
    options?: { createSnapshot?: boolean; clearHistory?: boolean; snapshotLinkedRecordCount?: number | null },
  ) => {
    const shouldCreateSnapshot = options?.createSnapshot ?? false;
    const shouldClearHistory = options?.clearHistory ?? false;
    const snapshotLinkedRecordCount = options?.snapshotLinkedRecordCount ?? null;
    setHistory((currentHistory) => {
      const nextTrip = sanitizeTrip(trip);
      if (tripSignature(nextTrip) === tripSignature(currentHistory.present)) {
        return currentHistory;
      }
      if (shouldCreateSnapshot) {
        pushSnapshot(nextTrip, snapshotLinkedRecordCount);
      }
      if (shouldClearHistory) {
        return { past: [], present: nextTrip, future: [] };
      }
      return updateHistory(currentHistory, nextTrip);
    });
  };

  const undo = () => {
    setHistory((currentHistory) => {
      const previous = currentHistory.past.at(-1);
      if (!previous) {
        return currentHistory;
      }
      return {
        past: currentHistory.past.slice(0, -1),
        present: previous,
        future: [currentHistory.present, ...currentHistory.future],
      };
    });
  };

  const redo = () => {
    setHistory((currentHistory) => {
      const next = currentHistory.future[0];
      if (!next) {
        return currentHistory;
      }
      return {
        past: [...currentHistory.past, currentHistory.present].slice(-HISTORY_LIMIT),
        present: next,
        future: currentHistory.future.slice(1),
      };
    });
  };

  const moveStop = (stopId: string, direction: 'up' | 'down') => {
    updateTrip((trip) => {
      const stops = sortStops(trip.stops);
      const target = stops.find((stop) => stop.id === stopId);
      if (!target) {
        return trip;
      }
      const sameDayStops = stops.filter((stop) => stop.day === target.day);
      const currentIndex = sameDayStops.findIndex((stop) => stop.id === stopId);
      const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (swapIndex < 0 || swapIndex >= sameDayStops.length) {
        return trip;
      }

      const currentStop = sameDayStops[currentIndex];
      const swapStop = sameDayStops[swapIndex];
      return {
        ...trip,
        stops: stops.map((stop) => {
          if (stop.id === currentStop.id) {
            return { ...stop, order: swapStop.order };
          }
          if (stop.id === swapStop.id) {
            return { ...stop, order: currentStop.order };
          }
          return stop;
        }),
      };
    }, { createSnapshot: true });
  };

  const addStop = () => {
    updateTrip((trip) => {
      const maxDay = trip.stops.reduce((max, stop) => Math.max(max, stop.day), 1);
      const nextOrder = trip.stops.filter((stop) => stop.day === maxDay).length + 1;
      return {
        ...trip,
        stops: [
          ...trip.stops,
          {
            id: `s-${crypto.randomUUID()}`,
            title: 'New itinerary item',
            day: maxDay,
            order: nextOrder,
            notes: 'Update this activity',
          },
        ],
      };
    }, { createSnapshot: true });
  };

  const editStop = (stopId: string, title: string, notes: string) => {
    updateTrip((trip) => ({
      ...trip,
      stops: trip.stops.map((stop) => (stop.id === stopId ? { ...stop, title, notes } : stop)),
    }), { createSnapshot: true });
  };

  const deleteStop = (stopId: string) => {
    updateTrip((trip) => ({
      ...trip,
      stops: trip.stops.filter((stop) => stop.id !== stopId),
    }), { createSnapshot: true });
  };

  const duplicateStop = (stopId: string) => {
    updateTrip((trip) => {
      const stops = sortStops(trip.stops);
      const target = stops.find((stop) => stop.id === stopId);
      if (!target) {
        return trip;
      }
      const dayStops = stops.filter((stop) => stop.day === target.day);
      const maxOrder = dayStops.reduce((max, stop) => Math.max(max, stop.order), 0);
      return {
        ...trip,
        stops: [
          ...trip.stops,
          {
            ...target,
            id: `s-${crypto.randomUUID()}`,
            order: maxOrder + 1,
            title: `${target.title} (copy)`,
          },
        ],
      };
    }, { createSnapshot: true });
  };

  const searchStops = (query: string): string[] => {
    const tokens = query.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
    if (tokens.length === 0) {
      return history.present.stops.map((stop) => stop.id);
    }

    const tokenMatches = tokens.map((token) => searchIndex.get(token) ?? []);
    if (tokenMatches.some((matches) => matches.length === 0)) {
      return [];
    }

    return tokenMatches.reduce((accumulator, matches) => accumulator.filter((id) => matches.includes(id)));
  };

  const toBackupJson = (): string => {
    const now = new Date();
    const backup: TripBackup = {
      schema: 'travel-buddy-backup',
      backupVersion: BACKUP_VERSION,
      applicationVersion: APPLICATION_VERSION,
      exportedAt: now.toISOString(),
      tripTitle: history.present.tripName,
      trip: history.present,
    };
    return JSON.stringify(backup, null, 2);
  };

  const backupFileName = (): string => `travel-buddy-${formatBackupTimestamp(new Date())}.json`;

  const toSnapshotHistoryJson = (): string => {
    const payload: SnapshotHistoryBackup = {
      schema: 'travel-buddy-snapshot-history',
      snapshotHistoryVersion: SNAPSHOT_HISTORY_VERSION,
      applicationVersion: APPLICATION_VERSION,
      exportedAt: new Date().toISOString(),
      totalSnapshotCount: snapshots.length,
      snapshots,
    };
    return JSON.stringify(payload, null, 2);
  };

  const snapshotHistoryFileName = (): string =>
    `travel-buddy-snapshots-${formatSnapshotHistoryTimestamp(new Date())}.json`;

  const resetTrip = () => {
    replaceTrip(cloneTrip(seededTrip), { clearHistory: true, createSnapshot: true });
  };

  const clearLocalData = () => {
    window.localStorage.removeItem(LOCAL_STORAGE_KEY);
    window.localStorage.removeItem(LOCAL_SNAPSHOT_STORAGE_KEY);
    setActiveTripParseStatus('missing');
    setSnapshotHistoryParseStatus('missing');
    setActiveTripCorruption(null);
    setSnapshotHistoryCorruption(null);
    setActiveTripRawPayloadSize(0);
    setSnapshotHistoryRawPayloadSize(0);
    setSnapshots([]);
    setHistory({
      past: [],
      present: cloneTrip(seededTrip),
      future: [],
    });
  };

  const importTrip = (trip: TripData, linkedRecordCount: number | null = null) => {
    replaceTrip(trip, { createSnapshot: true, snapshotLinkedRecordCount: linkedRecordCount });
  };

  const restoreSnapshot = (snapshotId: string) => {
    const snapshot = snapshots.find((item) => item.id === snapshotId);
    if (!snapshot) {
      throw new Error('Snapshot not found.');
    }
    replaceTrip(snapshot.trip, { createSnapshot: false });
  };

  const deleteSnapshot = (snapshotId: string) => {
    setSnapshots((currentSnapshots) => currentSnapshots.filter((snapshot) => snapshot.id !== snapshotId));
  };

  const updateSnapshotDetails = (snapshotId: string, label: string, notes: string) => {
    setSnapshots((currentSnapshots) =>
      currentSnapshots.map((snapshot) => {
        if (snapshot.id !== snapshotId) {
          return snapshot;
        }
        return {
          ...snapshot,
          label: label.trim().slice(0, SNAPSHOT_LABEL_LIMIT),
          notes: notes.trim().slice(0, SNAPSHOT_NOTES_LIMIT),
        };
      }),
    );
  };

  const setSnapshotPinned = (snapshotId: string, pinned: boolean) => {
    setSnapshots((currentSnapshots) =>
      applySnapshotRetention(
        currentSnapshots.map((snapshot) => {
          if (snapshot.id !== snapshotId) {
            return snapshot;
          }
          return {
            ...snapshot,
            pinned,
          };
        }),
      ),
    );
  };

  const importSnapshotHistory = (nextSnapshots: BackupSnapshot[]) => {
    setSnapshots(applySnapshotRetention(nextSnapshots));
  };

  const getCleanupPreviewCount = (mode: SnapshotCleanupMode): number =>
    getSnapshotsMatchingCleanup(snapshots, mode).length;

  const cleanupSnapshots = (mode: SnapshotCleanupMode): number => {
    const toDelete = getSnapshotsMatchingCleanup(snapshots, mode);
    if (toDelete.length === 0) {
      return 0;
    }
    const deleteIds = new Set(toDelete.map((snapshot) => snapshot.id));
    setSnapshots((currentSnapshots) => currentSnapshots.filter((snapshot) => !deleteIds.has(snapshot.id)));
    return toDelete.length;
  };

  const retryPersistActiveTrip = (): boolean => persistActiveTrip(history.present);
  const retryPersistSnapshotHistory = (): boolean => persistSnapshotHistory(snapshots);
  const retryPersistAll = (): boolean => retryPersistActiveTrip() && retryPersistSnapshotHistory();

  const runIntegrityAudit = (runType: IntegrityAuditRunType = 'manual-audit'): IntegrityAuditReport => {
    const auditStartedAt = performance.now();
    const issueList: IntegrityIssue[] = [];
    const repairOperations = new Map<
      string,
      (context: { activeTripDraft: Record<string, unknown> | null; snapshotDraft: unknown[] | null }) => void
    >();
    let issueIndex = 0;
    const nextIssueId = (prefix: string): string => `${prefix}-${issueIndex++}`;

    const registerIssue = (
      issue: Omit<IntegrityIssue, 'id'>,
      repairOperation?: (context: { activeTripDraft: Record<string, unknown> | null; snapshotDraft: unknown[] | null }) => void,
    ) => {
      const id = nextIssueId(issue.target);
      issueList.push({ id, ...issue });
      if (repairOperation) {
        repairOperations.set(id, repairOperation);
      }
    };

    const activeRawValue = safeReadStorageValue(LOCAL_STORAGE_KEY);
    let activeTripDraft: Record<string, unknown> | null = null;
    if (activeRawValue !== null) {
      try {
        const parsed = JSON.parse(activeRawValue);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          activeTripDraft = parsed as Record<string, unknown>;
        } else {
          registerIssue({
            target: 'active-trip',
            issueType: 'invalid-active-trip-structure',
            severity: 'blocking-error',
            affectedRecord: 'root',
            description: 'Active trip root payload is not an object.',
            proposedRepair: 'No automatic repair. Use recovery tools.',
            automaticRepairAvailable: false,
          });
        }
      } catch {
        registerIssue({
          target: 'active-trip',
          issueType: 'malformed-active-trip-json',
          severity: 'blocking-error',
          affectedRecord: 'root',
          description: 'Active trip payload is malformed JSON.',
          proposedRepair: 'No automatic repair. Use recovery tools.',
          automaticRepairAvailable: false,
        });
      }
    }

    if (activeTripDraft) {
      if (typeof activeTripDraft.tripName !== 'string' || activeTripDraft.tripName.trim().length === 0) {
        registerIssue(
          {
            target: 'active-trip',
            issueType: 'missing-trip-title',
            severity: 'repairable-error',
            affectedRecord: 'tripName',
            description: 'Trip title is missing or invalid.',
            proposedRepair: 'Set trip title to "Untitled Trip".',
            automaticRepairAvailable: true,
          },
          ({ activeTripDraft: draft }) => {
            if (draft) {
              draft.tripName = 'Untitled Trip';
            }
          },
        );
      }

      const rawStops = Array.isArray(activeTripDraft.stops) ? activeTripDraft.stops : null;
      if (!rawStops) {
        registerIssue({
          target: 'active-trip',
          issueType: 'missing-stops-array',
          severity: 'blocking-error',
          affectedRecord: 'stops',
          description: 'Stops array is missing or invalid.',
          proposedRepair: 'No automatic repair. Use recovery tools.',
          automaticRepairAvailable: false,
        });
      } else {
        const idOccurrences = new Map<string, number[]>();
        for (let stopIndex = 0; stopIndex < rawStops.length; stopIndex += 1) {
          const stop = rawStops[stopIndex];
          if (!stop || typeof stop !== 'object' || Array.isArray(stop)) {
            registerIssue({
              target: 'active-trip',
              issueType: 'invalid-stop-record',
              severity: 'blocking-error',
              affectedRecord: `stops[${stopIndex}]`,
              description: 'Stop record is malformed.',
              proposedRepair: 'No automatic repair for malformed stop object.',
              automaticRepairAvailable: false,
            });
            continue;
          }
          const stopRecord = stop as Record<string, unknown>;

          if (typeof stopRecord.id !== 'string' || stopRecord.id.trim().length === 0) {
            registerIssue(
              {
                target: 'active-trip',
                issueType: 'missing-stop-id',
                severity: 'repairable-error',
                affectedRecord: `stops[${stopIndex}].id`,
                description: 'Stop ID is missing or invalid.',
                proposedRepair: 'Generate a new unique stop ID.',
                automaticRepairAvailable: true,
              },
              ({ activeTripDraft: draft }) => {
                const draftStops = draft?.stops;
                if (Array.isArray(draftStops) && draftStops[stopIndex] && typeof draftStops[stopIndex] === 'object') {
                  (draftStops[stopIndex] as Record<string, unknown>).id = `s-${crypto.randomUUID()}`;
                }
              },
            );
          } else {
            const existing = idOccurrences.get(stopRecord.id) ?? [];
            idOccurrences.set(stopRecord.id, [...existing, stopIndex]);
          }

          if (typeof stopRecord.title !== 'string' || stopRecord.title.trim().length === 0) {
            registerIssue(
              {
                target: 'active-trip',
                issueType: 'missing-stop-title',
                severity: 'repairable-error',
                affectedRecord: `stops[${stopIndex}].title`,
                description: 'Stop title is missing or invalid.',
                proposedRepair: 'Set safe default title.',
                automaticRepairAvailable: true,
              },
              ({ activeTripDraft: draft }) => {
                const draftStops = draft?.stops;
                if (Array.isArray(draftStops) && draftStops[stopIndex] && typeof draftStops[stopIndex] === 'object') {
                  (draftStops[stopIndex] as Record<string, unknown>).title = 'Untitled itinerary item';
                }
              },
            );
          }

          if (typeof stopRecord.notes !== 'string') {
            registerIssue(
              {
                target: 'active-trip',
                issueType: 'invalid-stop-notes-type',
                severity: 'repairable-error',
                affectedRecord: `stops[${stopIndex}].notes`,
                description: 'Notes field has invalid type.',
                proposedRepair: 'Replace notes with an empty string.',
                automaticRepairAvailable: true,
              },
              ({ activeTripDraft: draft }) => {
                const draftStops = draft?.stops;
                if (Array.isArray(draftStops) && draftStops[stopIndex] && typeof draftStops[stopIndex] === 'object') {
                  (draftStops[stopIndex] as Record<string, unknown>).notes = '';
                }
              },
            );
          }

          const dateValue = stopRecord.date;
          if (dateValue === undefined || dateValue === null || String(dateValue).trim().length === 0) {
            registerIssue({
              target: 'active-trip',
              issueType: 'missing-date',
              severity: 'warning',
              affectedRecord: `stops[${stopIndex}].date`,
              description: 'Date is missing.',
              proposedRepair: 'No automatic repair for missing date.',
              automaticRepairAvailable: false,
            });
          } else if (typeof dateValue !== 'string') {
            registerIssue({
              target: 'active-trip',
              issueType: 'invalid-date-type',
              severity: 'blocking-error',
              affectedRecord: `stops[${stopIndex}].date`,
              description: 'Date field type is invalid.',
              proposedRepair: 'No automatic repair for ambiguous date type.',
              automaticRepairAvailable: false,
            });
          } else {
            const normalizedDate = normalizeDateUnambiguous(dateValue);
            if (!normalizedDate) {
              registerIssue({
                target: 'active-trip',
                issueType: 'invalid-date-format',
                severity: 'blocking-error',
                affectedRecord: `stops[${stopIndex}].date`,
                description: 'Date format is invalid or ambiguous.',
                proposedRepair: 'No automatic repair for ambiguous date format.',
                automaticRepairAvailable: false,
              });
            } else if (normalizedDate !== dateValue.trim()) {
              registerIssue(
                {
                  target: 'active-trip',
                  issueType: 'normalizable-date-format',
                  severity: 'repairable-error',
                  affectedRecord: `stops[${stopIndex}].date`,
                  description: 'Date can be normalized to canonical format.',
                  proposedRepair: `Normalize date to ${normalizedDate}.`,
                  automaticRepairAvailable: true,
                },
                ({ activeTripDraft: draft }) => {
                  const draftStops = draft?.stops;
                  if (Array.isArray(draftStops) && draftStops[stopIndex] && typeof draftStops[stopIndex] === 'object') {
                    (draftStops[stopIndex] as Record<string, unknown>).date = normalizedDate;
                  }
                },
              );
            }
          }

          const startTimeValue = stopRecord.startTime;
          const endTimeValue = stopRecord.endTime;
          const normalizedStartTime =
            typeof startTimeValue === 'string' ? normalizeTimeUnambiguous(startTimeValue) : null;
          const normalizedEndTime = typeof endTimeValue === 'string' ? normalizeTimeUnambiguous(endTimeValue) : null;

          if (startTimeValue !== undefined && startTimeValue !== null) {
            if (typeof startTimeValue !== 'string') {
              registerIssue({
                target: 'active-trip',
                issueType: 'invalid-start-time-type',
                severity: 'blocking-error',
                affectedRecord: `stops[${stopIndex}].startTime`,
                description: 'Start time type is invalid.',
                proposedRepair: 'No automatic repair for non-string start time.',
                automaticRepairAvailable: false,
              });
            } else if (!normalizedStartTime) {
              registerIssue({
                target: 'active-trip',
                issueType: 'invalid-start-time-format',
                severity: 'blocking-error',
                affectedRecord: `stops[${stopIndex}].startTime`,
                description: 'Start time format is invalid or ambiguous.',
                proposedRepair: 'No automatic repair for ambiguous time format.',
                automaticRepairAvailable: false,
              });
            } else if (normalizedStartTime !== startTimeValue.trim()) {
              registerIssue(
                {
                  target: 'active-trip',
                  issueType: 'normalizable-start-time',
                  severity: 'repairable-error',
                  affectedRecord: `stops[${stopIndex}].startTime`,
                  description: 'Start time can be normalized.',
                  proposedRepair: `Normalize start time to ${normalizedStartTime}.`,
                  automaticRepairAvailable: true,
                },
                ({ activeTripDraft: draft }) => {
                  const draftStops = draft?.stops;
                  if (Array.isArray(draftStops) && draftStops[stopIndex] && typeof draftStops[stopIndex] === 'object') {
                    (draftStops[stopIndex] as Record<string, unknown>).startTime = normalizedStartTime;
                  }
                },
              );
            }
          }

          if (endTimeValue !== undefined && endTimeValue !== null) {
            if (typeof endTimeValue !== 'string') {
              registerIssue({
                target: 'active-trip',
                issueType: 'invalid-end-time-type',
                severity: 'blocking-error',
                affectedRecord: `stops[${stopIndex}].endTime`,
                description: 'End time type is invalid.',
                proposedRepair: 'No automatic repair for non-string end time.',
                automaticRepairAvailable: false,
              });
            } else if (!normalizedEndTime) {
              registerIssue({
                target: 'active-trip',
                issueType: 'invalid-end-time-format',
                severity: 'blocking-error',
                affectedRecord: `stops[${stopIndex}].endTime`,
                description: 'End time format is invalid or ambiguous.',
                proposedRepair: 'No automatic repair for ambiguous time format.',
                automaticRepairAvailable: false,
              });
            } else if (normalizedEndTime !== endTimeValue.trim()) {
              registerIssue(
                {
                  target: 'active-trip',
                  issueType: 'normalizable-end-time',
                  severity: 'repairable-error',
                  affectedRecord: `stops[${stopIndex}].endTime`,
                  description: 'End time can be normalized.',
                  proposedRepair: `Normalize end time to ${normalizedEndTime}.`,
                  automaticRepairAvailable: true,
                },
                ({ activeTripDraft: draft }) => {
                  const draftStops = draft?.stops;
                  if (Array.isArray(draftStops) && draftStops[stopIndex] && typeof draftStops[stopIndex] === 'object') {
                    (draftStops[stopIndex] as Record<string, unknown>).endTime = normalizedEndTime;
                  }
                },
              );
            }
          }

          if (normalizedStartTime && normalizedEndTime) {
            const startMinutes = timeToMinutes(normalizedStartTime);
            const endMinutes = timeToMinutes(normalizedEndTime);
            if (startMinutes !== null && endMinutes !== null && endMinutes < startMinutes) {
              registerIssue({
                target: 'active-trip',
                issueType: 'end-time-before-start-time',
                severity: 'blocking-error',
                affectedRecord: `stops[${stopIndex}]`,
                description: 'End time is earlier than start time.',
                proposedRepair: 'No automatic repair for ambiguous schedule intent.',
                automaticRepairAvailable: false,
              });
            }
          }

          const linkedFields = [
            'linkedReferences',
            'linkedReferenceIds',
            'linkedDocs',
            'linkedDocuments',
            'vaultReferences',
            'linkedVault',
          ];
          for (const linkedField of linkedFields) {
            if (!(linkedField in stopRecord)) {
              continue;
            }
            const linkedValue = stopRecord[linkedField];
            if (!Array.isArray(linkedValue)) {
              registerIssue(
                {
                  target: 'active-trip',
                  issueType: 'malformed-linked-reference-array',
                  severity: 'repairable-error',
                  affectedRecord: `stops[${stopIndex}].${linkedField}`,
                  description: 'Linked-reference field is not an array.',
                  proposedRepair: `Replace ${linkedField} with an empty array.`,
                  automaticRepairAvailable: true,
                },
                ({ activeTripDraft: draft }) => {
                  const draftStops = draft?.stops;
                  if (Array.isArray(draftStops) && draftStops[stopIndex] && typeof draftStops[stopIndex] === 'object') {
                    (draftStops[stopIndex] as Record<string, unknown>)[linkedField] = [];
                  }
                },
              );
              continue;
            }
            const validEntries = linkedValue.filter((entry) => typeof entry === 'string' && entry.trim().length > 0);
            if (validEntries.length !== linkedValue.length) {
              registerIssue(
                {
                  target: 'active-trip',
                  issueType: 'malformed-linked-reference-entry',
                  severity: 'repairable-error',
                  affectedRecord: `stops[${stopIndex}].${linkedField}`,
                  description: 'Linked-reference array contains malformed entries.',
                  proposedRepair: `Remove malformed entries in ${linkedField}.`,
                  automaticRepairAvailable: true,
                },
                ({ activeTripDraft: draft }) => {
                  const draftStops = draft?.stops;
                  if (Array.isArray(draftStops) && draftStops[stopIndex] && typeof draftStops[stopIndex] === 'object') {
                    const currentValue = (draftStops[stopIndex] as Record<string, unknown>)[linkedField];
                    if (Array.isArray(currentValue)) {
                      (draftStops[stopIndex] as Record<string, unknown>)[linkedField] = currentValue.filter(
                        (entry) => typeof entry === 'string' && entry.trim().length > 0,
                      );
                    }
                  }
                },
              );
            }
          }
        }

        for (const [stopId, indexes] of idOccurrences.entries()) {
          if (indexes.length <= 1) {
            continue;
          }
          indexes.slice(1).forEach((duplicateIndex) => {
            registerIssue(
              {
                target: 'active-trip',
                issueType: 'duplicate-stop-id',
                severity: 'repairable-error',
                affectedRecord: `stops[${duplicateIndex}].id`,
                description: `Duplicate stop ID detected (${stopId}).`,
                proposedRepair: 'Replace duplicate stop ID with a new unique ID.',
                automaticRepairAvailable: true,
              },
              ({ activeTripDraft: draft }) => {
                const draftStops = draft?.stops;
                if (Array.isArray(draftStops) && draftStops[duplicateIndex] && typeof draftStops[duplicateIndex] === 'object') {
                  (draftStops[duplicateIndex] as Record<string, unknown>).id = `s-${crypto.randomUUID()}`;
                }
              },
            );
          });
        }
      }
    }

    const snapshotRawValue = safeReadStorageValue(LOCAL_SNAPSHOT_STORAGE_KEY);
    let snapshotDraft: unknown[] | null = null;
    if (snapshotRawValue !== null) {
      try {
        const parsed = JSON.parse(snapshotRawValue);
        if (Array.isArray(parsed)) {
          snapshotDraft = parsed;
        } else {
          registerIssue({
            target: 'snapshot-history',
            issueType: 'invalid-snapshot-root',
            severity: 'blocking-error',
            affectedRecord: 'root',
            description: 'Snapshot history root payload is not an array.',
            proposedRepair: 'No automatic repair. Use recovery tools.',
            automaticRepairAvailable: false,
          });
        }
      } catch {
        registerIssue({
          target: 'snapshot-history',
          issueType: 'malformed-snapshot-json',
          severity: 'blocking-error',
          affectedRecord: 'root',
          description: 'Snapshot history payload is malformed JSON.',
          proposedRepair: 'No automatic repair. Use recovery tools.',
          automaticRepairAvailable: false,
        });
      }
    }

    if (snapshotDraft) {
      const snapshotIdOccurrences = new Map<string, number[]>();
      for (let snapshotIndex = 0; snapshotIndex < snapshotDraft.length; snapshotIndex += 1) {
        const snapshot = snapshotDraft[snapshotIndex];
        if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
          registerIssue({
            target: 'snapshot-history',
            issueType: 'invalid-snapshot-record',
            severity: 'blocking-error',
            affectedRecord: `snapshots[${snapshotIndex}]`,
            description: 'Snapshot record is malformed.',
            proposedRepair: 'No automatic repair for malformed snapshot object.',
            automaticRepairAvailable: false,
          });
          continue;
        }
        const snapshotRecord = snapshot as Record<string, unknown>;

        if (typeof snapshotRecord.id !== 'string' || snapshotRecord.id.trim().length === 0) {
          registerIssue(
            {
              target: 'snapshot-history',
              issueType: 'missing-snapshot-id',
              severity: 'repairable-error',
              affectedRecord: `snapshots[${snapshotIndex}].id`,
              description: 'Snapshot ID is missing or invalid.',
              proposedRepair: 'Generate a new unique snapshot ID.',
              automaticRepairAvailable: true,
            },
            ({ snapshotDraft: draft }) => {
              if (draft && draft[snapshotIndex] && typeof draft[snapshotIndex] === 'object') {
                (draft[snapshotIndex] as Record<string, unknown>).id = crypto.randomUUID();
              }
            },
          );
        } else {
          const existing = snapshotIdOccurrences.get(snapshotRecord.id) ?? [];
          snapshotIdOccurrences.set(snapshotRecord.id, [...existing, snapshotIndex]);
        }

        if (typeof snapshotRecord.createdAt !== 'string' || Number.isNaN(new Date(snapshotRecord.createdAt).getTime())) {
          registerIssue(
            {
              target: 'snapshot-history',
              issueType: 'invalid-snapshot-timestamp',
              severity: 'repairable-error',
              affectedRecord: `snapshots[${snapshotIndex}].createdAt`,
              description: 'Snapshot timestamp is missing or invalid.',
              proposedRepair: 'Replace with current ISO timestamp.',
              automaticRepairAvailable: true,
            },
            ({ snapshotDraft: draft }) => {
              if (draft && draft[snapshotIndex] && typeof draft[snapshotIndex] === 'object') {
                (draft[snapshotIndex] as Record<string, unknown>).createdAt = new Date().toISOString();
              }
            },
          );
        }

        if (typeof snapshotRecord.pinned !== 'boolean' && snapshotRecord.pinned !== undefined) {
          registerIssue(
            {
              target: 'snapshot-history',
              issueType: 'invalid-pinned-value',
              severity: 'repairable-error',
              affectedRecord: `snapshots[${snapshotIndex}].pinned`,
              description: 'Pinned value is not a boolean.',
              proposedRepair: 'Normalize pinned to false.',
              automaticRepairAvailable: true,
            },
            ({ snapshotDraft: draft }) => {
              if (draft && draft[snapshotIndex] && typeof draft[snapshotIndex] === 'object') {
                (draft[snapshotIndex] as Record<string, unknown>).pinned = false;
              }
            },
          );
        }

        if (typeof snapshotRecord.label === 'string' && snapshotRecord.label.length > SNAPSHOT_LABEL_LIMIT) {
          registerIssue(
            {
              target: 'snapshot-history',
              issueType: 'oversized-snapshot-label',
              severity: 'repairable-error',
              affectedRecord: `snapshots[${snapshotIndex}].label`,
              description: 'Snapshot label exceeds maximum length.',
              proposedRepair: `Truncate label to ${SNAPSHOT_LABEL_LIMIT} characters.`,
              automaticRepairAvailable: true,
            },
            ({ snapshotDraft: draft }) => {
              if (draft && draft[snapshotIndex] && typeof draft[snapshotIndex] === 'object') {
                const record = draft[snapshotIndex] as Record<string, unknown>;
                if (typeof record.label === 'string') {
                  record.label = record.label.slice(0, SNAPSHOT_LABEL_LIMIT);
                }
              }
            },
          );
        }

        if (typeof snapshotRecord.notes === 'string' && snapshotRecord.notes.length > SNAPSHOT_NOTES_LIMIT) {
          registerIssue(
            {
              target: 'snapshot-history',
              issueType: 'oversized-snapshot-notes',
              severity: 'repairable-error',
              affectedRecord: `snapshots[${snapshotIndex}].notes`,
              description: 'Snapshot notes exceed maximum length.',
              proposedRepair: `Truncate notes to ${SNAPSHOT_NOTES_LIMIT} characters.`,
              automaticRepairAvailable: true,
            },
            ({ snapshotDraft: draft }) => {
              if (draft && draft[snapshotIndex] && typeof draft[snapshotIndex] === 'object') {
                const record = draft[snapshotIndex] as Record<string, unknown>;
                if (typeof record.notes === 'string') {
                  record.notes = record.notes.slice(0, SNAPSHOT_NOTES_LIMIT);
                }
              }
            },
          );
        }

        if (typeof snapshotRecord.trip === 'object' && snapshotRecord.trip && !Array.isArray(snapshotRecord.trip)) {
          const tripRecord = snapshotRecord.trip as Record<string, unknown>;
          const tripStops = Array.isArray(tripRecord.stops) ? tripRecord.stops : [];
          const expectedCount = tripStops.length;
          if (typeof snapshotRecord.itineraryItemCount !== 'number' || snapshotRecord.itineraryItemCount !== expectedCount) {
            registerIssue(
              {
                target: 'snapshot-history',
                issueType: 'snapshot-item-count-mismatch',
                severity: 'repairable-error',
                affectedRecord: `snapshots[${snapshotIndex}].itineraryItemCount`,
                description: 'Snapshot item count does not match trip payload.',
                proposedRepair: `Recalculate itineraryItemCount to ${expectedCount}.`,
                automaticRepairAvailable: true,
              },
              ({ snapshotDraft: draft }) => {
                if (draft && draft[snapshotIndex] && typeof draft[snapshotIndex] === 'object') {
                  (draft[snapshotIndex] as Record<string, unknown>).itineraryItemCount = expectedCount;
                }
              },
            );
          }
        }
      }

      for (const [snapshotId, indexes] of snapshotIdOccurrences.entries()) {
        if (indexes.length <= 1) {
          continue;
        }
        indexes.slice(1).forEach((duplicateIndex) => {
          registerIssue(
            {
              target: 'snapshot-history',
              issueType: 'duplicate-snapshot-id',
              severity: 'repairable-error',
              affectedRecord: `snapshots[${duplicateIndex}].id`,
              description: `Duplicate snapshot ID detected (${snapshotId}).`,
              proposedRepair: 'Replace duplicate snapshot ID with a new unique ID.',
              automaticRepairAvailable: true,
            },
            ({ snapshotDraft: draft }) => {
              if (draft && draft[duplicateIndex] && typeof draft[duplicateIndex] === 'object') {
                (draft[duplicateIndex] as Record<string, unknown>).id = crypto.randomUUID();
              }
            },
          );
        });
      }
    }

    integrityRepairOperationsRef.current = repairOperations;

    const warningCount = issueList.filter((issue) => issue.severity === 'warning').length;
    const repairableErrorCount = issueList.filter((issue) => issue.severity === 'repairable-error').length;
    const blockingErrorCount = issueList.filter((issue) => issue.severity === 'blocking-error').length;
    const repairableIssueIds = issueList
      .filter((issue) => issue.automaticRepairAvailable)
      .map((issue) => issue.id);

    const report: IntegrityAuditReport = {
      generatedAt: new Date().toISOString(),
      applicationVersion: APPLICATION_VERSION,
      backupVersion: BACKUP_VERSION,
      snapshotHistoryVersion: SNAPSHOT_HISTORY_VERSION,
      issueCount: issueList.length,
      warningCount,
      repairableErrorCount,
      blockingErrorCount,
      repairableIssueIds,
      issues: issueList,
    };
    const activeTripIssueCount = issueList.filter((issue) => issue.target === 'active-trip').length;
    const snapshotHistoryIssueCount = issueList.filter((issue) => issue.target === 'snapshot-history').length;
    const runMetadata: IntegrityAuditRun = {
      id: crypto.randomUUID(),
      generatedAt: report.generatedAt,
      applicationVersion: report.applicationVersion,
      backupVersion: report.backupVersion,
      snapshotHistoryVersion: report.snapshotHistoryVersion,
      totalIssueCount: report.issueCount,
      warningCount: report.warningCount,
      repairableErrorCount: report.repairableErrorCount,
      blockingErrorCount: report.blockingErrorCount,
      repairableIssueCount: report.repairableIssueIds.length,
      unresolvedIssueCount: report.issueCount,
      activeTripIssueCount,
      snapshotHistoryIssueCount,
      durationMs: Math.max(0, Math.round(performance.now() - auditStartedAt)),
      issueFingerprints: issueList.map(buildIntegrityIssueFingerprint),
      runType,
    };
    setIntegrityAuditRuns((currentRuns) =>
      trimIntegrityHistoryRuns(sortIntegrityHistoryRuns([runMetadata, ...currentRuns])),
    );
    setIntegrityAuditReport(report);
    return report;
  };

  const integrityAuditFileName = (): string =>
    `travel-buddy-integrity-audit-${formatDiagnosticsTimestamp(new Date())}.json`;

  const toIntegrityAuditJson = (): string => {
    if (!integrityAuditReport) {
      throw new Error('Run integrity audit before exporting.');
    }
    return JSON.stringify(
      {
        generatedAt: integrityAuditReport.generatedAt,
        applicationVersion: integrityAuditReport.applicationVersion,
        backupVersion: integrityAuditReport.backupVersion,
        snapshotHistoryVersion: integrityAuditReport.snapshotHistoryVersion,
        issueCount: integrityAuditReport.issueCount,
        warningCount: integrityAuditReport.warningCount,
        repairableErrorCount: integrityAuditReport.repairableErrorCount,
        blockingErrorCount: integrityAuditReport.blockingErrorCount,
        issues: integrityAuditReport.issues.map((issue) => ({
          id: issue.id,
          target: issue.target,
          issueType: issue.issueType,
          severity: issue.severity,
          affectedRecord: issue.affectedRecord,
          description: issue.description,
          proposedRepair: issue.proposedRepair,
          automaticRepairAvailable: issue.automaticRepairAvailable,
        })),
      },
      null,
      2,
    );
  };

  const integrityHistoryFileName = (): string =>
    `travel-buddy-integrity-history-${formatDiagnosticsTimestamp(new Date())}.json`;

  const latestVsBaselineChangeSummary = useMemo<IntegrityHistoryChangeSummary | null>(() => {
    if (!selectedIntegrityBaselineRunId || integrityAuditRuns.length === 0) {
      return null;
    }
    const latestRun = integrityAuditRuns[0];
    const baselineRun = integrityAuditRuns.find((run) => run.id === selectedIntegrityBaselineRunId);
    if (!baselineRun) {
      return null;
    }
    const latestFingerprints = new Set(latestRun.issueFingerprints);
    const baselineFingerprints = new Set(baselineRun.issueFingerprints);
    const newlyIntroducedFingerprints = [...latestFingerprints].filter(
      (fingerprint) => !baselineFingerprints.has(fingerprint),
    );
    const resolvedFingerprints = [...baselineFingerprints].filter(
      (fingerprint) => !latestFingerprints.has(fingerprint),
    );
    const unchangedFingerprints = [...latestFingerprints].filter((fingerprint) =>
      baselineFingerprints.has(fingerprint),
    );
    const totalIssueDelta = latestRun.totalIssueCount - baselineRun.totalIssueCount;
    const warningDelta = latestRun.warningCount - baselineRun.warningCount;
    const repairableErrorDelta = latestRun.repairableErrorCount - baselineRun.repairableErrorCount;
    const blockingErrorDelta = latestRun.blockingErrorCount - baselineRun.blockingErrorCount;
    const activeTripIssueDelta = latestRun.activeTripIssueCount - baselineRun.activeTripIssueCount;
    const snapshotHistoryIssueDelta = latestRun.snapshotHistoryIssueCount - baselineRun.snapshotHistoryIssueCount;
    return {
      baselineRunId: baselineRun.id,
      latestRunId: latestRun.id,
      totalIssueDelta,
      warningDelta,
      repairableErrorDelta,
      blockingErrorDelta,
      activeTripIssueDelta,
      snapshotHistoryIssueDelta,
      newlyIntroducedFingerprints,
      resolvedFingerprints,
      unchangedFingerprints,
      result: classifyIntegrityHistoryChange({
        totalIssueDelta,
        warningDelta,
        repairableErrorDelta,
        blockingErrorDelta,
      }),
    };
  }, [integrityAuditRuns, selectedIntegrityBaselineRunId]);

  const toIntegrityHistoryJson = (): string => {
    const payload: IntegrityHistoryBackup = {
      schema: 'travel-buddy-integrity-history',
      integrityHistoryVersion: INTEGRITY_HISTORY_VERSION,
      exportedAt: new Date().toISOString(),
      selectedBaselineRunId: selectedIntegrityBaselineRunId,
      runs: integrityAuditRuns.map((run) => ({
        id: run.id,
        generatedAt: run.generatedAt,
        applicationVersion: run.applicationVersion,
        backupVersion: run.backupVersion,
        snapshotHistoryVersion: run.snapshotHistoryVersion,
        totalIssueCount: run.totalIssueCount,
        warningCount: run.warningCount,
        repairableErrorCount: run.repairableErrorCount,
        blockingErrorCount: run.blockingErrorCount,
        repairableIssueCount: run.repairableIssueCount,
        unresolvedIssueCount: run.unresolvedIssueCount,
        activeTripIssueCount: run.activeTripIssueCount,
        snapshotHistoryIssueCount: run.snapshotHistoryIssueCount,
        durationMs: run.durationMs,
        issueFingerprints: run.issueFingerprints,
        runType: run.runType,
      })),
    };
    return JSON.stringify(
      {
        ...payload,
        latestVsBaselineChangeSummary,
      },
      null,
      2,
    );
  };

  const parseIntegrityHistoryBackup = (
    rawValue: string,
  ): { preview: IntegrityHistoryImportPreview; runs: IntegrityAuditRun[]; baselineRunId: string | null } => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawValue);
    } catch {
      throw new Error('Integrity history file is not valid JSON.');
    }
    const parsedRecord = assertRecord(parsed, 'Integrity history file must contain an object.');
    if (parsedRecord.schema !== 'travel-buddy-integrity-history') {
      throw new Error('Integrity history schema is unsupported.');
    }
    const historyVersion = ensureNumber(
      parsedRecord.integrityHistoryVersion,
      'Integrity history version is missing or invalid.',
    );
    if (!Number.isInteger(historyVersion)) {
      throw new Error('Integrity history version must be an integer.');
    }
    if (historyVersion !== INTEGRITY_HISTORY_VERSION) {
      throw new Error(`Integrity history version ${historyVersion} is not supported by this app.`);
    }
    const exportedAt = ensureString(parsedRecord.exportedAt, 'Integrity history export timestamp is missing.');
    if (!Array.isArray(parsedRecord.runs)) {
      throw new Error('Integrity history runs array is missing.');
    }
    const runs = trimIntegrityHistoryRuns(sortIntegrityHistoryRuns(parsedRecord.runs.filter(isIntegrityAuditRun)));
    const baselineCandidate =
      typeof parsedRecord.selectedBaselineRunId === 'string' ? parsedRecord.selectedBaselineRunId : null;
    const baselineRunId = baselineCandidate && runs.some((run) => run.id === baselineCandidate) ? baselineCandidate : null;
    return {
      preview: {
        historyVersion,
        exportedAt,
        totalRunCount: parsedRecord.runs.length,
        importedRunCount: runs.length,
        baselineRunId,
      },
      runs,
      baselineRunId,
    };
  };

  const importIntegrityHistory = (runs: IntegrityAuditRun[], baselineRunId: string | null) => {
    const normalizedRuns = trimIntegrityHistoryRuns(sortIntegrityHistoryRuns(runs));
    setIntegrityAuditRuns(normalizedRuns);
    setSelectedIntegrityBaselineRunId(
      baselineRunId && normalizedRuns.some((run) => run.id === baselineRunId) ? baselineRunId : null,
    );
  };

  const setIntegrityBaselineRun = (runId: string) => {
    if (!integrityAuditRuns.some((run) => run.id === runId)) {
      return;
    }
    setSelectedIntegrityBaselineRunId(runId);
  };

  const clearIntegrityBaselineRun = () => {
    setSelectedIntegrityBaselineRunId(null);
  };

  const deleteIntegrityRun = (runId: string) => {
    setIntegrityAuditRuns((currentRuns) => currentRuns.filter((run) => run.id !== runId));
    setSelectedIntegrityBaselineRunId((currentBaseline) => (currentBaseline === runId ? null : currentBaseline));
  };

  const clearIntegrityHistory = () => {
    setIntegrityAuditRuns([]);
    setSelectedIntegrityBaselineRunId(null);
  };

  const appendInternalRepairBackup = (target: StorageTarget, rawValue: string) => {
    const current = safeReadStorageValue(INTEGRITY_REPAIR_BACKUP_STORAGE_KEY);
    let existing: Array<{ id: string; target: StorageTarget; createdAt: string; rawValue: string }> = [];
    if (current) {
      try {
        const parsed = JSON.parse(current);
        if (Array.isArray(parsed)) {
          existing = parsed.filter((entry) => entry && typeof entry === 'object') as Array<{
            id: string;
            target: StorageTarget;
            createdAt: string;
            rawValue: string;
          }>;
        }
      } catch {
        existing = [];
      }
    }
    const next = [
      {
        id: crypto.randomUUID(),
        target,
        createdAt: new Date().toISOString(),
        rawValue,
      },
      ...existing,
    ].slice(0, 20);
    window.localStorage.setItem(INTEGRITY_REPAIR_BACKUP_STORAGE_KEY, JSON.stringify(next));
  };

  const applyIntegrityRepairs = (
    selectedIssueIds: string[],
  ): {
    ok: boolean;
    message: string;
    appliedCount: number;
    unresolvedCount: number;
  } => {
    if (selectedIssueIds.length === 0) {
      return { ok: false, message: 'No repairable issues selected.', appliedCount: 0, unresolvedCount: 0 };
    }
    runIntegrityAudit('before-repair');

    const operations = integrityRepairOperationsRef.current;
    const activeRawValue = safeReadStorageValue(LOCAL_STORAGE_KEY);
    const snapshotRawValue = safeReadStorageValue(LOCAL_SNAPSHOT_STORAGE_KEY);
    let activeTripDraft: Record<string, unknown> | null = null;
    let snapshotDraft: unknown[] | null = null;
    if (activeRawValue) {
      try {
        const parsed = JSON.parse(activeRawValue);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          activeTripDraft = parsed as Record<string, unknown>;
        }
      } catch {
        activeTripDraft = null;
      }
    }
    if (snapshotRawValue) {
      try {
        const parsed = JSON.parse(snapshotRawValue);
        if (Array.isArray(parsed)) {
          snapshotDraft = parsed;
        }
      } catch {
        snapshotDraft = null;
      }
    }

    const selectedSet = new Set(selectedIssueIds);
    const selectedIssues =
      integrityAuditReport?.issues.filter((issue) => selectedSet.has(issue.id) && issue.automaticRepairAvailable) ?? [];
    const activeTripWillChange = selectedIssues.some((issue) => issue.target === 'active-trip');
    const snapshotsWillChange = selectedIssues.some((issue) => issue.target === 'snapshot-history');

    if (activeTripWillChange) {
      const preRepairSnapshot = {
        ...makeSnapshot(history.present),
        pinned: true,
        label: 'Pre-repair active trip',
        notes: 'Auto-created before integrity repairs.',
      };
      setSnapshots((currentSnapshots) => applySnapshotRetention([preRepairSnapshot, ...currentSnapshots]));
    }

    if (snapshotsWillChange && snapshotRawValue !== null) {
      appendInternalRepairBackup('snapshot-history', snapshotRawValue);
    }

    let appliedCount = 0;
    for (const issueId of selectedIssueIds) {
      const operation = operations.get(issueId);
      if (!operation) {
        continue;
      }
      operation({ activeTripDraft, snapshotDraft });
      appliedCount += 1;
    }

    if (activeTripWillChange && activeTripDraft) {
      const serialized = JSON.stringify(activeTripDraft);
      window.localStorage.setItem(LOCAL_STORAGE_KEY, serialized);
      const reparsed = parsePersistedTripStorage(serialized);
      setHistory({
        past: [],
        present: reparsed.trip,
        future: [],
      });
      setActiveTripCorruption(reparsed.corruption);
      setActiveTripParseStatus(reparsed.parseStatus);
      setActiveTripRawPayloadSize(reparsed.rawPayloadSize);
      setActiveTripPersistenceError(null);
    }

    if (snapshotsWillChange && snapshotDraft) {
      const serialized = JSON.stringify(snapshotDraft);
      window.localStorage.setItem(LOCAL_SNAPSHOT_STORAGE_KEY, serialized);
      const reparsed = parsePersistedSnapshotStorage(serialized);
      setSnapshots(reparsed.snapshots);
      setSnapshotHistoryCorruption(reparsed.corruption);
      setSnapshotHistoryParseStatus(reparsed.parseStatus);
      setSnapshotHistoryRawPayloadSize(reparsed.rawPayloadSize);
      setSnapshotHistoryPersistenceError(null);
    }

    setLastSuccessfulPersistenceAt(new Date().toISOString());
    const nextReport = runIntegrityAudit('after-repair');
    return {
      ok: true,
      message: `Applied ${appliedCount} repair${appliedCount === 1 ? '' : 's'}.`,
      appliedCount,
      unresolvedCount: nextReport.issueCount,
    };
  };

  const clearIntegrityAudit = () => {
    setIntegrityAuditReport(null);
    integrityRepairOperationsRef.current = new Map();
  };

  const retryParseActiveTripStorage = (): { ok: boolean; message: string } => {
    const parsedResult = parsePersistedTripStorage(safeReadStorageValue(LOCAL_STORAGE_KEY));
    setActiveTripRawPayloadSize(parsedResult.rawPayloadSize);
    setActiveTripParseStatus(parsedResult.parseStatus);
    if (parsedResult.corruption) {
      setActiveTripCorruption(parsedResult.corruption);
      return { ok: false, message: parsedResult.corruption.message };
    }
    setActiveTripCorruption(null);
    setActiveTripPersistenceError(null);
    setHistory({
      past: [],
      present: parsedResult.trip,
      future: [],
    });
    return { ok: true, message: 'Active trip storage parsed successfully.' };
  };

  const retryParseSnapshotHistoryStorage = (): { ok: boolean; message: string } => {
    const parsedResult = parsePersistedSnapshotStorage(safeReadStorageValue(LOCAL_SNAPSHOT_STORAGE_KEY));
    setSnapshotHistoryRawPayloadSize(parsedResult.rawPayloadSize);
    setSnapshotHistoryParseStatus(parsedResult.parseStatus);
    if (parsedResult.corruption) {
      setSnapshotHistoryCorruption(parsedResult.corruption);
      return { ok: false, message: parsedResult.corruption.message };
    }
    setSnapshotHistoryCorruption(null);
    setSnapshotHistoryPersistenceError(null);
    setSnapshots(parsedResult.snapshots);
    return { ok: true, message: 'Snapshot history storage parsed successfully.' };
  };

  const resetCorruptedActiveTrip = (): { ok: boolean; message: string } => {
    const seeded = cloneTrip(seededTrip);
    const serialized = JSON.stringify(seeded);
    window.localStorage.setItem(LOCAL_STORAGE_KEY, serialized);
    setHistory({
      past: [],
      present: seeded,
      future: [],
    });
    setActiveTripCorruption(null);
    setActiveTripParseStatus('valid');
    setActiveTripRawPayloadSize(bytesInString(serialized));
    setActiveTripPersistenceError(null);
    setLastSuccessfulPersistenceAt(new Date().toISOString());
    return { ok: true, message: 'Corrupted active trip reset to seeded trip.' };
  };

  const clearCorruptedSnapshotHistory = (): { ok: boolean; message: string } => {
    window.localStorage.removeItem(LOCAL_SNAPSHOT_STORAGE_KEY);
    setSnapshots([]);
    setSnapshotHistoryCorruption(null);
    setSnapshotHistoryParseStatus('missing');
    setSnapshotHistoryRawPayloadSize(0);
    setSnapshotHistoryPersistenceError(null);
    setLastSuccessfulPersistenceAt(new Date().toISOString());
    return { ok: true, message: 'Corrupted snapshot history has been cleared.' };
  };

  const buildCorruptedRawPayloadExport = (target: StorageTarget): string => {
    const key = target === 'active-trip' ? LOCAL_STORAGE_KEY : LOCAL_SNAPSHOT_STORAGE_KEY;
    const rawValue = safeReadStorageValue(key);
    if (rawValue === null) {
      throw new Error(`No raw payload found for ${target}.`);
    }
    return JSON.stringify(
      {
        target,
        storageKey: key,
        exportedAt: new Date().toISOString(),
        rawValue,
      },
      null,
      2,
    );
  };

  const corruptedRawPayloadFileName = (target: StorageTarget): string =>
    target === 'active-trip'
      ? `travel-buddy-corrupt-trip-${formatDiagnosticsTimestamp(new Date())}.json`
      : `travel-buddy-corrupt-snapshots-${formatDiagnosticsTimestamp(new Date())}.json`;

  const mostRecentPersistenceError = useMemo(() => {
    if (!activeTripPersistenceError && !snapshotHistoryPersistenceError) {
      return null;
    }
    if (!activeTripPersistenceError) {
      return snapshotHistoryPersistenceError;
    }
    if (!snapshotHistoryPersistenceError) {
      return activeTripPersistenceError;
    }
    return new Date(activeTripPersistenceError.occurredAt) >= new Date(snapshotHistoryPersistenceError.occurredAt)
      ? activeTripPersistenceError
      : snapshotHistoryPersistenceError;
  }, [activeTripPersistenceError, snapshotHistoryPersistenceError]);

  const storageHealth = useMemo<StorageHealthSummary>(() => {
    const pinnedSnapshotCount = snapshots.filter((snapshot) => snapshot.pinned).length;
    const unpinnedSnapshotCount = snapshots.length - pinnedSnapshotCount;
    return {
      activeTripStorageStatus: activeTripPersistenceError || activeTripCorruption ? 'error' : 'healthy',
      snapshotHistoryStorageStatus: snapshotHistoryPersistenceError || snapshotHistoryCorruption ? 'error' : 'healthy',
      totalSnapshotCount: snapshots.length,
      pinnedSnapshotCount,
      unpinnedSnapshotCount,
      estimatedStoredBytes: bytesInString(JSON.stringify(history.present)) + bytesInString(JSON.stringify(snapshots)),
      lastSuccessfulPersistenceAt,
      mostRecentPersistenceError,
      activeTripPersistenceError,
      snapshotHistoryPersistenceError,
    };
  }, [
    activeTripCorruption,
    activeTripPersistenceError,
    history.present,
    lastSuccessfulPersistenceAt,
    mostRecentPersistenceError,
    snapshotHistoryCorruption,
    snapshotHistoryPersistenceError,
    snapshots,
  ]);

  const storageDiagnostics = useMemo<StorageDiagnosticsSummary>(() => {
    const pinnedSnapshotCount = snapshots.filter((snapshot) => snapshot.pinned).length;
    const unpinnedSnapshotCount = snapshots.length - pinnedSnapshotCount;
    return {
      applicationVersion: APPLICATION_VERSION,
      backupVersion: BACKUP_VERSION,
      snapshotHistoryVersion: SNAPSHOT_HISTORY_VERSION,
      activeTripStorageKey: LOCAL_STORAGE_KEY,
      snapshotHistoryStorageKey: LOCAL_SNAPSHOT_STORAGE_KEY,
      activeTripRawPayloadSize,
      snapshotHistoryRawPayloadSize,
      totalEstimatedStoredSize: activeTripRawPayloadSize + snapshotHistoryRawPayloadSize,
      activeTripParseStatus,
      snapshotHistoryParseStatus,
      lastSuccessfulPersistenceAt,
      latestActiveTripPersistenceError: activeTripPersistenceError,
      latestSnapshotHistoryPersistenceError: snapshotHistoryPersistenceError,
      totalSnapshotCount: snapshots.length,
      pinnedSnapshotCount,
      unpinnedSnapshotCount,
      browserTimestamp: new Date().toISOString(),
    };
  }, [
    activeTripParseStatus,
    activeTripPersistenceError,
    activeTripRawPayloadSize,
    lastSuccessfulPersistenceAt,
    snapshotHistoryParseStatus,
    snapshotHistoryPersistenceError,
    snapshotHistoryRawPayloadSize,
    snapshots,
  ]);

  const diagnosticsFileName = (): string => `travel-buddy-diagnostics-${formatDiagnosticsTimestamp(new Date())}.json`;

  const toDiagnosticsJson = (): string =>
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        applicationVersion: storageDiagnostics.applicationVersion,
        backupVersion: storageDiagnostics.backupVersion,
        snapshotHistoryVersion: storageDiagnostics.snapshotHistoryVersion,
        activeTripStorageKey: storageDiagnostics.activeTripStorageKey,
        snapshotHistoryStorageKey: storageDiagnostics.snapshotHistoryStorageKey,
        activeTripRawPayloadSize: storageDiagnostics.activeTripRawPayloadSize,
        snapshotHistoryRawPayloadSize: storageDiagnostics.snapshotHistoryRawPayloadSize,
        totalEstimatedStoredSize: storageDiagnostics.totalEstimatedStoredSize,
        activeTripParseStatus: storageDiagnostics.activeTripParseStatus,
        snapshotHistoryParseStatus: storageDiagnostics.snapshotHistoryParseStatus,
        lastSuccessfulPersistenceAt: storageDiagnostics.lastSuccessfulPersistenceAt,
        latestActiveTripPersistenceError: storageDiagnostics.latestActiveTripPersistenceError,
        latestSnapshotHistoryPersistenceError: storageDiagnostics.latestSnapshotHistoryPersistenceError,
        totalSnapshotCount: storageDiagnostics.totalSnapshotCount,
        pinnedSnapshotCount: storageDiagnostics.pinnedSnapshotCount,
        unpinnedSnapshotCount: storageDiagnostics.unpinnedSnapshotCount,
        browserTimestamp: storageDiagnostics.browserTimestamp,
      },
      null,
      2,
    );

  return {
    trip: history.present,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    sortedStops: sortStops(history.present.stops),
    addStop,
    editStop,
    deleteStop,
    duplicateStop,
    undo,
    redo,
    moveStop,
    searchStops,
    replaceTrip,
    parseTripBackup,
    toBackupJson,
    backupFileName,
    toSnapshotHistoryJson,
    snapshotHistoryFileName,
    resetTrip,
    clearLocalData,
    importTrip,
    parseTripBackupPreview,
    parseSnapshotHistoryBackup,
    snapshots,
    restoreSnapshot,
    deleteSnapshot,
    setSnapshotPinned,
    importSnapshotHistory,
    updateSnapshotDetails,
    getCleanupPreviewCount,
    cleanupSnapshots,
    retryPersistActiveTrip,
    retryPersistSnapshotHistory,
    retryPersistAll,
    retryParseActiveTripStorage,
    retryParseSnapshotHistoryStorage,
    resetCorruptedActiveTrip,
    clearCorruptedSnapshotHistory,
    activeTripCorruption,
    snapshotHistoryCorruption,
    storageDiagnostics,
    toDiagnosticsJson,
    diagnosticsFileName,
    buildCorruptedRawPayloadExport,
    corruptedRawPayloadFileName,
    integrityAuditReport,
    integrityAuditRuns,
    selectedIntegrityBaselineRunId,
    latestVsBaselineChangeSummary,
    runIntegrityAudit,
    applyIntegrityRepairs,
    clearIntegrityAudit,
    toIntegrityAuditJson,
    integrityAuditFileName,
    toIntegrityHistoryJson,
    integrityHistoryFileName,
    parseIntegrityHistoryBackup,
    importIntegrityHistory,
    setIntegrityBaselineRun,
    clearIntegrityBaselineRun,
    deleteIntegrityRun,
    clearIntegrityHistory,
    storageHealth,
    storageKeys: {
      activeTrip: LOCAL_STORAGE_KEY,
      snapshotHistory: LOCAL_SNAPSHOT_STORAGE_KEY,
    },
    snapshotLabelLimit: SNAPSHOT_LABEL_LIMIT,
    snapshotNotesLimit: SNAPSHOT_NOTES_LIMIT,
    unpinnedSnapshotLimit: UNPINNED_SNAPSHOT_LIMIT,
  };
}
