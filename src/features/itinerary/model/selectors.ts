import type { ItineraryItem } from './types';
import { matchesQuery } from '../adapters/search';
import type { ItineraryFilterState, Trip } from '../../trip/model/trip';

function asTimestamp(dateTime: string): number {
  const parsed = Date.parse(dateTime);
  return Number.isNaN(parsed) ? Number.POSITIVE_INFINITY : parsed;
}

function getDateKeyForTimezone(dateTime: string, timezone: string): string {
  const date = new Date(dateTime);
  if (Number.isNaN(date.getTime())) return '';

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone || 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = parts.find((part) => part.type === 'year')?.value ?? '0000';
  const month = parts.find((part) => part.type === 'month')?.value ?? '01';
  const day = parts.find((part) => part.type === 'day')?.value ?? '01';
  return `${year}-${month}-${day}`;
}

function sortByDate(items: ItineraryItem[], direction: 'asc' | 'desc' = 'asc'): ItineraryItem[] {
  const sign = direction === 'asc' ? 1 : -1;
  return [...items].sort((a, b) => (asTimestamp(a.startDateTime) - asTimestamp(b.startDateTime)) * sign);
}

function createMemoizedSelector<TArgs extends any[], TResult>(compute: (...args: TArgs) => TResult) {
  let previousArgs: TArgs | null = null;
  let previousResult: TResult;

  return (...args: TArgs): TResult => {
    if (
      previousArgs &&
      previousArgs.length === args.length &&
      previousArgs.every((value, index) => Object.is(value, args[index]))
    ) {
      return previousResult;
    }

    previousArgs = args;
    previousResult = compute(...args);
    return previousResult;
  };
}

export const activeTripItinerary = createMemoizedSelector((trip: Trip): ItineraryItem[] =>
  sortByDate(trip.itineraryItems, 'asc'),
);

export const upcomingEvents = createMemoizedSelector((trip: Trip, now = new Date().toISOString()): ItineraryItem[] => {
  const nowTs = asTimestamp(now);
  return activeTripItinerary(trip).filter((item) => asTimestamp(item.endDateTime) >= nowTs);
});

export const todaysEvents = createMemoizedSelector((trip: Trip, now = new Date().toISOString()): ItineraryItem[] => {
  const todayByTripTimezone = getDateKeyForTimezone(now, trip.timezone);
  return activeTripItinerary(trip).filter(
    (item) => getDateKeyForTimezone(item.startDateTime, item.timezone) === todayByTripTimezone,
  );
});

export const nextReservation = createMemoizedSelector(
  (trip: Trip, now = new Date().toISOString()): ItineraryItem | null => {
    const nextItems = upcomingEvents(trip, now).filter((item) => item.status !== 'cancelled');
    return nextItems[0] ?? null;
  },
);

export const itineraryCountsByType = createMemoizedSelector((trip: Trip): Record<ItineraryItem['type'], number> => {
  return trip.itineraryItems.reduce(
    (counts, item) => {
      counts[item.type] += 1;
      return counts;
    },
    {
      flight: 0,
      hotel: 0,
      transport: 0,
      activity: 0,
      restaurant: 0,
      tour: 0,
      meeting: 0,
      custom: 0,
    },
  );
});

export const itinerarySearchResults = createMemoizedSelector(
  (trip: Trip, filters: ItineraryFilterState): ItineraryItem[] => {
    const filtered = trip.itineraryItems.filter((item) => {
      const indexValue = trip.itinerarySearchIndex[item.id] ?? '';
      const queryMatch = matchesQuery(indexValue, filters.query);
      const typeMatch = filters.type === 'all' || item.type === filters.type;
      const statusMatch = filters.status === 'all' || item.status === filters.status;
      const dateMatch =
        !filters.date || getDateKeyForTimezone(item.startDateTime, item.timezone) === filters.date;
      const tagsMatch = filters.tags.length === 0 || filters.tags.every((tag) => item.tags.includes(tag));
      return queryMatch && typeMatch && statusMatch && dateMatch && tagsMatch;
    });

    return sortByDate(filtered, filters.sortDirection);
  },
);

export function groupItemsByDay(items: ItineraryItem[]): Array<{ day: string; items: ItineraryItem[] }> {
  const grouped = new Map<string, ItineraryItem[]>();

  items.forEach((item) => {
    const dayKey = getDateKeyForTimezone(item.startDateTime, item.timezone);
    const existing = grouped.get(dayKey) ?? [];
    grouped.set(dayKey, [...existing, item]);
  });

  return [...grouped.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, groupedItems]) => ({ day, items: sortByDate(groupedItems) }));
}
