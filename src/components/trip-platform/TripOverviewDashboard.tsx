import { useSharedTripStore } from '../../store/TripStoreContext';
import { EmptyState, Panel } from './shared/ui';

function MetricCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-sky-300">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-400">{hint}</p> : null}
    </article>
  );
}

export function TripOverviewDashboard() {
  const { tripOverview } = useSharedTripStore();
  const countdown =
    tripOverview.daysUntilDeparture === null
      ? 'Set departure date'
      : tripOverview.daysUntilDeparture > 0
        ? `${tripOverview.daysUntilDeparture} day${tripOverview.daysUntilDeparture === 1 ? '' : 's'}`
        : tripOverview.daysUntilDeparture === 0
          ? 'Departs today'
          : `${Math.abs(tripOverview.daysUntilDeparture)} day${Math.abs(tripOverview.daysUntilDeparture) === 1 ? '' : 's'} ago`;

  return (
    <Panel title="Trip overview" description="A live snapshot of countdown, budget, packing, and recent activity.">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Countdown" value={countdown} hint={tripOverview.departureDate || 'No departure date'} />
        <MetricCard label="Destination" value={tripOverview.destination || 'Not set'} hint={`${tripOverview.departureDate || '—'} → ${tripOverview.returnDate || '—'}`} />
        <MetricCard label="Travellers" value={String(tripOverview.travellerCount)} />
        <MetricCard
          label="Budget remaining"
          value={`${tripOverview.budgetSummary.remainingBalance.toFixed(2)} ${tripOverview.budgetSummary.currency}`}
          hint={
            tripOverview.budgetSummary.overBudget
              ? 'Over budget'
              : `Spent ${tripOverview.budgetSummary.actualSpending.toFixed(2)}`
          }
        />
        <MetricCard label="Itinerary items" value={String(tripOverview.itineraryItemCount)} />
        <MetricCard label="Bookings" value={String(tripOverview.bookingCount)} />
        <MetricCard
          label="Packing progress"
          value={`${tripOverview.packingProgress.progressPercent}%`}
          hint={`${tripOverview.packingProgress.packedItems}/${tripOverview.packingProgress.totalItems} packed`}
        />
        <MetricCard label="Trip" value={tripOverview.tripName} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
          <h4 className="font-medium text-slate-100">Important alerts</h4>
          {tripOverview.alerts.length === 0 ? (
            <div className="mt-3">
              <EmptyState title="No alerts" body="Trip setup, budget, and itinerary look healthy." />
            </div>
          ) : (
            <ul className="mt-3 space-y-2 text-sm text-amber-100">
              {tripOverview.alerts.map((alert) => (
                <li key={alert} className="rounded-xl border border-amber-300/20 bg-amber-500/10 px-3 py-2">
                  {alert}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
          <h4 className="font-medium text-slate-100">Recent activity</h4>
          {tripOverview.recentActivity.length === 0 ? (
            <div className="mt-3">
              <EmptyState title="No activity yet" body="Changes to itinerary, bookings, and packing will appear here." />
            </div>
          ) : (
            <ul className="mt-3 space-y-2 text-sm text-slate-300">
              {tripOverview.recentActivity.map((entry) => (
                <li key={entry.id} className="rounded-xl border border-white/10 px-3 py-2">
                  <p>{entry.message}</p>
                  <p className="mt-1 text-xs text-slate-500">{new Date(entry.at).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Panel>
  );
}
