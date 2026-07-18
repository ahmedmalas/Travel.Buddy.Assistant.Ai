import { calculateBudgetSummary, daysUntil } from '../platformCalculations';
import { collectDocumentExpiryReminders } from '../vaultCalculations';
import type { VaultTrip } from '../vaultDomain';
import type { AppNotification } from '../notifications/notificationCentre';

export type CommandCentreModel = {
  tripCount: number;
  activeTripCount: number;
  draftTripCount: number;
  archivedTripCount: number;
  favouriteCount: number;
  currentTrip: VaultTrip | null;
  upcomingDepartures: Array<{ tripId: string; tripName: string; destination: string; departureDate: string; daysUntil: number }>;
  alerts: AppNotification[];
  recentActivity: Array<{ tripId: string; tripName: string; message: string; at: string }>;
  budgetStatus: Array<{ tripId: string; tripName: string; planned: number; actual: number; remaining: number; overBudget: boolean; currency: string }>;
  documentsExpiring: Array<{ tripId: string; tripName: string; title: string; expiryDate: string; daysUntilExpiry: number }>;
  quickActions: Array<{ id: string; label: string; tab: string }>;
};

export const buildCommandCentre = (
  trips: VaultTrip[],
  activeTripId: string,
  alerts: AppNotification[] = [],
): CommandCentreModel => {
  const currentTrip = trips.find((trip) => trip.id === activeTripId) ?? trips[0] ?? null;
  const upcomingDepartures = trips
    .map((trip) => {
      const days = daysUntil(trip.departureDate);
      return days === null || days < 0
        ? null
        : {
            tripId: trip.id,
            tripName: trip.tripName,
            destination: trip.destination,
            departureDate: trip.departureDate,
            daysUntil: days,
          };
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 8);

  const recentActivity = trips
    .flatMap((trip) =>
      trip.activityLog.slice(0, 5).map((entry) => ({
        tripId: trip.id,
        tripName: trip.tripName,
        message: entry.message,
        at: entry.at,
      })),
    )
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 12);

  const budgetStatus = trips
    .filter((trip) => trip.status !== 'archived')
    .map((trip) => {
      const summary = calculateBudgetSummary(trip);
      return {
        tripId: trip.id,
        tripName: trip.tripName,
        planned: summary.plannedBudget,
        actual: summary.actualSpending,
        remaining: summary.remainingBalance,
        overBudget: summary.overBudget,
        currency: summary.currency,
      };
    });

  const documentsExpiring = collectDocumentExpiryReminders(trips).slice(0, 8).map((reminder) => ({
    tripId: reminder.tripId,
    tripName: reminder.tripName,
    title: reminder.title,
    expiryDate: reminder.expiryDate,
    daysUntilExpiry: reminder.daysUntilExpiry,
  }));

  return {
    tripCount: trips.length,
    activeTripCount: trips.filter((trip) => trip.status === 'active').length,
    draftTripCount: trips.filter((trip) => trip.status === 'draft').length,
    archivedTripCount: trips.filter((trip) => trip.status === 'archived').length,
    favouriteCount: trips.filter((trip) => trip.favourite).length,
    currentTrip,
    upcomingDepartures,
    alerts: alerts.filter((alert) => !alert.dismissed).slice(0, 8),
    recentActivity,
    budgetStatus,
    documentsExpiring,
    quickActions: [
      { id: 'new-trip', label: 'New trip', tab: 'vault' },
      { id: 'open-calendar', label: 'Open calendar', tab: 'calendar' },
      { id: 'open-documents', label: 'Check documents', tab: 'documents' },
      { id: 'open-notifications', label: 'Notifications', tab: 'notifications' },
      { id: 'open-sync', label: 'Sync status', tab: 'sync' },
      { id: 'open-import', label: 'Import backup', tab: 'import' },
    ],
  };
};
