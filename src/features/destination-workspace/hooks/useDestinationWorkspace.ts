import { useMemo, useState } from 'react';
import { seedPlaces } from '../data/seedPlaces';
import {
  filterPlaces,
  getReminderCounts,
  getReminderState,
  isMapReady,
  sortPlaces,
  toMapPoints,
} from '../model/destinationWorkspace.utils';
import type { Place, PlaceDraft, PlaceFilters } from '../model/destinationWorkspace.types';

const DEFAULT_FILTERS: PlaceFilters = {
  category: 'all',
  status: 'all',
  priority: 'all',
  reminderState: 'all',
  query: '',
};

function createPlaceFromDraft(draft: PlaceDraft): Place {
  const timestamp = new Date().toISOString();
  const randomId = Math.random().toString(36).slice(2, 10);
  return {
    id: `place-${randomId}`,
    tripId: 'trip-japan-spring',
    destinationId: 'destination-kyoto',
    title: draft.title.trim(),
    whySaved: draft.whySaved?.trim() || undefined,
    category: draft.category,
    addressLine1: draft.addressLine1?.trim() || undefined,
    addressLine2: draft.addressLine2?.trim() || undefined,
    city: draft.city?.trim() || undefined,
    region: draft.region?.trim() || undefined,
    country: draft.country?.trim() || undefined,
    postalCode: draft.postalCode?.trim() || undefined,
    lat: typeof draft.lat === 'number' ? draft.lat : undefined,
    lng: typeof draft.lng === 'number' ? draft.lng : undefined,
    notes: [],
    reminderAt: draft.reminderAt || undefined,
    priority: draft.priority,
    status: draft.status,
    visitWindow: draft.visitWindow,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

type AddNoteInput = {
  placeId: string;
  content: string;
};

type PlaceUpdate = Partial<Omit<Place, 'id' | 'tripId' | 'destinationId' | 'notes' | 'createdAt'>> & {
  notes?: Place['notes'];
};

export function useDestinationWorkspace() {
  const [places, setPlaces] = useState<Place[]>(seedPlaces);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(seedPlaces[0]?.id ?? null);
  const [filters, setFilters] = useState<PlaceFilters>(DEFAULT_FILTERS);

  const sortedPlaces = useMemo(() => sortPlaces(places), [places]);
  const filteredPlaces = useMemo(() => filterPlaces(sortedPlaces, filters), [sortedPlaces, filters]);
  const selectedPlace =
    places.find((place) => place.id === selectedPlaceId) ?? filteredPlaces[0] ?? sortedPlaces[0] ?? null;
  const mapPoints = useMemo(() => toMapPoints(places), [places]);
  const reminderCounts = useMemo(() => getReminderCounts(places), [places]);

  function addPlace(draft: PlaceDraft) {
    const nextPlace = createPlaceFromDraft(draft);
    setPlaces((currentPlaces) => [nextPlace, ...currentPlaces]);
    setSelectedPlaceId(nextPlace.id);
  }

  function updatePlace(placeId: string, updates: PlaceUpdate) {
    setPlaces((currentPlaces) =>
      currentPlaces.map((place) =>
        place.id === placeId ? { ...place, ...updates, updatedAt: new Date().toISOString() } : place,
      ),
    );
  }

  function addNote({ placeId, content }: AddNoteInput) {
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      return;
    }

    setPlaces((currentPlaces) =>
      currentPlaces.map((place) => {
        if (place.id !== placeId) {
          return place;
        }
        const timestamp = new Date().toISOString();
        return {
          ...place,
          notes: [
            {
              id: `note-${Math.random().toString(36).slice(2, 10)}`,
              placeId,
              content: trimmedContent,
              createdAt: timestamp,
              updatedAt: timestamp,
            },
            ...place.notes,
          ],
          updatedAt: timestamp,
        };
      }),
    );
  }

  function updateFilters(nextFilters: Partial<PlaceFilters>) {
    setFilters((currentFilters) => ({ ...currentFilters, ...nextFilters }));
  }

  function resetFilters() {
    setFilters(DEFAULT_FILTERS);
  }

  return {
    places,
    filteredPlaces,
    selectedPlace,
    selectedPlaceId,
    setSelectedPlaceId,
    addPlace,
    updatePlace,
    addNote,
    filters,
    updateFilters,
    resetFilters,
    mapPoints,
    reminderCounts,
    getReminderState,
    isMapReady,
  };
}
