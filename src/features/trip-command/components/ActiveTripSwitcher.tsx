import { formatTripStatus } from '../model/trip.utils';
import { useTripCommand } from '../state/useTripCommand';

export function ActiveTripSwitcher() {
  const { trips, activeTripId, setActiveTrip } = useTripCommand();

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Active trip</p>
      <div className="mt-3 grid gap-2">
        {trips.map((trip) => {
          const isActive = trip.id === activeTripId;
          return (
            <button
              className={`rounded-2xl border p-3 text-left transition ${
                isActive
                  ? 'border-sky-300/60 bg-sky-500/10 text-sky-100'
                  : 'border-white/10 bg-white/[0.02] text-slate-200 hover:bg-white/[0.06]'
              }`}
              key={trip.id}
              onClick={() => setActiveTrip(trip.id)}
              type="button"
            >
              <p className="font-semibold">{trip.name}</p>
              <p className="mt-1 text-xs opacity-80">{formatTripStatus(trip.status)}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
