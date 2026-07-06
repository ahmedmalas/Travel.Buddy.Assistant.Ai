import {
  getReminderCounts,
  getReminderState,
  toMapPoints,
} from '../../destination-workspace/model/destinationWorkspace.utils';
import { sortActivitiesByStartTime } from '../../itinerary-board/model/itinerary.utils';
import {
  createVaultSearchText,
  getVaultCountsByType,
  getVaultExpiringSoonCount,
  getVaultSearchResults,
} from '../../travel-vault/model/travelVault.utils';
import type { Place, PlaceDraft } from '../../destination-workspace/model/destinationWorkspace.types';
import type {
  Trip,
  TripBrief,
  TripBriefSummaryCard,
  TripDestination,
  TripReminder,
  TripStatus,
} from './trip.types';

export function formatTripStatus(status: TripStatus) {
  return status.replace('_', ' ').replace(/\b\w/g, (token) => token.toUpperCase());
}

export function getActiveDestination(trip: Trip | null): TripDestination | null {
  if (!trip) {
    return null;
  }
  return trip.destinations.find((destination) => destination.id === trip.activeDestinationId) ?? trip.destinations[0] ?? null;
}

export function createPlaceFromDraft(tripId: string, destinationId: string, draft: PlaceDraft): Place {
  const timestamp = new Date().toISOString();
  const randomId = Math.random().toString(36).slice(2, 10);
  return {
    id: `place-${randomId}`,
    tripId,
    destinationId,
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

export function deriveTripReminders(tripId: string, places: Place[]): TripReminder[] {
  return places
    .filter((place) => Boolean(place.reminderAt))
    .map((place) => ({
      id: `trip-reminder-${place.id}`,
      tripId,
      placeId: place.id,
      title: place.title,
      reminderAt: place.reminderAt as string,
      state: getReminderState(place),
    }));
}

export function buildTripDerivedFields(trip: Trip): Trip {
  const mapPoints = toMapPoints(trip.places);
  const reminders = deriveTripReminders(trip.id, trip.places);
  return {
    ...trip,
    itineraryDays: trip.itineraryDays.map((day) => ({
      ...day,
      activities: sortActivitiesByStartTime(day.activities),
    })),
    vaultItems: trip.vaultItems.map((item) => ({
      ...item,
      searchText: createVaultSearchText({
        title: item.title,
        description: item.description,
        notes: item.notes,
        tags: item.tags,
        vendor: item.vendor,
        confirmationCode: item.confirmationCode,
        type: item.type,
        category: item.category,
        fileName: item.fileName,
      }),
    })),
    mapPoints,
    reminders,
  };
}

export function getTripReminderCounts(trip: Trip | null) {
  if (!trip) {
    return { overdue: 0, today: 0, upcoming: 0 };
  }
  return getReminderCounts(trip.places);
}

export function toTripBriefSummaryCard(brief: TripBrief): TripBriefSummaryCard {
  const dateWindowLabel =
    brief.dateWindow.start && brief.dateWindow.end
      ? `${new Date(brief.dateWindow.start).toLocaleDateString()} - ${new Date(brief.dateWindow.end).toLocaleDateString()}`
      : 'Dates not locked';
  return {
    objective: brief.objective || 'No objective yet',
    travelStyle: brief.travelStyle || 'Style not set',
    party: brief.party || 'Party not set',
    dateWindowLabel,
    mustDoCount: brief.mustDo.length,
    constraintsCount: brief.constraints.length,
  };
}

export function getTripVaultCountsByType(trip: Trip | null) {
  return getVaultCountsByType(trip?.vaultItems ?? []);
}

export function getTripVaultExpiringSoonCount(trip: Trip | null) {
  return getVaultExpiringSoonCount(trip?.vaultItems ?? []);
}

export function getTripVaultSearchResults(trip: Trip | null, query: string) {
  return getVaultSearchResults(trip?.vaultItems ?? [], query);
}
