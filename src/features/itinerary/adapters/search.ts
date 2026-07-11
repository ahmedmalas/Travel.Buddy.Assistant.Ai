import { normalizeSearchValue } from './normalize';
import type { ItineraryItem } from '../model/types';

export function buildItinerarySearchIndex(item: ItineraryItem): string {
  const tags = item.tags.join(' ');
  const values = [
    item.title,
    item.description,
    item.notes,
    item.supplier,
    item.confirmationNumber,
    item.location,
    tags,
  ];
  return normalizeSearchValue(values.join(' '));
}

export function matchesQuery(indexValue: string, query: string): boolean {
  if (!query) return true;
  const normalizedQuery = normalizeSearchValue(query);
  return !normalizedQuery || indexValue.includes(normalizedQuery);
}
