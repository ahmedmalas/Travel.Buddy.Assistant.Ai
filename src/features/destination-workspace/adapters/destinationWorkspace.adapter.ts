import { filterPlaces, getReminderState, isMapReady, sortPlaces } from '../model/destinationWorkspace.utils';
import type { Place, PlaceFilters } from '../model/destinationWorkspace.types';
import type { Trip } from '../../trip-command/model/trip.types';

export function getDestinationPlacesForActiveTrip(trip: Trip | null): Place[] {
  if (!trip) {
    return [];
  }
  const activeDestinationId = trip.activeDestinationId ?? trip.destinations[0]?.id;
  if (!activeDestinationId) {
    return [];
  }
  return trip.places.filter((place) => place.destinationId === activeDestinationId);
}

export function getWorkspacePlaces(trip: Trip | null, filters: PlaceFilters) {
  const destinationPlaces = getDestinationPlacesForActiveTrip(trip);
  const sortedPlaces = sortPlaces(destinationPlaces);
  const filteredPlaces = filterPlaces(sortedPlaces, filters);
  return {
    destinationPlaces,
    sortedPlaces,
    filteredPlaces,
  };
}

export const destinationWorkspaceAdapter = {
  getReminderState,
  isMapReady,
};
