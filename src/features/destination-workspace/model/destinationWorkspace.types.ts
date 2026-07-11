export const PLACE_CATEGORIES = [
  'food',
  'coffee',
  'stay',
  'attraction',
  'shopping',
  'nature',
  'nightlife',
  'logistics',
  'wellness',
  'other',
] as const;

export const PLACE_PRIORITIES = ['critical', 'high', 'medium', 'low'] as const;

export const PLACE_STATUSES = ['idea', 'shortlisted', 'booked', 'visited', 'skipped'] as const;

export type PlaceCategory = (typeof PLACE_CATEGORIES)[number];
export type PlacePriority = (typeof PLACE_PRIORITIES)[number];
export type PlaceStatus = (typeof PLACE_STATUSES)[number];

export type PlaceReminderState = 'none' | 'overdue' | 'today' | 'upcoming';

export type PlaceVisitWindow = {
  start?: string;
  end?: string;
};

export type PlaceAddress = {
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  region?: string;
  country?: string;
  postalCode?: string;
};

export type PlaceCoordinates = {
  lat?: number;
  lng?: number;
};

export type PlaceNote = {
  id: string;
  placeId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  pinned?: boolean;
};

export type Place = PlaceAddress &
  PlaceCoordinates & {
    id: string;
    tripId: string;
    destinationId: string;
    title: string;
    whySaved?: string;
    category: PlaceCategory;
    notes: PlaceNote[];
    reminderAt?: string;
    priority: PlacePriority;
    status: PlaceStatus;
    visitWindow?: PlaceVisitWindow;
    createdAt: string;
    updatedAt: string;
  };

export type PlaceMapPoint = {
  id: string;
  label: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  fallbackAddress?: string;
  category: PlaceCategory;
  priority: PlacePriority;
  status: PlaceStatus;
  reminderAt?: string;
};

export type PlaceReminderCounts = {
  overdue: number;
  today: number;
  upcoming: number;
};

export type PlaceFilters = {
  category: PlaceCategory | 'all';
  status: PlaceStatus | 'all';
  priority: PlacePriority | 'all';
  reminderState: PlaceReminderState | 'all';
  query: string;
};

export type PlaceDraft = PlaceAddress &
  PlaceCoordinates & {
    title: string;
    whySaved?: string;
    category: PlaceCategory;
    reminderAt?: string;
    priority: PlacePriority;
    status: PlaceStatus;
    visitWindow?: PlaceVisitWindow;
  };
