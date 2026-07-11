import type { BackupSnapshot } from '../../store/useTripStore';

export type SnapshotSort = 'newest' | 'oldest' | 'trip-title' | 'item-count';
export type SnapshotTimeFilter = 'all' | 'today' | 'week' | 'month';
export type SnapshotPinnedFilter = 'all' | 'pinned' | 'unpinned';

export type ComparisonItem = {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  notes: string;
  linkedReferences: string;
};

export type ModifiedFieldDiff = {
  fieldLabel: string;
  valueA: string;
  valueB: string;
};

export type ModifiedItemDiff = {
  id: string;
  itemA: ComparisonItem;
  itemB: ComparisonItem;
  fieldDiffs: ModifiedFieldDiff[];
};

export type DeepComparisonResult = {
  added: ComparisonItem[];
  removed: ComparisonItem[];
  modified: ModifiedItemDiff[];
  unchanged: ComparisonItem[];
};

type DayStop = {
  id: string;
  day: number;
  order: number;
};

export const groupStopsByDay = <T extends DayStop>(stops: T[]) => {
  const grouped = new Map<number, T[]>();
  for (const stop of stops) {
    const existing = grouped.get(stop.day) ?? [];
    grouped.set(stop.day, [...existing, stop]);
  }
  return [...grouped.entries()].sort((a, b) => a[0] - b[0]);
};

export const formatSnapshotDate = (value: string): string => new Date(value).toLocaleString();

export const formatBytes = (bytes: number): string => {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export const isInSelectedTimeRange = (dateValue: string, range: SnapshotTimeFilter): boolean => {
  if (range === 'all') {
    return true;
  }
  const now = new Date();
  const target = new Date(dateValue);
  if (range === 'today') {
    return now.toDateString() === target.toDateString();
  }
  if (range === 'week') {
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);
    return target >= weekAgo;
  }
  const monthAgo = new Date(now);
  monthAgo.setMonth(now.getMonth() - 1);
  return target >= monthAgo;
};

const normalizeText = (value: unknown, fallback = 'Not provided'): string => {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return fallback;
};

const getLinkedReferenceSummary = (stop: Record<string, unknown>): string => {
  const linkedValues: string[] = [];
  const candidates: unknown[] = [
    stop.linkedReferences,
    stop.linkedReferenceIds,
    stop.linkedDocs,
    stop.linkedDocuments,
    stop.vaultReferences,
    stop.linkedVault,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      if (candidate.length === 0) {
        continue;
      }
      linkedValues.push(candidate.map((entry) => normalizeText(entry)).join(', '));
      continue;
    }
    if (candidate && typeof candidate === 'object') {
      const keys = Object.keys(candidate);
      if (keys.length > 0) {
        linkedValues.push(keys.join(', '));
      }
    }
  }

  if (linkedValues.length === 0) {
    return 'Not provided';
  }
  return linkedValues.join(' | ');
};

const toComparisonItem = (stop: Record<string, unknown>): ComparisonItem => {
  const dayValue = typeof stop.day === 'number' ? `Day ${stop.day}` : 'Not provided';
  return {
    id: normalizeText(stop.id, crypto.randomUUID()),
    title: normalizeText(stop.title),
    date: normalizeText(stop.date, dayValue),
    startTime: normalizeText(stop.startTime),
    endTime: normalizeText(stop.endTime),
    location: normalizeText(stop.location),
    notes: normalizeText(stop.notes, normalizeText(stop.description)),
    linkedReferences: getLinkedReferenceSummary(stop),
  };
};

const compareField = (fieldLabel: string, valueA: string, valueB: string): ModifiedFieldDiff | null => {
  if (valueA === valueB) {
    return null;
  }
  return { fieldLabel, valueA, valueB };
};

export const buildDeepComparison = (snapshotA: BackupSnapshot, snapshotB: BackupSnapshot): DeepComparisonResult => {
  const itemsA = new Map(
    snapshotA.trip.stops.map((stop) => {
      const item = toComparisonItem(stop as unknown as Record<string, unknown>);
      return [item.id, item];
    }),
  );
  const itemsB = new Map(
    snapshotB.trip.stops.map((stop) => {
      const item = toComparisonItem(stop as unknown as Record<string, unknown>);
      return [item.id, item];
    }),
  );

  const allIds = Array.from(new Set([...itemsA.keys(), ...itemsB.keys()]));
  const added: ComparisonItem[] = [];
  const removed: ComparisonItem[] = [];
  const modified: ModifiedItemDiff[] = [];
  const unchanged: ComparisonItem[] = [];

  for (const id of allIds) {
    const itemA = itemsA.get(id);
    const itemB = itemsB.get(id);

    if (!itemA && itemB) {
      added.push(itemB);
      continue;
    }
    if (itemA && !itemB) {
      removed.push(itemA);
      continue;
    }
    if (!itemA || !itemB) {
      continue;
    }

    const fieldDiffs = [
      compareField('Title', itemA.title, itemB.title),
      compareField('Date', itemA.date, itemB.date),
      compareField('Start time', itemA.startTime, itemB.startTime),
      compareField('End time', itemA.endTime, itemB.endTime),
      compareField('Location', itemA.location, itemB.location),
      compareField('Notes / description', itemA.notes, itemB.notes),
      compareField('Linked vault/document references', itemA.linkedReferences, itemB.linkedReferences),
    ].filter((diff): diff is ModifiedFieldDiff => diff !== null);

    if (fieldDiffs.length === 0) {
      unchanged.push(itemB);
      continue;
    }

    modified.push({
      id,
      itemA,
      itemB,
      fieldDiffs,
    });
  }

  return { added, removed, modified, unchanged };
};
