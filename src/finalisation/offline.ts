/**
 * Slice 91 — Offline-first experience helpers.
 */

export type NetworkMode = 'online' | 'offline' | 'unknown';
export type OfflineUiMode = 'full' | 'read_only_degraded';

export interface OfflineState {
  network: NetworkMode;
  uiMode: OfflineUiMode;
  lastOnlineAt: string | null;
  lastOfflineAt: string | null;
  conflictSummaries: string[];
  cacheKeys: string[];
  recoveredAt: string | null;
  message: string;
}

export interface CacheInventoryItem {
  key: string;
  bytes: number;
  category: 'trip' | 'vault' | 'sync' | 'deal' | 'other';
}

export function createOfflineState(network: NetworkMode = 'unknown'): OfflineState {
  const now = new Date().toISOString();
  return {
    network,
    uiMode: network === 'offline' ? 'read_only_degraded' : 'full',
    lastOnlineAt: network === 'online' ? now : null,
    lastOfflineAt: network === 'offline' ? now : null,
    conflictSummaries: [],
    cacheKeys: [],
    recoveredAt: null,
    message:
      network === 'offline'
        ? 'Offline — local data remains available; cloud sync pauses until connectivity returns.'
        : 'Online — full interactive mode.',
  };
}

export function applyNetworkChange(state: OfflineState, network: NetworkMode): OfflineState {
  const now = new Date().toISOString();
  if (network === state.network) return state;
  if (network === 'offline') {
    return {
      ...state,
      network,
      uiMode: 'read_only_degraded',
      lastOfflineAt: now,
      message: 'Offline — edits that require cloud sync are queued; local trip data stays readable.',
      recoveredAt: null,
    };
  }
  return {
    ...state,
    network: 'online',
    uiMode: 'full',
    lastOnlineAt: now,
    recoveredAt: now,
    message: 'Back online — sync queue can flush when cloud mode is configured.',
  };
}

export function attachConflictSummaries(state: OfflineState, summaries: string[]): OfflineState {
  return {
    ...state,
    conflictSummaries: [...summaries],
    message:
      summaries.length > 0
        ? `${state.message} ${summaries.length} sync conflict(s) need review.`
        : state.message,
  };
}

export function inventoryLocalCache(storage: Storage = window.localStorage): CacheInventoryItem[] {
  const items: CacheInventoryItem[] = [];
  for (let i = 0; i < storage.length; i += 1) {
    const key = storage.key(i);
    if (!key) continue;
    const value = storage.getItem(key) ?? '';
    const category: CacheInventoryItem['category'] = key.includes('vault')
      ? 'vault'
      : key.includes('sync')
        ? 'sync'
        : key.includes('deal-engine')
          ? 'deal'
          : key.includes('trip')
            ? 'trip'
            : 'other';
    items.push({ key, bytes: value.length, category });
  }
  return items.sort((a, b) => b.bytes - a.bytes);
}

export function manageLocalCache(
  storage: Storage,
  options?: { dropPrefix?: string; maxKeys?: number },
): { removed: string[]; remaining: number } {
  const removed: string[] = [];
  if (options?.dropPrefix) {
    const keys: string[] = [];
    for (let i = 0; i < storage.length; i += 1) {
      const key = storage.key(i);
      if (key?.startsWith(options.dropPrefix)) keys.push(key);
    }
    for (const key of keys) {
      storage.removeItem(key);
      removed.push(key);
    }
  }
  if (options?.maxKeys != null && storage.length > options.maxKeys) {
    const inventory = inventoryLocalCache(storage).filter((item) => item.category === 'other');
    for (const item of inventory) {
      if (storage.length <= options.maxKeys) break;
      storage.removeItem(item.key);
      removed.push(item.key);
    }
  }
  return { removed, remaining: storage.length };
}

export function isCloudMutationAllowed(state: OfflineState): boolean {
  return state.network === 'online' && state.uiMode === 'full';
}
