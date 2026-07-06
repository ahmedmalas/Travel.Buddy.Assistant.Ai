import type { TripBriefSummaryCard } from '../../trip-command/model/trip.types';
import { toTripBriefSummaryCard } from '../../trip-command/model/trip.utils';
import type { Trip } from '../../trip-command/model/trip.types';

export function toTripBriefSummary(trip: Trip | null): TripBriefSummaryCard | null {
  if (!trip) {
    return null;
  }
  return toTripBriefSummaryCard(trip.brief);
}
