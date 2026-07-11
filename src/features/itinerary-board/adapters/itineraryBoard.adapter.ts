import { getDestinationPlacesForActiveTrip } from '../../destination-workspace/adapters/destinationWorkspace.adapter';
import { ITINERARY_DEFAULTS, buildTimelineBlocks, getDaySummaryMetrics, sortActivitiesByStartTime } from '../model/itinerary.utils';
import type { Place } from '../../destination-workspace/model/destinationWorkspace.types';
import type { AddActivityDraft, ItineraryActivity, ItineraryDay, TimelineBlock } from '../model/itinerary.types';
import type { Trip } from '../../trip-command/model/trip.types';

export function getActiveItineraryDay(trip: Trip | null): ItineraryDay | null {
  if (!trip || trip.itineraryDays.length === 0) {
    return null;
  }
  return trip.itineraryDays.find((day) => day.id === trip.activeItineraryDayId) ?? trip.itineraryDays[0];
}

export function getEligiblePlacesForDay(trip: Trip | null) {
  return getDestinationPlacesForActiveTrip(trip);
}

export function toPlanningTimeline(day: ItineraryDay | null, places: Place[]) {
  const blocks = buildTimelineBlocks(day, places, ITINERARY_DEFAULTS);
  const summary = getDaySummaryMetrics(day, blocks, ITINERARY_DEFAULTS);
  return { blocks, summary };
}

export function createActivityFromDraft(tripId: string, dayId: string, draft: AddActivityDraft): ItineraryActivity {
  const timestamp = new Date().toISOString();
  return {
    id: `activity-${Math.random().toString(36).slice(2, 10)}`,
    tripId,
    dayId,
    placeId: draft.placeId,
    startTime: draft.startTime,
    durationMinutes: draft.durationMinutes,
    bufferAfterMinutes: draft.bufferAfterMinutes,
    notes: draft.notes?.trim() || undefined,
    status: 'planned',
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function normalizeDayActivities(day: ItineraryDay): ItineraryDay {
  return {
    ...day,
    activities: sortActivitiesByStartTime(day.activities),
  };
}

export function findActivityById(days: ItineraryDay[], activityId: string) {
  for (const day of days) {
    const activity = day.activities.find((entry) => entry.id === activityId);
    if (activity) {
      return { day, activity };
    }
  }
  return null;
}

export function getTimelineHourMarks() {
  const marks: number[] = [];
  for (let minute = ITINERARY_DEFAULTS.dayWindowStartMinutes; minute <= ITINERARY_DEFAULTS.dayWindowEndMinutes; minute += 60) {
    marks.push(minute);
  }
  return marks;
}

export type ItineraryBoardView = {
  activeDay: ItineraryDay | null;
  eligiblePlaces: Place[];
  timelineBlocks: TimelineBlock[];
  summary: ReturnType<typeof getDaySummaryMetrics>;
};

export function buildItineraryBoardView(trip: Trip | null): ItineraryBoardView {
  const activeDay = getActiveItineraryDay(trip);
  const eligiblePlaces = getEligiblePlacesForDay(trip);
  const { blocks, summary } = toPlanningTimeline(activeDay, trip?.places ?? []);
  return {
    activeDay,
    eligiblePlaces,
    timelineBlocks: blocks,
    summary,
  };
}
