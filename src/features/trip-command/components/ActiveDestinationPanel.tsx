import { useTripCommand } from '../state/useTripCommand';

export function ActiveDestinationPanel() {
  const { activeDestination, activeTrip, setActiveDestination } = useTripCommand();

  if (!activeTrip) {
    return null;
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Active destination</p>
      <h3 className="mt-2 text-lg font-semibold text-white">{activeDestination?.name ?? 'No destination selected'}</h3>
      <p className="mt-1 text-sm text-slate-300">{activeDestination ? `${activeDestination.region ?? ''} ${activeDestination.country}`.trim() : ''}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        {activeTrip.destinations.map((destination) => (
          <button
            className={`rounded-full border px-3 py-1 text-xs transition ${
              destination.id === activeTrip.activeDestinationId
                ? 'border-sky-300/60 bg-sky-500/10 text-sky-100'
                : 'border-white/15 bg-white/[0.02] text-slate-200 hover:bg-white/[0.06]'
            }`}
            key={destination.id}
            onClick={() => setActiveDestination(destination.id)}
            type="button"
          >
            {destination.name}
          </button>
        ))}
      </div>
    </div>
  );
}
