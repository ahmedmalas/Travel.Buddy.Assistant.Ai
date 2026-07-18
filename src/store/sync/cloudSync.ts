import type { TravelBuddyClient } from '../../lib/supabase/client';
import { getSupabaseClient } from '../../lib/supabase/client';
import {
  detectSyncConflict,
  digestPayload,
  enqueueChange,
  persistSyncState,
  retryFailedChanges,
  runManualSync,
  setNetworkState,
  type SyncChange,
  type SyncEngineState,
  type SyncEntityType,
} from './syncEngine';

export type CloudSyncResult = {
  state: SyncEngineState;
  pushed: number;
  pulled: number;
  conflicts: number;
  message: string;
  provider: 'supabase' | 'local-demo';
};

/** Deterministic resolution: keep the higher revision; on tie prefer remote digest. */
export const resolveConflictDeterministically = (
  state: SyncEngineState,
  change: SyncChange,
  remote: { revision: number; payloadDigest: string },
): SyncEngineState => {
  const conflict = detectSyncConflict(change, remote);
  const keepRemote = remote.revision > change.revision ||
    (remote.revision === change.revision && remote.payloadDigest !== change.payloadDigest);
  const now = new Date().toISOString();
  return {
    ...state,
    conflicts: conflict ? [conflict, ...state.conflicts].slice(0, 100) : state.conflicts,
    queue: state.queue.map((entry) =>
      entry.id === change.id
        ? {
            ...entry,
            status: keepRemote ? 'synced' : 'pending',
            revision: Math.max(entry.revision, remote.revision),
            payloadDigest: keepRemote ? remote.payloadDigest : entry.payloadDigest,
            lastError: keepRemote ? 'Resolved by keeping higher remote revision.' : entry.lastError,
            updatedAt: now,
            attempts: entry.attempts + 1,
          }
        : entry,
    ),
  };
};

export const detectRevisionConflict = (localRevision: number, remoteRevision: number): boolean =>
  remoteRevision > localRevision;

const entityTable = (entityType: SyncEntityType): 'trips' | 'trip_templates' | 'document_objects' | null => {
  if (entityType === 'trip') return 'trips';
  if (entityType === 'template') return 'trip_templates';
  if (entityType === 'document') return 'document_objects';
  return null;
};

export async function pushQueuedChanges(
  state: SyncEngineState,
  client: TravelBuddyClient | null = getSupabaseClient(),
): Promise<CloudSyncResult> {
  if (!client || state.network === 'offline') {
    const local = runManualSync(state);
    persistSyncState(local);
    return {
      state: local,
      pushed: local.queue.filter((change) => change.status === 'synced').length,
      pulled: 0,
      conflicts: local.conflicts.length,
      message: local.lastSyncMessage ?? 'Local sync completed (no cloud provider).',
      provider: 'local-demo',
    };
  }

  let next: SyncEngineState = { ...state, isSyncing: true };
  let pushed = 0;
  const pending = next.queue.filter((change) => change.status === 'pending' || change.status === 'failed');

  for (const change of pending) {
    const table = entityTable(change.entityType);
    if (!table) {
      next = {
        ...next,
        queue: next.queue.map((entry) =>
          entry.id === change.id
            ? { ...entry, status: 'synced', updatedAt: new Date().toISOString(), lastError: null }
            : entry,
        ),
      };
      pushed += 1;
      continue;
    }

    const { data: remote, error: readError } = await client
      .from('sync_revisions')
      .select('revision,payload_digest')
      .eq('entity_type', change.entityType)
      .eq('entity_id', change.entityId)
      .maybeSingle();

    if (readError) {
      next = {
        ...next,
        queue: next.queue.map((entry) =>
          entry.id === change.id
            ? {
                ...entry,
                status: 'failed',
                attempts: entry.attempts + 1,
                lastError: readError.message,
                updatedAt: new Date().toISOString(),
              }
            : entry,
        ),
      };
      continue;
    }

    if (remote && detectSyncConflict(change, { revision: remote.revision, payloadDigest: remote.payload_digest })) {
      next = resolveConflictDeterministically(next, change, {
        revision: remote.revision,
        payloadDigest: remote.payload_digest,
      });
      continue;
    }

    const nextRevision = Math.max(change.revision, (remote?.revision ?? 0) + 1);
    const { error: writeError } = await client.from('sync_revisions').upsert({
      entity_type: change.entityType,
      entity_id: change.entityId,
      trip_id: change.tripId,
      revision: nextRevision,
      payload_digest: change.payloadDigest,
    });

    if (writeError) {
      next = {
        ...next,
        queue: next.queue.map((entry) =>
          entry.id === change.id
            ? {
                ...entry,
                status: 'failed',
                attempts: entry.attempts + 1,
                lastError: writeError.message,
                updatedAt: new Date().toISOString(),
              }
            : entry,
        ),
      };
      continue;
    }

    next = {
      ...next,
      queue: next.queue.map((entry) =>
        entry.id === change.id
          ? {
              ...entry,
              status: 'synced',
              revision: nextRevision,
              attempts: entry.attempts + 1,
              lastError: null,
              updatedAt: new Date().toISOString(),
            }
          : entry,
      ),
    };
    pushed += 1;
  }

  next = {
    ...next,
    isSyncing: false,
    lastSyncAt: new Date().toISOString(),
    lastSyncMessage: `Cloud push complete: ${pushed} change(s), ${next.conflicts.length} conflict(s).`,
  };
  persistSyncState(next);
  return {
    state: next,
    pushed,
    pulled: 0,
    conflicts: next.conflicts.length,
    message: next.lastSyncMessage ?? 'Cloud sync complete.',
    provider: 'supabase',
  };
}

export async function pullRemoteRevisions(
  state: SyncEngineState,
  client: TravelBuddyClient | null = getSupabaseClient(),
): Promise<CloudSyncResult> {
  if (!client || state.network === 'offline') {
    return {
      state,
      pushed: 0,
      pulled: 0,
      conflicts: state.conflicts.length,
      message: 'Pull skipped — offline or cloud not configured.',
      provider: 'local-demo',
    };
  }

  const { data, error } = await client
    .from('sync_revisions')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(100);

  if (error) {
    const next = {
      ...state,
      lastSyncMessage: `Pull failed: ${error.message}`,
      lastSyncAt: new Date().toISOString(),
    };
    persistSyncState(next);
    return {
      state: next,
      pushed: 0,
      pulled: 0,
      conflicts: next.conflicts.length,
      message: next.lastSyncMessage ?? error.message,
      provider: 'supabase',
    };
  }

  let next = { ...state };
  let conflicts = 0;
  for (const remote of data ?? []) {
    const local = next.queue.find(
      (change) => change.entityType === remote.entity_type && change.entityId === remote.entity_id,
    );
    if (
      local &&
      detectSyncConflict(local, { revision: remote.revision, payloadDigest: remote.payload_digest })
    ) {
      next = resolveConflictDeterministically(next, local, {
        revision: remote.revision,
        payloadDigest: remote.payload_digest,
      });
      conflicts += 1;
    }
  }

  next = {
    ...next,
    lastSyncAt: new Date().toISOString(),
    lastSyncMessage: `Pulled ${data?.length ?? 0} revision(s); ${conflicts} conflict(s) resolved deterministically.`,
  };
  persistSyncState(next);
  return {
    state: next,
    pushed: 0,
    pulled: data?.length ?? 0,
    conflicts,
    message: next.lastSyncMessage ?? 'Pull complete.',
    provider: 'supabase',
  };
}

export async function runCloudSync(
  state: SyncEngineState,
  client: TravelBuddyClient | null = getSupabaseClient(),
): Promise<CloudSyncResult> {
  const pushed = await pushQueuedChanges(state, client);
  const pulled = await pullRemoteRevisions(pushed.state, client);
  return {
    state: pulled.state,
    pushed: pushed.pushed,
    pulled: pulled.pulled,
    conflicts: pulled.state.conflicts.length,
    message: `Sync finished — pushed ${pushed.pushed}, pulled ${pulled.pulled}, conflicts ${pulled.state.conflicts.length}.`,
    provider: pushed.provider,
  };
}

export function queueCloudChange(
  state: SyncEngineState,
  input: {
    entityType: SyncEntityType;
    entityId: string;
    tripId?: string | null;
    revision: number;
    payload: unknown;
  },
): SyncEngineState {
  const next = enqueueChange(state, {
    ...input,
    payload: input.payload ?? { digestSeed: digestPayload(input) },
  });
  persistSyncState(next);
  return next;
}

export { retryFailedChanges, setNetworkState, runManualSync };
