import { useEffect, useMemo, useState } from 'react';
import { destinationWorkspaceAdapter, getWorkspacePlaces } from '../adapters/destinationWorkspace.adapter';
import type { Place, PlaceDraft, PlaceFilters } from '../model/destinationWorkspace.types';
import { useTripCommand } from '../../trip-command/state/useTripCommand';
import { getReminderCounts } from '../model/destinationWorkspace.utils';

const DEFAULT_FILTERS: PlaceFilters = {
  category: 'all',
  status: 'all',
  priority: 'all',
  reminderState: 'all',
  query: '',
};

type PlaceUpdate = Partial<Omit<Place, 'id' | 'tripId' | 'destinationId' | 'notes' | 'createdAt'>> & {
  notes?: Place['notes'];
};

export function useDestinationWorkspace() {
  const { activeTrip, tripMapPoints, addPlace, updatePlace, addPlaceNote } = useTripCommand();
  const [filters, setFilters] = useState<PlaceFilters>(DEFAULT_FILTERS);
  const workspacePlaces = useMemo(() => getWorkspacePlaces(activeTrip, filters), [activeTrip, filters]);
  const places = workspacePlaces.destinationPlaces;
  const sortedPlaces = workspacePlaces.sortedPlaces;
  const filteredPlaces = workspacePlaces.filteredPlaces;
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(places[0]?.id ?? null);

  const selectedPlace =
    places.find((place) => place.id === selectedPlaceId) ?? filteredPlaces[0] ?? sortedPlaces[0] ?? null;
  const mapPoints = useMemo(() => {
    const placeIds = new Set(places.map((place) => place.id));
    return tripMapPoints.filter((mapPoint) => placeIds.has(mapPoint.id));
  }, [places, tripMapPoints]);
  const reminderCounts = useMemo(() => getReminderCounts(places), [places]);

  useEffect(() => {
    if (selectedPlaceId && places.some((place) => place.id === selectedPlaceId)) {
      return;
    }
    setSelectedPlaceId(places[0]?.id ?? null);
  }, [places, selectedPlaceId]);

  function handleAddPlace(draft: PlaceDraft) {
    const placeId = addPlace(draft);
    if (placeId) {
      setSelectedPlaceId(placeId);
    }
  }

  function handleUpdatePlace(placeId: string, updates: PlaceUpdate) {
    updatePlace({ placeId, updates });
  }

  function addNote(payload: { placeId: string; content: string }) {
    addPlaceNote(payload);
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
    addPlace: handleAddPlace,
    updatePlace: handleUpdatePlace,
    addNote,
    filters,
    updateFilters,
    resetFilters,
    mapPoints,
    reminderCounts,
    getReminderState: destinationWorkspaceAdapter.getReminderState,
    isMapReady: destinationWorkspaceAdapter.isMapReady,
  };
}
