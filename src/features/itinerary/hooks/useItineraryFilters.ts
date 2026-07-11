import type { ItineraryItemType, ItineraryStatus } from '../model/types';
import type { ItineraryFilterState } from '../../trip/model/trip';

type SetFilters = (updater: (prev: ItineraryFilterState) => ItineraryFilterState) => void;

export function useItineraryFilters(filters: ItineraryFilterState, setFilters: SetFilters) {
  return {
    setQuery: (query: string) => setFilters((prev) => ({ ...prev, query })),
    setType: (type: ItineraryItemType | 'all') => setFilters((prev) => ({ ...prev, type })),
    setStatus: (status: ItineraryStatus | 'all') => setFilters((prev) => ({ ...prev, status })),
    setDate: (date: string) => setFilters((prev) => ({ ...prev, date })),
    setTags: (tagsInput: string) =>
      setFilters((prev) => ({
        ...prev,
        tags: tagsInput
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      })),
    setSortDirection: (sortDirection: 'asc' | 'desc') => setFilters((prev) => ({ ...prev, sortDirection })),
    reset: () =>
      setFilters(() => ({
        query: '',
        type: 'all',
        status: 'all',
        date: '',
        tags: [],
        sortDirection: 'asc',
      })),
    tagsText: filters.tags.join(', '),
  };
}
