import { useCallback, useEffect, useMemo, useState } from 'react';
import { buildItinerarySearchIndex } from '../../itinerary/adapters/search';
import { createItineraryItem, duplicateItineraryItem, updateItineraryItem } from '../../itinerary/model/itineraryItem';
import type { CreateItineraryItemInput, ItineraryItem, UpdateItineraryItemInput } from '../../itinerary/model/types';
import { loadPersistedTrip, persistTrip } from '../data/persistence';
import { sampleTrip } from '../data/sampleTrip';
import { defaultItineraryFilters, type ItineraryFilterState, type Trip } from '../model/trip';

type UseTripStore = {
  trip: Trip;
  filters: ItineraryFilterState;
  canUndo: boolean;
  canRedo: boolean;
  setFilters: (updater: (prev: ItineraryFilterState) => ItineraryFilterState) => void;
  addItineraryItem: (input: CreateItineraryItemInput) => void;
  updateItineraryItem: (input: UpdateItineraryItemInput) => void;
  removeItineraryItem: (id: string) => void;
  duplicateItineraryItem: (id: string) => void;
  undoItineraryAction: () => void;
  redoItineraryAction: () => void;
};

type TripHistoryState = {
  trip: Trip;
  past: Trip[];
  future: Trip[];
};

const MAX_HISTORY_ENTRIES = 60;

function addSearchIndex(index: Record<string, string>, id: string, value: string): Record<string, string> {
  return { ...index, [id]: value };
}

function removeSearchIndex(index: Record<string, string>, id: string): Record<string, string> {
  const { [id]: _removed, ...next } = index;
  return next;
}

function normalizeTripState(trip: Trip): Trip {
  const rebuiltSearchIndex = Object.fromEntries(trip.itineraryItems.map((item) => [item.id, buildItinerarySearchIndex(item)]));
  return {
    ...trip,
    itineraryItems: trip.itineraryItems.map((item) => ({
      ...item,
      tags: [...item.tags],
      linkedVaultItemIds: [...item.linkedVaultItemIds],
    })),
    travelVaultItems: trip.travelVaultItems.map((item) => ({ ...item })),
    itinerarySearchIndex: rebuiltSearchIndex,
  };
}

function trimHistory(history: Trip[]): Trip[] {
  if (history.length <= MAX_HISTORY_ENTRIES) return history;
  return history.slice(history.length - MAX_HISTORY_ENTRIES);
}

function hasItemChanges(item: ItineraryItem, input: UpdateItineraryItemInput): boolean {
  const compareText = <T extends string>(current: T, next: unknown) => (next === undefined ? current : next) !== current;

  if (
    compareText(item.type, input.type) ||
    compareText(item.title, input.title) ||
    compareText(item.description, input.description) ||
    compareText(item.startDateTime, input.startDateTime) ||
    compareText(item.endDateTime, input.endDateTime) ||
    compareText(item.timezone, input.timezone) ||
    compareText(item.location, input.location) ||
    compareText(item.supplier, input.supplier) ||
    compareText(item.confirmationNumber, input.confirmationNumber) ||
    compareText(item.status, input.status) ||
    compareText(item.notes, input.notes)
  ) {
    return true;
  }

  if (input.tags && (input.tags.length !== item.tags.length || input.tags.some((tag, index) => tag !== item.tags[index]))) {
    return true;
  }

  if (
    input.linkedVaultItemIds &&
    (input.linkedVaultItemIds.length !== item.linkedVaultItemIds.length ||
      input.linkedVaultItemIds.some((linkedId, index) => linkedId !== item.linkedVaultItemIds[index]))
  ) {
    return true;
  }

  return false;
}

function applyTripMutation(state: TripHistoryState, updater: (currentTrip: Trip) => Trip): TripHistoryState {
  const updatedTrip = updater(state.trip);
  if (Object.is(updatedTrip, state.trip)) return state;
  const nextTrip = normalizeTripState(updatedTrip);
  return {
    trip: nextTrip,
    past: trimHistory([...state.past, normalizeTripState(state.trip)]),
    future: [],
  };
}

export function useTripStore(): UseTripStore {
  const [historyState, setHistoryState] = useState<TripHistoryState>(() => ({
    trip: normalizeTripState(loadPersistedTrip(sampleTrip)),
    past: [],
    future: [],
  }));
  const [filters, setFiltersState] = useState<ItineraryFilterState>(defaultItineraryFilters);
  const trip = historyState.trip;

  const setFilters = useCallback((updater: (prev: ItineraryFilterState) => ItineraryFilterState) => {
    setFiltersState((prev) => updater(prev));
  }, []);

  const addItem = useCallback((input: CreateItineraryItemInput) => {
    setHistoryState((prevState) =>
      applyTripMutation(prevState, (prevTrip) => {
        const createdItem = createItineraryItem(input);
        return {
          ...prevTrip,
          itineraryItems: [...prevTrip.itineraryItems, createdItem],
          itinerarySearchIndex: addSearchIndex(
            prevTrip.itinerarySearchIndex,
            createdItem.id,
            buildItinerarySearchIndex(createdItem),
          ),
          updatedAt: new Date().toISOString(),
        };
      }),
    );
  }, []);

  const updateItem = useCallback((input: UpdateItineraryItemInput) => {
    setHistoryState((prevState) =>
      applyTripMutation(prevState, (prevTrip) => {
        const current = prevTrip.itineraryItems.find((item) => item.id === input.id);
        if (!current || !hasItemChanges(current, input)) return prevTrip;

        const nextItem = updateItineraryItem(current, input);
        return {
          ...prevTrip,
          itineraryItems: prevTrip.itineraryItems.map((item) => (item.id === input.id ? nextItem : item)),
          itinerarySearchIndex: addSearchIndex(
            prevTrip.itinerarySearchIndex,
            nextItem.id,
            buildItinerarySearchIndex(nextItem),
          ),
          updatedAt: new Date().toISOString(),
        };
      }),
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    setHistoryState((prevState) =>
      applyTripMutation(prevState, (prevTrip) => {
        if (!prevTrip.itineraryItems.some((item) => item.id === id)) return prevTrip;
        return {
          ...prevTrip,
          itineraryItems: prevTrip.itineraryItems.filter((item) => item.id !== id),
          itinerarySearchIndex: removeSearchIndex(prevTrip.itinerarySearchIndex, id),
          updatedAt: new Date().toISOString(),
        };
      }),
    );
  }, []);

  const duplicateItem = useCallback((id: string) => {
    setHistoryState((prevState) =>
      applyTripMutation(prevState, (prevTrip) => {
        const source = prevTrip.itineraryItems.find((item) => item.id === id);
        if (!source) return prevTrip;
        const duplicated = duplicateItineraryItem(source);
        return {
          ...prevTrip,
          itineraryItems: [...prevTrip.itineraryItems, duplicated],
          itinerarySearchIndex: addSearchIndex(
            prevTrip.itinerarySearchIndex,
            duplicated.id,
            buildItinerarySearchIndex(duplicated),
          ),
          updatedAt: new Date().toISOString(),
        };
      }),
    );
  }, []);

  const undoItineraryAction = useCallback(() => {
    setHistoryState((prevState) => {
      if (prevState.past.length === 0) return prevState;
      const previousTrip = prevState.past[prevState.past.length - 1];
      return {
        trip: normalizeTripState(previousTrip),
        past: prevState.past.slice(0, -1),
        future: [normalizeTripState(prevState.trip), ...prevState.future],
      };
    });
  }, []);

  const redoItineraryAction = useCallback(() => {
    setHistoryState((prevState) => {
      if (prevState.future.length === 0) return prevState;
      const [nextTrip, ...nextFuture] = prevState.future;
      return {
        trip: normalizeTripState(nextTrip),
        past: trimHistory([...prevState.past, normalizeTripState(prevState.trip)]),
        future: nextFuture,
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
      canUndo: historyState.past.length > 0,
      canRedo: historyState.future.length > 0,
      setFilters,
      addItineraryItem: addItem,
      updateItineraryItem: updateItem,
      removeItineraryItem: removeItem,
      duplicateItineraryItem: duplicateItem,
      undoItineraryAction,
      redoItineraryAction,
    }),
    [trip, filters, historyState.past.length, historyState.future.length, setFilters, addItem, updateItem, removeItem, duplicateItem, undoItineraryAction, redoItineraryAction],
  );
}
