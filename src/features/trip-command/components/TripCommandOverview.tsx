import { toTripBriefSummary } from '../../trip-brief/adapters/tripBrief.adapter';
import { CommandKpiCard } from './CommandKpiCard';
import { useTripCommand } from '../state/useTripCommand';

export function TripCommandOverview() {
  const { activeTrip, activeDestination, activeTripPlaces, reminderCounts, tripMapPoints } = useTripCommand();
  const remindersDue = reminderCounts.overdue + reminderCounts.today;
  const mapReadyCount = activeTripPlaces.filter((place) => typeof place.lat === 'number' && typeof place.lng === 'number').length;
  const tripBriefSummary = toTripBriefSummary(activeTrip);

  if (!activeTrip) {
    return null;
  }

  return (
    <div className="space-y-4 rounded-3xl border border-white/10 bg-gradient-to-br from-sky-500/10 to-indigo-500/5 p-5">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-sky-200">Trip command centre</p>
        <h3 className="mt-2 text-2xl font-bold text-white">{activeTrip.name}</h3>
        <p className="mt-2 text-sm text-slate-300">
          Active destination: <span className="font-semibold text-slate-100">{activeDestination?.name ?? 'Not set'}</span>
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <CommandKpiCard hint="Current active destination scope" label="Saved places" value={`${activeTripPlaces.length}`} />
        <CommandKpiCard hint="Overdue + due today" label="Reminders due" value={`${remindersDue}`} />
        <CommandKpiCard hint="Lat/lng available" label="Map-ready points" value={`${mapReadyCount}`} />
        <CommandKpiCard hint="All map adapter records" label="Trip map points" value={`${tripMapPoints.length}`} />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Trip brief summary</p>
          <p className="mt-2 text-sm text-slate-200">{tripBriefSummary?.objective ?? 'No brief data yet.'}</p>
          <p className="mt-2 text-xs text-slate-300">
            Style: {tripBriefSummary?.travelStyle ?? 'N/A'} · Party: {tripBriefSummary?.party ?? 'N/A'}
          </p>
          <p className="mt-1 text-xs text-slate-300">Window: {tripBriefSummary?.dateWindowLabel ?? 'N/A'}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">System readiness</p>
          <ul className="mt-2 space-y-1 text-sm text-slate-200">
            <li>
              Itinerary: {activeTrip.itineraryDays.length} day(s),{' '}
              {activeTrip.itineraryDays.reduce((sum, day) => sum + day.activities.length, 0)} activity slot(s)
            </li>
            <li>Budget model: {activeTrip.budget.currency} stub ready</li>
            <li>Documents: {activeTrip.documents.length} stub(s)</li>
            <li>AI context: {activeTrip.aiContext.persona}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
