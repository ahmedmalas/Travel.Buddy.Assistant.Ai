import { buildItinerarySearchIndex } from '../../itinerary/adapters/search';
import type { ItineraryItem } from '../../itinerary/model/types';
import type { TravelVaultItem, Trip } from '../model/trip';

const TRIP_STORAGE_KEY = 'travel-buddy.trip.v1';

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string');
}

function isValidItineraryItem(value: unknown): value is ItineraryItem {
  if (!isObject(value)) return false;

  return (
    isString(value.id) &&
    isString(value.tripId) &&
    isString(value.type) &&
    isString(value.title) &&
    isString(value.description) &&
    isString(value.startDateTime) &&
    isString(value.endDateTime) &&
    isString(value.timezone) &&
    isString(value.location) &&
    isString(value.supplier) &&
    isString(value.confirmationNumber) &&
    isString(value.status) &&
    isString(value.notes) &&
    isStringArray(value.linkedVaultItemIds) &&
    isStringArray(value.tags) &&
    isString(value.createdAt) &&
    isString(value.updatedAt)
  );
}

function isValidTravelVaultItem(value: unknown): value is TravelVaultItem {
  if (!isObject(value)) return false;

  return (
    isString(value.id) &&
    isString(value.tripId) &&
    isString(value.title) &&
    isString(value.category) &&
    isString(value.description) &&
    isString(value.createdAt) &&
    isString(value.updatedAt)
  );
}

function isValidTrip(value: unknown): value is Trip {
  if (!isObject(value)) return false;

  return (
    isString(value.id) &&
    isString(value.name) &&
    isString(value.destination) &&
    isString(value.timezone) &&
    isString(value.startDate) &&
    isString(value.endDate) &&
    Array.isArray(value.itineraryItems) &&
    value.itineraryItems.every((item) => isValidItineraryItem(item)) &&
    Array.isArray(value.travelVaultItems) &&
    value.travelVaultItems.every((item) => isValidTravelVaultItem(item)) &&
    isString(value.createdAt) &&
    isString(value.updatedAt)
  );
}

function rebuildSearchIndex(items: ItineraryItem[]): Record<string, string> {
  return Object.fromEntries(items.map((item) => [item.id, buildItinerarySearchIndex(item)]));
}

export function loadPersistedTrip(fallbackTrip: Trip): Trip {
  if (typeof window === 'undefined') return fallbackTrip;

  try {
    const raw = window.localStorage.getItem(TRIP_STORAGE_KEY);
    if (!raw) return fallbackTrip;

    const parsed: unknown = JSON.parse(raw);
    if (!isValidTrip(parsed)) return fallbackTrip;

    return {
      ...parsed,
      itineraryItems: parsed.itineraryItems.map((item) => ({
        ...item,
        tags: [...item.tags],
        linkedVaultItemIds: [...item.linkedVaultItemIds],
      })),
      travelVaultItems: parsed.travelVaultItems.map((item) => ({ ...item })),
      itinerarySearchIndex: rebuildSearchIndex(parsed.itineraryItems),
    };
  } catch {
    return fallbackTrip;
  }
}

export function persistTrip(trip: Trip): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(TRIP_STORAGE_KEY, JSON.stringify(trip));
  } catch {
    // Fail silently: local persistence should never break app usage.
  }
}
