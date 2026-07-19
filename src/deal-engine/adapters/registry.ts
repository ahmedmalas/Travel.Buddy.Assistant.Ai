import { MOCK_ADAPTERS } from './mockAdapters';
import type { TravelProviderAdapter } from './types';
import type { InventoryCategory } from '../types';

const liveAdapters: TravelProviderAdapter[] = [];

/** Live adapters must only be registered after credentials + explicit approval. */
export function registerLiveAdapter(adapter: TravelProviderAdapter): void {
  if (!adapter.isLive) {
    throw new Error('registerLiveAdapter requires adapter.isLive === true');
  }
  if (liveAdapters.some((entry) => entry.providerId === adapter.providerId)) {
    throw new Error(`Adapter already registered: ${adapter.providerId}`);
  }
  liveAdapters.push(adapter);
}

export function clearLiveAdapters(): void {
  liveAdapters.length = 0;
}

export function listAdapters(options?: { includeLive?: boolean }): TravelProviderAdapter[] {
  const includeLive = options?.includeLive ?? true;
  return [...MOCK_ADAPTERS, ...(includeLive ? liveAdapters : [])];
}

export function adaptersForCategory(category: InventoryCategory): TravelProviderAdapter[] {
  return listAdapters().filter((adapter) => adapter.categories.includes(category));
}

export function getAdapter(providerId: string): TravelProviderAdapter | undefined {
  return listAdapters().find((adapter) => adapter.providerId === providerId);
}
