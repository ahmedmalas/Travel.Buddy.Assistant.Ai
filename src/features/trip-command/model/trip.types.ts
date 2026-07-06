import type {
  Place,
  PlaceDraft,
  PlaceMapPoint,
  PlaceReminderCounts,
  PlaceReminderState,
} from '../../destination-workspace/model/destinationWorkspace.types';
import type { ItineraryDay, UpdateActivityDraft } from '../../itinerary-board/model/itinerary.types';

export type TripStatus = 'draft' | 'planning' | 'booked' | 'in_trip' | 'completed' | 'archived';

export type TripDestination = {
  id: string;
  tripId: string;
  name: string;
  country: string;
  region?: string;
  summary?: string;
  order: number;
  startDate?: string;
  endDate?: string;
};

export type TripBrief = {
  objective: string;
  travelStyle: string;
  party: string;
  dateWindow: {
    start?: string;
    end?: string;
  };
  constraints: string[];
  mustDo: string[];
  avoid: string[];
  successCriteria: string[];
};

export type TripReminder = {
  id: string;
  tripId: string;
  placeId?: string;
  title: string;
  reminderAt: string;
  state: PlaceReminderState;
};

export type TripNote = {
  id: string;
  tripId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type BudgetStub = {
  currency: string;
  target?: number;
  estimated?: number;
  spent?: number;
  notes?: string;
};

export type DocumentStub = {
  id: string;
  tripId: string;
  title: string;
  kind: 'booking' | 'id' | 'insurance' | 'transport' | 'other';
  status: 'planned' | 'uploaded';
};

export type AiContextStub = {
  persona: string;
  preferences: string[];
  constraints: string[];
  lastSummary?: string;
};

export type Trip = {
  id: string;
  name: string;
  status: TripStatus;
  brief: TripBrief;
  destinations: TripDestination[];
  activeDestinationId?: string;
  places: Place[];
  reminders: TripReminder[];
  notes: TripNote[];
  itineraryDays: ItineraryDay[];
  activeItineraryDayId?: string;
  mapPoints: PlaceMapPoint[];
  budget: BudgetStub;
  documents: DocumentStub[];
  aiContext: AiContextStub;
  createdAt: string;
  updatedAt: string;
};

export type TripCommandState = {
  trips: Trip[];
  activeTripId: string | null;
};

export type TripCommandComputed = {
  activeTrip: Trip | null;
  activeDestination: TripDestination | null;
  activeItineraryDay: ItineraryDay | null;
  activeTripPlaces: Place[];
  reminderCounts: PlaceReminderCounts;
  tripMapPoints: PlaceMapPoint[];
};

export type UpdatePlaceInput = {
  placeId: string;
  updates: Partial<Omit<Place, 'id' | 'tripId' | 'destinationId' | 'notes' | 'createdAt'>> & {
    notes?: Place['notes'];
  };
};

export type AddTripNoteDraft = {
  content: string;
};

export type AddActivityToDayDraft = {
  dayId: string;
  placeId: string;
  startTime: string;
  durationMinutes: number;
  bufferAfterMinutes: number;
  notes?: string;
};

export type UpdateActivityInput = {
  activityId: string;
  updates: UpdateActivityDraft;
};

export type RemoveActivityInput = {
  activityId: string;
};

export type TripCommandActions = {
  setActiveTrip: (tripId: string) => void;
  updateTripBrief: (updates: Partial<TripBrief>) => void;
  setActiveDestination: (destinationId: string) => void;
  setActiveItineraryDay: (dayId: string) => void;
  addPlace: (draft: PlaceDraft) => string | null;
  updatePlace: (input: UpdatePlaceInput) => void;
  addTripNote: (draft: AddTripNoteDraft) => void;
  addPlaceNote: (payload: { placeId: string; content: string }) => void;
  addActivityToDay: (draft: AddActivityToDayDraft) => string | null;
  updateActivity: (input: UpdateActivityInput) => void;
  removeActivity: (input: RemoveActivityInput) => void;
};

export type TripBriefSummaryCard = {
  objective: string;
  travelStyle: string;
  party: string;
  dateWindowLabel: string;
  mustDoCount: number;
  constraintsCount: number;
};
