import { createContext, useMemo, useState, type ReactNode } from 'react';
import type { PlaceDraft } from '../../destination-workspace/model/destinationWorkspace.types';
import { createActivityFromDraft, normalizeDayActivities } from '../../itinerary-board/adapters/itineraryBoard.adapter';
import { seedTrips } from '../data/seedTrips';
import type {
  AddActivityToDayDraft,
  AddTripNoteDraft,
  Trip,
  TripBrief,
  TripCommandActions,
  TripCommandComputed,
  TripCommandState,
  TripNote,
  RemoveActivityInput,
  UpdateActivityInput,
  UpdatePlaceInput,
} from '../model/trip.types';
import {
  buildTripDerivedFields,
  createPlaceFromDraft,
  getActiveDestination,
  getTripReminderCounts,
} from '../model/trip.utils';

type TripCommandContextValue = TripCommandState &
  TripCommandComputed &
  TripCommandActions;

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
  const activeItineraryDay =
    activeTrip?.itineraryDays.find((day) => day.id === activeTrip.activeItineraryDayId) ??
    activeTrip?.itineraryDays[0] ??
    null;
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

  function setActiveItineraryDay(dayId: string) {
    patchActiveTrip((trip) => ({
      ...trip,
      activeItineraryDayId: dayId,
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

  function addActivityToDay(draft: AddActivityToDayDraft) {
    let nextActivityId: string | null = null;
    patchActiveTrip((trip) => {
      const targetDay = trip.itineraryDays.find((day) => day.id === draft.dayId);
      if (!targetDay) {
        return trip;
      }

      const activity = createActivityFromDraft(trip.id, draft.dayId, draft);
      nextActivityId = activity.id;
      return {
        ...trip,
        activeItineraryDayId: draft.dayId,
        itineraryDays: trip.itineraryDays.map((day) =>
          day.id === draft.dayId
            ? normalizeDayActivities({
                ...day,
                activities: [...day.activities, activity],
                updatedAt: new Date().toISOString(),
              })
            : day,
        ),
      };
    });
    return nextActivityId;
  }

  function updateActivity({ activityId, updates }: UpdateActivityInput) {
    patchActiveTrip((trip) => ({
      ...trip,
      itineraryDays: trip.itineraryDays.map((day) => {
        const hasActivity = day.activities.some((activity) => activity.id === activityId);
        if (!hasActivity) {
          return day;
        }
        return normalizeDayActivities({
          ...day,
          activities: day.activities.map((activity) =>
            activity.id === activityId
              ? {
                  ...activity,
                  ...updates,
                  notes: typeof updates.notes === 'string' ? updates.notes.trim() || undefined : activity.notes,
                  updatedAt: new Date().toISOString(),
                }
              : activity,
          ),
          updatedAt: new Date().toISOString(),
        });
      }),
    }));
  }

  function removeActivity({ activityId }: RemoveActivityInput) {
    patchActiveTrip((trip) => ({
      ...trip,
      itineraryDays: trip.itineraryDays.map((day) => {
        const hasActivity = day.activities.some((activity) => activity.id === activityId);
        if (!hasActivity) {
          return day;
        }
        return {
          ...day,
          activities: day.activities.filter((activity) => activity.id !== activityId),
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
  }

  const value = useMemo<TripCommandContextValue>(
    () => ({
      trips,
      activeTripId,
      activeTrip,
      activeDestination,
      activeItineraryDay,
      activeTripPlaces,
      reminderCounts,
      tripMapPoints,
      setActiveTrip,
      updateTripBrief,
      setActiveDestination,
      setActiveItineraryDay,
      addPlace,
      updatePlace,
      addTripNote,
      addPlaceNote,
      addActivityToDay,
      updateActivity,
      removeActivity,
    }),
    [trips, activeTripId, activeTrip, activeDestination, activeItineraryDay, activeTripPlaces, reminderCounts, tripMapPoints],
  );

  return <TripCommandContext.Provider value={value}>{children}</TripCommandContext.Provider>;
}
