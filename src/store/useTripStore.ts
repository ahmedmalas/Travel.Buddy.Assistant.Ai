import { useEffect, useMemo, useState } from 'react';
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

type SnapshotHistoryBackup = {
  schema: 'travel-buddy-snapshot-history';
  snapshotHistoryVersion: number;
  applicationVersion: string;
  exportedAt: string;
  totalSnapshotCount: number;
  snapshots: BackupSnapshot[];
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

export function useTripStore() {
  const initialActiveTripStorage = parsePersistedTripStorage(safeReadStorageValue(LOCAL_STORAGE_KEY));
  const initialSnapshotStorage = parsePersistedSnapshotStorage(safeReadStorageValue(LOCAL_SNAPSHOT_STORAGE_KEY));
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
