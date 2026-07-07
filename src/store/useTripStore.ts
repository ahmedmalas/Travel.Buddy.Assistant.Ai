import { useEffect, useMemo, useState } from 'react';

export type TripStop = {
  id: string;
  title: string;
  day: number;
  order: number;
  notes: string;
};

export type TripData = {
  tripName: string;
  stops: TripStop[];
};

type TripBackup = {
  schema: 'travel-buddy-backup-v1';
  exportedAt: string;
  trip: TripData;
};

type HistoryState = {
  past: TripData[];
  present: TripData;
  future: TripData[];
};

const LOCAL_STORAGE_KEY = 'travel-buddy:trip-state:v1';
const HISTORY_LIMIT = 50;

const defaultTrip: TripData = {
  tripName: 'Japan Discovery',
  stops: [
    { id: 's1', title: 'Arrive in Tokyo', day: 1, order: 1, notes: 'Narita transfer and hotel check-in' },
    { id: 's2', title: 'Asakusa and Senso-ji', day: 1, order: 2, notes: 'Evening street food walk' },
    { id: 's3', title: 'Kyoto day trip', day: 2, order: 1, notes: 'Shinkansen + temple route' },
  ],
};

const isTripStop = (value: unknown): value is TripStop => {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const stop = value as Partial<TripStop>;
  return (
    typeof stop.id === 'string' &&
    typeof stop.title === 'string' &&
    typeof stop.notes === 'string' &&
    typeof stop.day === 'number' &&
    Number.isInteger(stop.day) &&
    stop.day > 0 &&
    typeof stop.order === 'number' &&
    Number.isInteger(stop.order) &&
    stop.order > 0
  );
};

const isTripData = (value: unknown): value is TripData => {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const trip = value as Partial<TripData>;
  return typeof trip.tripName === 'string' && Array.isArray(trip.stops) && trip.stops.every(isTripStop);
};

const parsePersistedTrip = (rawValue: string | null): TripData => {
  if (!rawValue) {
    return defaultTrip;
  }
  try {
    const parsed: unknown = JSON.parse(rawValue);
    if (isTripData(parsed)) {
      return parsed;
    }
  } catch {
    return defaultTrip;
  }
  return defaultTrip;
};

const dedupe = (items: string[]): string[] => Array.from(new Set(items));

const buildSearchIndex = (trip: TripData): Map<string, string[]> => {
  const index = new Map<string, string[]>();
  for (const stop of trip.stops) {
    const tokens = `${stop.title} ${stop.notes}`.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
    for (const token of dedupe(tokens)) {
      const existing = index.get(token) ?? [];
      index.set(token, dedupe([...existing, stop.id]));
    }
  }
  return index;
};

const updateHistory = (history: HistoryState, next: TripData): HistoryState => ({
  past: [...history.past, history.present].slice(-HISTORY_LIMIT),
  present: next,
  future: [],
});

const sortStops = (stops: TripStop[]): TripStop[] =>
  [...stops].sort((a, b) => {
    if (a.day !== b.day) {
      return a.day - b.day;
    }
    return a.order - b.order;
  });

const sanitizeTrip = (trip: TripData): TripData => ({
  tripName: trip.tripName.trim() || 'Untitled Trip',
  stops: sortStops(trip.stops).map((stop) => ({
    ...stop,
    title: stop.title.trim(),
    notes: stop.notes.trim(),
  })),
});

const parseTripBackup = (rawValue: string): TripData => {
  const parsed: unknown = JSON.parse(rawValue);

  if (isTripData(parsed)) {
    return sanitizeTrip(parsed);
  }

  if (parsed && typeof parsed === 'object') {
    const backup = parsed as Partial<TripBackup>;
    if (backup.schema === 'travel-buddy-backup-v1' && isTripData(backup.trip)) {
      return sanitizeTrip(backup.trip);
    }
  }

  throw new Error('Backup file format is invalid.');
};

export function useTripStore() {
  const [history, setHistory] = useState<HistoryState>(() => ({
    past: [],
    present: parsePersistedTrip(window.localStorage.getItem(LOCAL_STORAGE_KEY)),
    future: [],
  }));

  useEffect(() => {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(history.present));
  }, [history.present]);

  const searchIndex = useMemo(() => buildSearchIndex(history.present), [history.present]);

  const updateTrip = (updater: (current: TripData) => TripData) => {
    setHistory((currentHistory) => updateHistory(currentHistory, sanitizeTrip(updater(currentHistory.present))));
  };

  const replaceTrip = (trip: TripData) => {
    setHistory((currentHistory) => updateHistory(currentHistory, sanitizeTrip(trip)));
  };

  const undo = () => {
    setHistory((currentHistory) => {
      const previous = currentHistory.past.at(-1);
      if (!previous) {
        return currentHistory;
      }
      return {
        past: currentHistory.past.slice(0, -1),
        present: previous,
        future: [currentHistory.present, ...currentHistory.future],
      };
    });
  };

  const redo = () => {
    setHistory((currentHistory) => {
      const next = currentHistory.future[0];
      if (!next) {
        return currentHistory;
      }
      return {
        past: [...currentHistory.past, currentHistory.present].slice(-HISTORY_LIMIT),
        present: next,
        future: currentHistory.future.slice(1),
      };
    });
  };

  const moveStop = (stopId: string, direction: 'up' | 'down') => {
    updateTrip((trip) => {
      const stops = sortStops(trip.stops);
      const target = stops.find((stop) => stop.id === stopId);
      if (!target) {
        return trip;
      }
      const sameDayStops = stops.filter((stop) => stop.day === target.day);
      const currentIndex = sameDayStops.findIndex((stop) => stop.id === stopId);
      const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (swapIndex < 0 || swapIndex >= sameDayStops.length) {
        return trip;
      }

      const currentStop = sameDayStops[currentIndex];
      const swapStop = sameDayStops[swapIndex];
      return {
        ...trip,
        stops: stops.map((stop) => {
          if (stop.id === currentStop.id) {
            return { ...stop, order: swapStop.order };
          }
          if (stop.id === swapStop.id) {
            return { ...stop, order: currentStop.order };
          }
          return stop;
        }),
      };
    });
  };

  const addStop = () => {
    updateTrip((trip) => {
      const maxDay = trip.stops.reduce((max, stop) => Math.max(max, stop.day), 1);
      const nextOrder = trip.stops.filter((stop) => stop.day === maxDay).length + 1;
      return {
        ...trip,
        stops: [
          ...trip.stops,
          {
            id: `s-${crypto.randomUUID()}`,
            title: 'New itinerary item',
            day: maxDay,
            order: nextOrder,
            notes: 'Update this activity',
          },
        ],
      };
    });
  };

  const searchStops = (query: string): string[] => {
    const tokens = query.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
    if (tokens.length === 0) {
      return history.present.stops.map((stop) => stop.id);
    }

    const tokenMatches = tokens.map((token) => searchIndex.get(token) ?? []);
    if (tokenMatches.some((matches) => matches.length === 0)) {
      return [];
    }

    return tokenMatches.reduce((accumulator, matches) => accumulator.filter((id) => matches.includes(id)));
  };

  const toBackupJson = (): string => {
    const backup: TripBackup = {
      schema: 'travel-buddy-backup-v1',
      exportedAt: new Date().toISOString(),
      trip: history.present,
    };
    return JSON.stringify(backup, null, 2);
  };

  return {
    trip: history.present,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    sortedStops: sortStops(history.present.stops),
    addStop,
    undo,
    redo,
    moveStop,
    searchStops,
    replaceTrip,
    parseTripBackup,
    toBackupJson,
  };
}
