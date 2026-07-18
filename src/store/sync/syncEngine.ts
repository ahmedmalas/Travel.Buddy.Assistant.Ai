import { SYNC_QUEUE_STORAGE_KEY } from '../storeConstants';

export type SyncEntityType =
  | 'trip'
  | 'booking'
  | 'expense'
  | 'traveller'
  | 'document'
  | 'template'
  | 'collaboration';

export type SyncChangeStatus = 'pending' | 'syncing' | 'synced' | 'failed' | 'conflict';

export type SyncChange = {
  id: string;
  entityType: SyncEntityType;
  entityId: string;
  tripId: string | null;
  revision: number;
  payloadDigest: string;
  status: SyncChangeStatus;
  attempts: number;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SyncConflict = {
  id: string;
  changeId: string;
  entityType: SyncEntityType;
  entityId: string;
  localRevision: number;
  remoteRevision: number;
  message: string;
  detectedAt: string;
};

export type SyncNetworkState = 'online' | 'offline';

export type SyncEngineState = {
  queue: SyncChange[];
  conflicts: SyncConflict[];
  network: SyncNetworkState;
  lastSyncAt: string | null;
  lastSyncMessage: string | null;
  isSyncing: boolean;
};

export const createEmptySyncState = (): SyncEngineState => ({
  queue: [],
  conflicts: [],
  network: typeof navigator !== 'undefined' && navigator.onLine === false ? 'offline' : 'online',
  lastSyncAt: null,
  lastSyncMessage: null,
  isSyncing: false,
});

export const loadSyncState = (): SyncEngineState => {
  try {
    const raw = window.localStorage.getItem(SYNC_QUEUE_STORAGE_KEY);
    if (!raw) return createEmptySyncState();
    const parsed = JSON.parse(raw) as Partial<SyncEngineState>;
    return {
      ...createEmptySyncState(),
      ...parsed,
      queue: Array.isArray(parsed.queue) ? parsed.queue : [],
      conflicts: Array.isArray(parsed.conflicts) ? parsed.conflicts : [],
    };
  } catch {
    return createEmptySyncState();
  }
};

export const persistSyncState = (state: SyncEngineState): void => {
  try {
    window.localStorage.setItem(SYNC_QUEUE_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Keep in-memory queue if persistence fails.
  }
};

export const digestPayload = (payload: unknown): string => {
  const text = JSON.stringify(payload);
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
  }
  return `d${hash.toString(16)}`;
};

export const enqueueChange = (
  state: SyncEngineState,
  input: {
    entityType: SyncEntityType;
    entityId: string;
    tripId?: string | null;
    revision: number;
    payload: unknown;
  },
): SyncEngineState => {
  const now = new Date().toISOString();
  const existing = state.queue.find(
    (change) =>
      change.entityType === input.entityType &&
      change.entityId === input.entityId &&
      (change.status === 'pending' || change.status === 'failed'),
  );
  if (existing) {
    return {
      ...state,
      queue: state.queue.map((change) =>
        change.id === existing.id
          ? {
              ...change,
              revision: input.revision,
              payloadDigest: digestPayload(input.payload),
              status: 'pending',
              updatedAt: now,
              lastError: null,
            }
          : change,
      ),
    };
  }
  const change: SyncChange = {
    id: crypto.randomUUID(),
    entityType: input.entityType,
    entityId: input.entityId,
    tripId: input.tripId ?? null,
    revision: input.revision,
    payloadDigest: digestPayload(input.payload),
    status: 'pending',
    attempts: 0,
    lastError: null,
    createdAt: now,
    updatedAt: now,
  };
  return { ...state, queue: [change, ...state.queue].slice(0, 200) };
};

/**
 * Deterministic conflict detector: a remote revision ahead of the queued local revision
 * with a different digest indicates a conflict.
 */
export const detectSyncConflict = (
  change: SyncChange,
  remote: { revision: number; payloadDigest: string },
): SyncConflict | null => {
  if (remote.revision > change.revision && remote.payloadDigest !== change.payloadDigest) {
    return {
      id: `conflict-${change.id}`,
      changeId: change.id,
      entityType: change.entityType,
      entityId: change.entityId,
      localRevision: change.revision,
      remoteRevision: remote.revision,
      message: `Conflict on ${change.entityType} ${change.entityId}: local r${change.revision} vs remote r${remote.revision}.`,
      detectedAt: new Date().toISOString(),
    };
  }
  return null;
};

export const runManualSync = (
  state: SyncEngineState,
  remoteLookup: (change: SyncChange) => { revision: number; payloadDigest: string } | null = () => null,
): SyncEngineState => {
  if (state.network === 'offline') {
    return {
      ...state,
      isSyncing: false,
      lastSyncMessage: 'Cannot sync while offline.',
    };
  }
  const now = new Date().toISOString();
  const conflicts: SyncConflict[] = [...state.conflicts];
  const queue = state.queue.map((change) => {
    if (change.status === 'synced' || change.status === 'conflict') {
      return change;
    }
    const remote = remoteLookup(change);
    if (remote) {
      const conflict = detectSyncConflict(change, remote);
      if (conflict) {
        conflicts.push(conflict);
        return { ...change, status: 'conflict' as const, attempts: change.attempts + 1, updatedAt: now, lastError: conflict.message };
      }
    }
    // Local-only foundation: mark pending changes as synced after a successful local pass.
    return {
      ...change,
      status: 'synced' as const,
      attempts: change.attempts + 1,
      updatedAt: now,
      lastError: null,
    };
  });
  return {
    ...state,
    queue,
    conflicts: conflicts.slice(0, 100),
    isSyncing: false,
    lastSyncAt: now,
    lastSyncMessage:
      conflicts.length > state.conflicts.length
        ? `Sync finished with ${conflicts.length - state.conflicts.length} new conflict(s).`
        : 'Local sync pass completed (no remote provider connected).',
  };
};

export const retryFailedChanges = (state: SyncEngineState): SyncEngineState => ({
  ...state,
  queue: state.queue.map((change) =>
    change.status === 'failed' || change.status === 'conflict'
      ? { ...change, status: 'pending', lastError: null, updatedAt: new Date().toISOString() }
      : change,
  ),
  lastSyncMessage: 'Re-queued failed/conflicted changes for retry.',
});

export const setNetworkState = (state: SyncEngineState, network: SyncNetworkState): SyncEngineState => ({
  ...state,
  network,
  lastSyncMessage: network === 'offline' ? 'You are offline. Changes will queue locally.' : 'Back online.',
});

export const syncQueueSummary = (state: SyncEngineState) => ({
  pending: state.queue.filter((change) => change.status === 'pending').length,
  failed: state.queue.filter((change) => change.status === 'failed').length,
  conflicts: state.conflicts.length,
  synced: state.queue.filter((change) => change.status === 'synced').length,
  network: state.network,
  lastSyncAt: state.lastSyncAt,
});
