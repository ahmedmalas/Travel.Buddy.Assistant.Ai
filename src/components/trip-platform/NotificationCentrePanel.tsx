import { useSharedTripStore } from '../../store/TripStoreContext';
import { EmptyState, Panel, PrimaryButton, SecondaryButton, StatusBanner } from './shared/ui';

export function NotificationCentrePanel() {
  const {
    notifications,
    unreadNotifications,
    markNotificationRead,
    dismissNotification,
    markAllNotificationsRead,
    openVaultTrip,
  } = useSharedTripStore();

  return (
    <Panel
      title="Notification centre"
      description="Departures, document expiry, unpaid expenses, booking reminders, conflicts, and packing deadlines."
      actions={
        <PrimaryButton type="button" onClick={() => markAllNotificationsRead()}>
          Mark all read
        </PrimaryButton>
      }
    >
      <p className="text-sm text-slate-300">{unreadNotifications} unread · {notifications.length} visible</p>
      <div className="mt-4 space-y-3">
        {notifications.length === 0 ? (
          <EmptyState title="No notifications" body="Alerts appear as trips approach or documents near expiry." />
        ) : (
          notifications.map((item) => (
            <article
              key={item.id}
              className={`rounded-2xl border px-4 py-3 ${
                item.read ? 'border-white/10 bg-slate-950/30' : 'border-sky-300/30 bg-sky-500/10'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-sky-300">
                    {item.kind} · {item.severity}
                  </p>
                  <p className="mt-1 font-medium text-white">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-300">{item.body}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!item.read ? (
                    <SecondaryButton type="button" onClick={() => markNotificationRead(item.id)}>
                      Mark read
                    </SecondaryButton>
                  ) : null}
                  <SecondaryButton type="button" onClick={() => dismissNotification(item.id)}>
                    Dismiss
                  </SecondaryButton>
                  {item.tripId ? (
                    <SecondaryButton type="button" onClick={() => openVaultTrip(item.tripId!)}>
                      Open trip
                    </SecondaryButton>
                  ) : null}
                </div>
              </div>
            </article>
          ))
        )}
      </div>
      {notifications.some((item) => item.severity === 'critical') ? (
        <div className="mt-4">
          <StatusBanner kind="error" message="Critical notifications require attention before departure." />
        </div>
      ) : null}
    </Panel>
  );
}
