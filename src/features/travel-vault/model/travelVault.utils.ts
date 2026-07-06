import type {
  VaultCountsByType,
  VaultFileKind,
  VaultFilters,
  VaultItem,
  VaultItemDraft,
  VaultItemType,
} from './travelVault.types';
import { VAULT_FILE_KINDS, VAULT_ITEM_TYPES } from './travelVault.types';

export const DEFAULT_VAULT_FILTERS: VaultFilters = {
  query: '',
  type: 'all',
  fileKind: 'all',
  tag: 'all',
  hasExpiry: 'all',
  sort: 'recent',
};

const EXPIRY_TYPES: VaultItemType[] = ['passport', 'visa', 'insurance'];

export function formatVaultTypeLabel(type: string) {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export function createVaultSearchText(input: {
  title?: string;
  description?: string;
  notes?: string;
  tags?: string[];
  vendor?: string;
  confirmationCode?: string;
  type?: string;
  category?: string;
  fileName?: string;
}) {
  return [
    input.title,
    input.description,
    input.notes,
    input.tags?.join(' '),
    input.vendor,
    input.confirmationCode,
    input.type,
    input.category,
    input.fileName,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export function buildVaultItem(tripId: string, draft: VaultItemDraft): VaultItem {
  const timestamp = new Date().toISOString();
  const tags = draft.tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean);

  return {
    id: `vault-${Math.random().toString(36).slice(2, 10)}`,
    tripId,
    type: draft.type,
    category: draft.category,
    title: draft.title.trim(),
    description: draft.description?.trim() || undefined,
    notes: draft.notes?.trim() || undefined,
    tags,
    fileKind: draft.fileKind,
    fileName: draft.fileName?.trim() || undefined,
    mimeType: draft.mimeType?.trim() || undefined,
    localPath: draft.localPath?.trim() || undefined,
    previewUrl: draft.previewUrl?.trim() || undefined,
    sizeBytes: typeof draft.sizeBytes === 'number' ? draft.sizeBytes : undefined,
    issuedAt: draft.issuedAt || undefined,
    expiresAt: draft.expiresAt || undefined,
    vendor: draft.vendor?.trim() || undefined,
    confirmationCode: draft.confirmationCode?.trim() || undefined,
    amount: typeof draft.amount === 'number' ? draft.amount : undefined,
    currency: draft.currency?.trim() || undefined,
    searchText: createVaultSearchText({
      title: draft.title,
      description: draft.description,
      notes: draft.notes,
      tags,
      vendor: draft.vendor,
      confirmationCode: draft.confirmationCode,
      type: draft.type,
      category: draft.category,
      fileName: draft.fileName,
    }),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function getVaultCountsByType(vaultItems: VaultItem[]): VaultCountsByType {
  const initialCounts = Object.fromEntries(VAULT_ITEM_TYPES.map((type) => [type, 0])) as VaultCountsByType;
  return vaultItems.reduce((counts, item) => {
    counts[item.type] += 1;
    return counts;
  }, initialCounts);
}

export function getVaultExpiringSoonCount(vaultItems: VaultItem[], now: Date = new Date()) {
  const soonThreshold = now.getTime() + 30 * 24 * 60 * 60 * 1000;
  return vaultItems.filter((item) => {
    if (!item.expiresAt || !EXPIRY_TYPES.includes(item.type)) {
      return false;
    }
    const expiry = new Date(item.expiresAt).getTime();
    return Number.isFinite(expiry) && expiry <= soonThreshold;
  }).length;
}

function matchesQuery(item: VaultItem, query: string) {
  if (!query.trim()) {
    return true;
  }
  return item.searchText.includes(query.trim().toLowerCase());
}

export function filterVaultItems(vaultItems: VaultItem[], filters: VaultFilters) {
  return vaultItems.filter((item) => {
    if (filters.type !== 'all' && item.type !== filters.type) {
      return false;
    }
    if (filters.fileKind !== 'all' && item.fileKind !== filters.fileKind) {
      return false;
    }
    if (filters.tag !== 'all' && !item.tags.includes(filters.tag)) {
      return false;
    }
    if (filters.hasExpiry !== 'all') {
      const hasExpiry = Boolean(item.expiresAt);
      if (filters.hasExpiry !== hasExpiry) {
        return false;
      }
    }
    return matchesQuery(item, filters.query);
  });
}

export function sortVaultItems(vaultItems: VaultItem[], sortMode: VaultFilters['sort']) {
  const sorted = [...vaultItems];
  if (sortMode === 'recent') {
    return sorted.sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());
  }
  if (sortMode === 'expiry') {
    return sorted.sort((left, right) => {
      const leftExpiry = left.expiresAt ? new Date(left.expiresAt).getTime() : Number.POSITIVE_INFINITY;
      const rightExpiry = right.expiresAt ? new Date(right.expiresAt).getTime() : Number.POSITIVE_INFINITY;
      return leftExpiry - rightExpiry;
    });
  }
  if (sortMode === 'type') {
    return sorted.sort((left, right) => left.type.localeCompare(right.type));
  }
  return sorted.sort((left, right) => left.title.localeCompare(right.title));
}

export function getVaultSearchResults(vaultItems: VaultItem[], query: string) {
  if (!query.trim()) {
    return vaultItems;
  }
  const normalized = query.trim().toLowerCase();
  return vaultItems.filter((item) => item.searchText.includes(normalized));
}

export function getVaultAllTags(vaultItems: VaultItem[]) {
  const tags = new Set<string>();
  vaultItems.forEach((item) => item.tags.forEach((tag) => tags.add(tag)));
  return Array.from(tags).sort();
}

export function isValidVaultType(type: string): type is VaultItemType {
  return VAULT_ITEM_TYPES.includes(type as VaultItemType);
}

export function isValidVaultFileKind(fileKind: string): fileKind is VaultFileKind {
  return VAULT_FILE_KINDS.includes(fileKind as VaultFileKind);
}
