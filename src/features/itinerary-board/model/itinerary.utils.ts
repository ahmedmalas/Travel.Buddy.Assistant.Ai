import { getReminderState } from '../../destination-workspace/model/destinationWorkspace.utils';
import type { Place } from '../../destination-workspace/model/destinationWorkspace.types';
import type {
  DaySummaryMetrics,
  ItineraryActivity,
  ItineraryBoardConstants,
  ItineraryDay,
  TimelineBlock,
} from './itinerary.types';

export const ITINERARY_DEFAULTS: ItineraryBoardConstants = {
  dayWindowStartMinutes: 6 * 60,
  dayWindowEndMinutes: 23 * 60,
  defaultDurationMinutes: 90,
  defaultBufferMinutes: 30,
};

export function parseTimeToMinutes(timeValue: string) {
  const [hoursPart, minutesPart] = timeValue.split(':');
  const hours = Number(hoursPart);
  const minutes = Number(minutesPart);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return ITINERARY_DEFAULTS.dayWindowStartMinutes;
  }
  return hours * 60 + minutes;
}

export function formatMinutesToTime(minutesValue: number) {
  const normalized = Math.max(0, Math.floor(minutesValue));
  const hours = Math.floor(normalized / 60)
    .toString()
    .padStart(2, '0');
  const minutes = (normalized % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function clampDuration(minutesValue: number, fallbackValue: number) {
  if (!Number.isFinite(minutesValue) || minutesValue <= 0) {
    return fallbackValue;
  }
  return Math.min(12 * 60, Math.floor(minutesValue));
}

export function sortActivitiesByStartTime(activities: ItineraryActivity[]) {
  return [...activities].sort((leftActivity, rightActivity) => {
    const timeDelta = parseTimeToMinutes(leftActivity.startTime) - parseTimeToMinutes(rightActivity.startTime);
    if (timeDelta !== 0) {
      return timeDelta;
    }
    return new Date(leftActivity.createdAt).getTime() - new Date(rightActivity.createdAt).getTime();
  });
}

function findPlaceById(places: Place[], placeId: string) {
  return places.find((place) => place.id === placeId) ?? null;
}

export function buildTimelineBlocks(day: ItineraryDay | null, places: Place[], constants: ItineraryBoardConstants = ITINERARY_DEFAULTS): TimelineBlock[] {
  if (!day) {
    return [];
  }

  const sortedActivities = sortActivitiesByStartTime(day.activities);
  return sortedActivities.map((activity, index) => {
    const place = findPlaceById(places, activity.placeId);
    const startMinutes = parseTimeToMinutes(activity.startTime);
    const durationMinutes = clampDuration(activity.durationMinutes, constants.defaultDurationMinutes);
    const bufferAfterMinutes = clampDuration(activity.bufferAfterMinutes, constants.defaultBufferMinutes);
    const endMinutes = startMinutes + durationMinutes;
    const nextActivity = sortedActivities[index + 1];
    const nextStart = nextActivity ? parseTimeToMinutes(nextActivity.startTime) : null;
    const overlap = nextStart !== null ? endMinutes > nextStart : false;
    const tightBuffer = nextStart !== null ? endMinutes + bufferAfterMinutes > nextStart : false;
    const outsideDayWindow = startMinutes < constants.dayWindowStartMinutes || endMinutes > constants.dayWindowEndMinutes;

    return {
      activityId: activity.id,
      dayId: activity.dayId,
      placeId: activity.placeId,
      label: place?.title ?? 'Unknown place',
      startMinutes,
      endMinutes,
      durationMinutes,
      bufferAfterMinutes,
      notes: activity.notes,
      reminderState: place ? getReminderState(place) : 'none',
      priority: place?.priority ?? 'low',
      placeStatus: place?.status ?? 'idea',
      activityStatus: activity.status,
      conflictFlags: {
        overlap,
        tightBuffer: !overlap && tightBuffer,
        outsideDayWindow,
      },
    };
  });
}

export function getDaySummaryMetrics(day: ItineraryDay | null, blocks: TimelineBlock[], constants: ItineraryBoardConstants = ITINERARY_DEFAULTS): DaySummaryMetrics {
  if (!day) {
    return {
      activityCount: 0,
      totalPlannedMinutes: 0,
      totalBufferMinutes: 0,
      utilizationPercent: 0,
      conflictCount: 0,
    };
  }

  const totalPlannedMinutes = blocks.reduce((sum, block) => sum + block.durationMinutes, 0);
  const totalBufferMinutes = blocks.reduce((sum, block) => sum + block.bufferAfterMinutes, 0);
  const dayWindowSpan = constants.dayWindowEndMinutes - constants.dayWindowStartMinutes;
  const utilizationPercent = dayWindowSpan > 0 ? Math.min(100, Math.round((totalPlannedMinutes / dayWindowSpan) * 100)) : 0;
  const conflictCount = blocks.reduce((sum, block) => {
    const hasConflict = block.conflictFlags.overlap || block.conflictFlags.tightBuffer || block.conflictFlags.outsideDayWindow;
    return hasConflict ? sum + 1 : sum;
  }, 0);

  return {
    activityCount: day.activities.length,
    totalPlannedMinutes,
    totalBufferMinutes,
    utilizationPercent,
    conflictCount,
  };
}

export function getDayLabel(day: ItineraryDay) {
  if (!day.date) {
    return `Day ${day.dayNumber}`;
  }
  return `Day ${day.dayNumber} · ${new Date(day.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
}
