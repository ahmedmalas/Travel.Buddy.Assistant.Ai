import { useCallback, useEffect, useMemo, useState } from 'react';
import { buildItinerarySearchIndex } from '../../itinerary/adapters/search';
import { createItineraryItem, duplicateItineraryItem, updateItineraryItem } from '../../itinerary/model/itineraryItem';
import type { CreateItineraryItemInput, UpdateItineraryItemInput } from '../../itinerary/model/types';
import { loadPersistedTrip, persistTrip } from '../data/persistence';
import { sampleTrip } from '../data/sampleTrip';
import { defaultItineraryFilters, type ItineraryFilterState, type Trip } from '../model/trip';

type UseTripStore = {
  trip: Trip;
  filters: ItineraryFilterState;
  setFilters: (updater: (prev: ItineraryFilterState) => ItineraryFilterState) => void;
  addItineraryItem: (input: CreateItineraryItemInput) => void;
  updateItineraryItem: (input: UpdateItineraryItemInput) => void;
  removeItineraryItem: (id: string) => void;
  duplicateItineraryItem: (id: string) => void;
};

function addSearchIndex(index: Record<string, string>, id: string, value: string): Record<string, string> {
  return { ...index, [id]: value };
}

function removeSearchIndex(index: Record<string, string>, id: string): Record<string, string> {
  const { [id]: _removed, ...next } = index;
  return next;
}

export function useTripStore(): UseTripStore {
  const [trip, setTrip] = useState<Trip>(() => loadPersistedTrip(sampleTrip));
  const [filters, setFiltersState] = useState<ItineraryFilterState>(defaultItineraryFilters);

  const setFilters = useCallback((updater: (prev: ItineraryFilterState) => ItineraryFilterState) => {
    setFiltersState((prev) => updater(prev));
  }, []);

  const addItem = useCallback((input: CreateItineraryItemInput) => {
    setTrip((prev) => {
      const createdItem = createItineraryItem(input);
      return {
        ...prev,
        itineraryItems: [...prev.itineraryItems, createdItem],
        itinerarySearchIndex: addSearchIndex(prev.itinerarySearchIndex, createdItem.id, buildItinerarySearchIndex(createdItem)),
        updatedAt: new Date().toISOString(),
      };
    });
  }, []);

  const updateItem = useCallback((input: UpdateItineraryItemInput) => {
    setTrip((prev) => {
      const current = prev.itineraryItems.find((item) => item.id === input.id);
      if (!current) return prev;

      const nextItem = updateItineraryItem(current, input);
      return {
        ...prev,
        itineraryItems: prev.itineraryItems.map((item) => (item.id === input.id ? nextItem : item)),
        itinerarySearchIndex: addSearchIndex(prev.itinerarySearchIndex, nextItem.id, buildItinerarySearchIndex(nextItem)),
        updatedAt: new Date().toISOString(),
      };
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setTrip((prev) => ({
      ...prev,
      itineraryItems: prev.itineraryItems.filter((item) => item.id !== id),
      itinerarySearchIndex: removeSearchIndex(prev.itinerarySearchIndex, id),
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const duplicateItem = useCallback((id: string) => {
    setTrip((prev) => {
      const source = prev.itineraryItems.find((item) => item.id === id);
      if (!source) return prev;
      const duplicated = duplicateItineraryItem(source);
      return {
        ...prev,
        itineraryItems: [...prev.itineraryItems, duplicated],
        itinerarySearchIndex: addSearchIndex(prev.itinerarySearchIndex, duplicated.id, buildItinerarySearchIndex(duplicated)),
        updatedAt: new Date().toISOString(),
      };
    });
  }, []);

  useEffect(() => {
    persistTrip(trip);
  }, [trip]);

  return useMemo(
    () => ({
      trip,
      filters,
      setFilters,
      addItineraryItem: addItem,
      updateItineraryItem: updateItem,
      removeItineraryItem: removeItem,
      duplicateItineraryItem: duplicateItem,
    }),
    [trip, filters, setFilters, addItem, updateItem, removeItem, duplicateItem],
  );
}
