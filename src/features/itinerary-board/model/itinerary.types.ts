import type { PlacePriority, PlaceReminderState, PlaceStatus } from '../../destination-workspace/model/destinationWorkspace.types';

export type ItineraryActivityStatus = 'planned' | 'confirmed' | 'done' | 'skipped';

export type ItineraryActivity = {
  id: string;
  tripId: string;
  dayId: string;
  placeId: string;
  startTime: string;
  durationMinutes: number;
  bufferAfterMinutes: number;
  notes?: string;
  status: ItineraryActivityStatus;
  createdAt: string;
  updatedAt: string;
};

export type ItineraryDay = {
  id: string;
  tripId: string;
  dayNumber: number;
  date?: string;
  title?: string;
  notes?: string;
  activities: ItineraryActivity[];
  createdAt: string;
  updatedAt: string;
};

export type TimelineConflictFlags = {
  overlap: boolean;
  tightBuffer: boolean;
  outsideDayWindow: boolean;
};

export type TimelineBlock = {
  activityId: string;
  dayId: string;
  placeId: string;
  label: string;
  startMinutes: number;
  endMinutes: number;
  durationMinutes: number;
  bufferAfterMinutes: number;
  notes?: string;
  reminderState: PlaceReminderState;
  priority: PlacePriority;
  placeStatus: PlaceStatus;
  activityStatus: ItineraryActivityStatus;
  conflictFlags: TimelineConflictFlags;
};

export type DaySummaryMetrics = {
  activityCount: number;
  totalPlannedMinutes: number;
  totalBufferMinutes: number;
  utilizationPercent: number;
  conflictCount: number;
};

export type ItineraryBoardConstants = {
  dayWindowStartMinutes: number;
  dayWindowEndMinutes: number;
  defaultDurationMinutes: number;
  defaultBufferMinutes: number;
};

export type AddActivityDraft = {
  placeId: string;
  startTime: string;
  durationMinutes: number;
  bufferAfterMinutes: number;
  notes?: string;
};

export type UpdateActivityDraft = Partial<{
  startTime: string;
  durationMinutes: number;
  bufferAfterMinutes: number;
  notes: string;
  status: ItineraryActivityStatus;
}>;
