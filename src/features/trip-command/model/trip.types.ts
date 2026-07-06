import type {
  Place,
  PlaceMapPoint,
  PlaceReminderCounts,
  PlaceReminderState,
} from '../../destination-workspace/model/destinationWorkspace.types';

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

export type ItineraryDayStub = {
  id: string;
  tripId: string;
  dayNumber: number;
  date?: string;
  summary?: string;
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
  itineraryDays: ItineraryDayStub[];
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
  activeTripPlaces: Place[];
  reminderCounts: PlaceReminderCounts;
  tripMapPoints: PlaceMapPoint[];
};

export type TripBriefSummaryCard = {
  objective: string;
  travelStyle: string;
  party: string;
  dateWindowLabel: string;
  mustDoCount: number;
  constraintsCount: number;
};
