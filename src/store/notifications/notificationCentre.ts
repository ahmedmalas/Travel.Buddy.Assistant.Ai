import { daysUntilDate } from '../vaultCalculations';
import type { VaultTrip } from '../vaultDomain';
import { detectItineraryConflicts } from '../platformCalculations';
import { NOTIFICATION_STORAGE_KEY } from '../storeConstants';

export type NotificationKind =
  | 'departure'
  | 'document-expiry'
  | 'unpaid-expense'
  | 'booking-reminder'
  | 'itinerary-conflict'
  | 'packing-deadline';

export type AppNotification = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  tripId: string | null;
  createdAt: string;
  read: boolean;
  dismissed: boolean;
  severity: 'info' | 'warning' | 'critical';
};

export type NotificationCentreState = {
  items: AppNotification[];
  updatedAt: string;
};

export const createEmptyNotificationState = (): NotificationCentreState => ({
  items: [],
  updatedAt: new Date().toISOString(),
});

export const loadNotificationState = (): NotificationCentreState => {
  try {
    const raw = window.localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    if (!raw) return createEmptyNotificationState();
    const parsed = JSON.parse(raw) as Partial<NotificationCentreState>;
    return {
      items: Array.isArray(parsed.items) ? parsed.items : [],
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
    };
  } catch {
    return createEmptyNotificationState();
  }
};

export const persistNotificationState = (state: NotificationCentreState): void => {
  try {
    window.localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore persistence failures.
  }
};

const stableId = (parts: string[]): string => parts.join(':');

export const buildNotificationsFromTrips = (
  trips: VaultTrip[],
  previous: NotificationCentreState = createEmptyNotificationState(),
  today = new Date(),
): NotificationCentreState => {
  const previousById = new Map(previous.items.map((item) => [item.id, item]));
  const generated: AppNotification[] = [];
  const now = today.toISOString();

  for (const trip of trips) {
    if (trip.status === 'archived') continue;

    const daysToDeparture = daysUntilDate(trip.departureDate, today);
    if (daysToDeparture !== null && daysToDeparture >= 0 && daysToDeparture <= 14) {
      const id = stableId(['departure', trip.id, trip.departureDate]);
      generated.push({
        id,
        kind: 'departure',
        title: `Upcoming departure: ${trip.tripName}`,
        body: daysToDeparture === 0 ? 'Departs today.' : `Departs in ${daysToDeparture} day(s).`,
        tripId: trip.id,
        createdAt: previousById.get(id)?.createdAt ?? now,
        read: previousById.get(id)?.read ?? false,
        dismissed: previousById.get(id)?.dismissed ?? false,
        severity: daysToDeparture <= 3 ? 'warning' : 'info',
      });
    }

    for (const document of trip.documents) {
      const days = daysUntilDate(document.expiryDate, today);
      if (days === null) continue;
      if (days > 60) continue;
      const id = stableId(['document', trip.id, document.id, document.expiryDate]);
      generated.push({
        id,
        kind: 'document-expiry',
        title: `Document expiry: ${document.title}`,
        body: days < 0 ? `Expired ${Math.abs(days)} day(s) ago.` : `Expires in ${days} day(s).`,
        tripId: trip.id,
        createdAt: previousById.get(id)?.createdAt ?? now,
        read: previousById.get(id)?.read ?? false,
        dismissed: previousById.get(id)?.dismissed ?? false,
        severity: days < 0 || days <= 14 ? 'critical' : 'warning',
      });
    }

    for (const expense of trip.expenses) {
      if (expense.paid) continue;
      const id = stableId(['unpaid', trip.id, expense.id]);
      generated.push({
        id,
        kind: 'unpaid-expense',
        title: `Unpaid expense: ${expense.title}`,
        body: `${expense.amount.toFixed(2)} ${expense.currency} still unpaid on ${trip.tripName}.`,
        tripId: trip.id,
        createdAt: previousById.get(id)?.createdAt ?? now,
        read: previousById.get(id)?.read ?? false,
        dismissed: previousById.get(id)?.dismissed ?? false,
        severity: 'warning',
      });
    }

    for (const booking of trip.bookings) {
      if (booking.status === 'cancelled' || booking.status === 'completed') continue;
      const days = daysUntilDate(booking.startDate, today);
      if (days === null || days < 0 || days > 7) continue;
      const id = stableId(['booking', trip.id, booking.id, booking.startDate]);
      generated.push({
        id,
        kind: 'booking-reminder',
        title: `Booking reminder: ${booking.title}`,
        body: days === 0 ? 'Starts today.' : `Starts in ${days} day(s).`,
        tripId: trip.id,
        createdAt: previousById.get(id)?.createdAt ?? now,
        read: previousById.get(id)?.read ?? false,
        dismissed: previousById.get(id)?.dismissed ?? false,
        severity: 'info',
      });
    }

    const conflicts = detectItineraryConflicts(trip.stops);
    if (conflicts.length > 0) {
      const id = stableId(['conflict', trip.id, String(conflicts.length)]);
      generated.push({
        id,
        kind: 'itinerary-conflict',
        title: `Itinerary conflicts on ${trip.tripName}`,
        body: `${conflicts.length} overlapping activity conflict(s) detected.`,
        tripId: trip.id,
        createdAt: previousById.get(id)?.createdAt ?? now,
        read: previousById.get(id)?.read ?? false,
        dismissed: previousById.get(id)?.dismissed ?? false,
        severity: 'warning',
      });
    }

    const packingItems = trip.packingLists.flatMap((list) => list.items);
    const unpacked = packingItems.filter((item) => !item.packed).length;
    if (daysToDeparture !== null && daysToDeparture <= 7 && unpacked > 0) {
      const id = stableId(['packing', trip.id, String(unpacked)]);
      generated.push({
        id,
        kind: 'packing-deadline',
        title: `Packing deadline: ${trip.tripName}`,
        body: `${unpacked} item(s) still unpacked with departure in ${daysToDeparture} day(s).`,
        tripId: trip.id,
        createdAt: previousById.get(id)?.createdAt ?? now,
        read: previousById.get(id)?.read ?? false,
        dismissed: previousById.get(id)?.dismissed ?? false,
        severity: daysToDeparture <= 2 ? 'critical' : 'warning',
      });
    }
  }

  return {
    items: generated.sort((a, b) => {
      const severityRank = { critical: 0, warning: 1, info: 2 };
      if (severityRank[a.severity] !== severityRank[b.severity]) {
        return severityRank[a.severity] - severityRank[b.severity];
      }
      return b.createdAt.localeCompare(a.createdAt);
    }),
    updatedAt: now,
  };
};

export const markNotificationRead = (state: NotificationCentreState, id: string): NotificationCentreState => ({
  ...state,
  items: state.items.map((item) => (item.id === id ? { ...item, read: true } : item)),
  updatedAt: new Date().toISOString(),
});

export const dismissNotification = (state: NotificationCentreState, id: string): NotificationCentreState => ({
  ...state,
  items: state.items.map((item) => (item.id === id ? { ...item, dismissed: true, read: true } : item)),
  updatedAt: new Date().toISOString(),
});

export const markAllNotificationsRead = (state: NotificationCentreState): NotificationCentreState => ({
  ...state,
  items: state.items.map((item) => ({ ...item, read: true })),
  updatedAt: new Date().toISOString(),
});

export const visibleNotifications = (state: NotificationCentreState): AppNotification[] =>
  state.items.filter((item) => !item.dismissed);

export const unreadNotificationCount = (state: NotificationCentreState): number =>
  visibleNotifications(state).filter((item) => !item.read).length;
