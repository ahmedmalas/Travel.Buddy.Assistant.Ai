import type {
  Place,
  PlaceFilters,
  PlaceMapPoint,
  PlacePriority,
  PlaceReminderCounts,
  PlaceReminderState,
  PlaceStatus,
} from './destinationWorkspace.types';

const PRIORITY_WEIGHT: Record<PlacePriority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const STATUS_ACTIVE: Record<PlaceStatus, boolean> = {
  idea: true,
  shortlisted: true,
  booked: true,
  visited: false,
  skipped: false,
};

function isSameCalendarDay(firstDate: Date, secondDate: Date) {
  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()
  );
}

export function getReminderState(place: Place, now: Date = new Date()): PlaceReminderState {
  if (!place.reminderAt) {
    return 'none';
  }

  const reminderDate = new Date(place.reminderAt);
  if (!STATUS_ACTIVE[place.status]) {
    return 'none';
  }

  if (Number.isNaN(reminderDate.getTime())) {
    return 'none';
  }

  if (reminderDate.getTime() < now.getTime() && !isSameCalendarDay(reminderDate, now)) {
    return 'overdue';
  }

  if (isSameCalendarDay(reminderDate, now)) {
    return reminderDate.getTime() < now.getTime() ? 'overdue' : 'today';
  }

  return 'upcoming';
}

function createAddressLabel(place: Place) {
  const parts = [place.addressLine1, place.addressLine2, place.city, place.region, place.country, place.postalCode]
    .map((value) => value?.trim())
    .filter(Boolean);
  return parts.join(', ');
}

export function isMapReady(place: Place) {
  return typeof place.lat === 'number' && typeof place.lng === 'number';
}

export function toMapPoints(places: Place[]): PlaceMapPoint[] {
  return places.map((place) => {
    const fallbackAddress = createAddressLabel(place);
    return {
      id: place.id,
      label: place.title,
      coordinates: isMapReady(place) ? { lat: place.lat as number, lng: place.lng as number } : undefined,
      fallbackAddress: fallbackAddress || undefined,
      category: place.category,
      priority: place.priority,
      status: place.status,
      reminderAt: place.reminderAt,
    };
  });
}

export function getReminderCounts(places: Place[], now: Date = new Date()): PlaceReminderCounts {
  const counts: PlaceReminderCounts = { overdue: 0, today: 0, upcoming: 0 };
  places.forEach((place) => {
    const reminderState = getReminderState(place, now);
    if (reminderState === 'overdue') {
      counts.overdue += 1;
    } else if (reminderState === 'today') {
      counts.today += 1;
    } else if (reminderState === 'upcoming') {
      counts.upcoming += 1;
    }
  });
  return counts;
}

function matchesQuery(place: Place, query: string) {
  if (!query.trim()) {
    return true;
  }
  const normalizedQuery = query.toLowerCase();
  const searchable = [place.title, place.whySaved, createAddressLabel(place), place.notes[0]?.content]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return searchable.includes(normalizedQuery);
}

export function filterPlaces(places: Place[], filters: PlaceFilters, now: Date = new Date()) {
  return places.filter((place) => {
    if (filters.category !== 'all' && place.category !== filters.category) {
      return false;
    }
    if (filters.status !== 'all' && place.status !== filters.status) {
      return false;
    }
    if (filters.priority !== 'all' && place.priority !== filters.priority) {
      return false;
    }
    if (filters.reminderState !== 'all' && getReminderState(place, now) !== filters.reminderState) {
      return false;
    }
    return matchesQuery(place, filters.query);
  });
}

export function sortPlaces(places: Place[], now: Date = new Date()) {
  return [...places].sort((leftPlace, rightPlace) => {
    const leftReminderState = getReminderState(leftPlace, now);
    const rightReminderState = getReminderState(rightPlace, now);

    const reminderWeight = (state: PlaceReminderState) => {
      if (state === 'overdue') return 0;
      if (state === 'today') return 1;
      return 2;
    };

    const reminderDelta = reminderWeight(leftReminderState) - reminderWeight(rightReminderState);
    if (reminderDelta !== 0) {
      return reminderDelta;
    }

    const priorityDelta = PRIORITY_WEIGHT[leftPlace.priority] - PRIORITY_WEIGHT[rightPlace.priority];
    if (priorityDelta !== 0) {
      return priorityDelta;
    }

    return new Date(rightPlace.updatedAt).getTime() - new Date(leftPlace.updatedAt).getTime();
  });
}

export function formatReminderLabel(reminderAt?: string) {
  if (!reminderAt) {
    return 'No reminder';
  }

  const reminderDate = new Date(reminderAt);
  if (Number.isNaN(reminderDate.getTime())) {
    return 'Invalid reminder';
  }

  return reminderDate.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatPriorityLabel(priority: PlacePriority) {
  return `${priority.charAt(0).toUpperCase()}${priority.slice(1)} priority`;
}

export function formatStatusLabel(status: PlaceStatus) {
  return `${status.charAt(0).toUpperCase()}${status.slice(1)}`;
}

export function formatCategoryLabel(category: string) {
  return category.charAt(0).toUpperCase() + category.slice(1);
}
