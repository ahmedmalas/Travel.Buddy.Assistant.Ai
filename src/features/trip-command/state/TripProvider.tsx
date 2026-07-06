import { createContext, useMemo, useState, type ReactNode } from 'react';
import type { Place, PlaceDraft } from '../../destination-workspace/model/destinationWorkspace.types';
import { seedTrips } from '../data/seedTrips';
import type { Trip, TripBrief, TripCommandComputed, TripCommandState, TripNote } from '../model/trip.types';
import {
  buildTripDerivedFields,
  createPlaceFromDraft,
  getActiveDestination,
  getTripReminderCounts,
} from '../model/trip.utils';

type AddTripNoteDraft = {
  content: string;
};

type UpdatePlaceInput = {
  placeId: string;
  updates: Partial<Omit<Place, 'id' | 'tripId' | 'destinationId' | 'notes' | 'createdAt'>> & {
    notes?: Place['notes'];
  };
};

type TripCommandContextValue = TripCommandState &
  TripCommandComputed & {
    setActiveTrip: (tripId: string) => void;
    updateTripBrief: (updates: Partial<TripBrief>) => void;
    setActiveDestination: (destinationId: string) => void;
    addPlace: (draft: PlaceDraft) => string | null;
    updatePlace: (input: UpdatePlaceInput) => void;
    addTripNote: (draft: AddTripNoteDraft) => void;
    addPlaceNote: (payload: { placeId: string; content: string }) => void;
  };

export const TripCommandContext = createContext<TripCommandContextValue | null>(null);

type TripProviderProps = {
  children: ReactNode;
};

function upsertTrip(trips: Trip[], nextTrip: Trip) {
  return trips.map((trip) => (trip.id === nextTrip.id ? nextTrip : trip));
}

export function TripProvider({ children }: TripProviderProps) {
  const [trips, setTrips] = useState<Trip[]>(seedTrips);
  const [activeTripId, setActiveTripId] = useState<string | null>(seedTrips[0]?.id ?? null);

  const activeTrip = trips.find((trip) => trip.id === activeTripId) ?? null;
  const activeDestination = getActiveDestination(activeTrip);
  const activeTripPlaces = useMemo(() => {
    if (!activeTrip || !activeDestination) {
      return [];
    }
    return activeTrip.places.filter((place) => place.destinationId === activeDestination.id);
  }, [activeTrip, activeDestination]);
  const reminderCounts = useMemo(() => getTripReminderCounts(activeTrip), [activeTrip]);
  const tripMapPoints = activeTrip?.mapPoints ?? [];

  function patchActiveTrip(applyPatch: (trip: Trip) => Trip) {
    setTrips((currentTrips) => {
      const currentTrip = currentTrips.find((trip) => trip.id === activeTripId);
      if (!currentTrip) {
        return currentTrips;
      }
      const updatedTrip = buildTripDerivedFields({
        ...applyPatch(currentTrip),
        updatedAt: new Date().toISOString(),
      });
      return upsertTrip(currentTrips, updatedTrip);
    });
  }

  function setActiveTrip(tripId: string) {
    setActiveTripId(tripId);
  }

  function updateTripBrief(updates: Partial<TripBrief>) {
    patchActiveTrip((trip) => ({
      ...trip,
      brief: {
        ...trip.brief,
        ...updates,
      },
    }));
  }

  function setActiveDestination(destinationId: string) {
    patchActiveTrip((trip) => ({
      ...trip,
      activeDestinationId: destinationId,
    }));
  }

  function addPlace(draft: PlaceDraft) {
    let nextPlaceId: string | null = null;
    patchActiveTrip((trip) => {
      const destinationId = trip.activeDestinationId ?? trip.destinations[0]?.id;
      if (!destinationId) {
        return trip;
      }
      const nextPlace = createPlaceFromDraft(trip.id, destinationId, draft);
      nextPlaceId = nextPlace.id;
      return {
        ...trip,
        places: [nextPlace, ...trip.places],
      };
    });
    return nextPlaceId;
  }

  function updatePlace({ placeId, updates }: UpdatePlaceInput) {
    patchActiveTrip((trip) => ({
      ...trip,
      places: trip.places.map((place) =>
        place.id === placeId ? { ...place, ...updates, updatedAt: new Date().toISOString() } : place,
      ),
    }));
  }

  function addPlaceNote(payload: { placeId: string; content: string }) {
    const trimmedContent = payload.content.trim();
    if (!trimmedContent) {
      return;
    }

    patchActiveTrip((trip) => ({
      ...trip,
      places: trip.places.map((place) => {
        if (place.id !== payload.placeId) {
          return place;
        }
        const timestamp = new Date().toISOString();
        return {
          ...place,
          notes: [
            {
              id: `note-${Math.random().toString(36).slice(2, 10)}`,
              placeId: payload.placeId,
              content: trimmedContent,
              createdAt: timestamp,
              updatedAt: timestamp,
            },
            ...place.notes,
          ],
          updatedAt: timestamp,
        };
      }),
    }));
  }

  function addTripNote(draft: AddTripNoteDraft) {
    const content = draft.content.trim();
    if (!content) {
      return;
    }
    patchActiveTrip((trip) => {
      const timestamp = new Date().toISOString();
      const note: TripNote = {
        id: `trip-note-${Math.random().toString(36).slice(2, 10)}`,
        tripId: trip.id,
        content,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      return {
        ...trip,
        notes: [note, ...trip.notes],
      };
    });
  }

  const value = useMemo<TripCommandContextValue>(
    () => ({
      trips,
      activeTripId,
      activeTrip,
      activeDestination,
      activeTripPlaces,
      reminderCounts,
      tripMapPoints,
      setActiveTrip,
      updateTripBrief,
      setActiveDestination,
      addPlace,
      updatePlace,
      addTripNote,
      addPlaceNote,
    }),
    [trips, activeTripId, activeTrip, activeDestination, activeTripPlaces, reminderCounts, tripMapPoints],
  );

  return <TripCommandContext.Provider value={value}>{children}</TripCommandContext.Provider>;
}
