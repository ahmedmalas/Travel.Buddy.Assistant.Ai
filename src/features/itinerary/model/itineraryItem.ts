import type { CreateItineraryItemInput, ItineraryItem, UpdateItineraryItemInput } from './types';

const nowIso = () => new Date().toISOString();

export function createItineraryItem(input: CreateItineraryItemInput): ItineraryItem {
  const timestamp = nowIso();
  return {
    ...input,
    id: crypto.randomUUID(),
    createdAt: timestamp,
    updatedAt: timestamp,
    tags: [...input.tags],
    linkedVaultItemIds: [...input.linkedVaultItemIds],
  };
}

export function updateItineraryItem(item: ItineraryItem, input: UpdateItineraryItemInput): ItineraryItem {
  return {
    ...item,
    ...input,
    tags: input.tags ? [...input.tags] : item.tags,
    linkedVaultItemIds: input.linkedVaultItemIds ? [...input.linkedVaultItemIds] : item.linkedVaultItemIds,
    updatedAt: nowIso(),
  };
}

export function duplicateItineraryItem(item: ItineraryItem): ItineraryItem {
  const timestamp = nowIso();
  return {
    ...item,
    id: crypto.randomUUID(),
    title: `${item.title} (Copy)`,
    status: 'planned',
    createdAt: timestamp,
    updatedAt: timestamp,
    tags: [...item.tags],
    linkedVaultItemIds: [...item.linkedVaultItemIds],
  };
}
