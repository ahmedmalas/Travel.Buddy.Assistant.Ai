import { useSharedTripStore } from '../../store/TripStoreContext';
import { EmptyState, Field, Panel, SecondaryButton, inputClassName } from './shared/ui';

export function GlobalSearchPanel() {
  const { globalSearchQuery, setGlobalSearchQuery, globalSearchResults, openVaultTrip } = useSharedTripStore();

  return (
    <Panel title="Global search" description="Search across all vault trips, itinerary, bookings, expenses, packing, travellers, and documents.">
      <Field label="Search query" htmlFor="global-search">
        <input
          id="global-search"
          className={inputClassName}
          value={globalSearchQuery}
          onChange={(event) => setGlobalSearchQuery(event.target.value)}
          placeholder="Try hotel, tram, passport…"
        />
      </Field>
      <div className="mt-4 space-y-2">
        {globalSearchQuery.trim() && globalSearchResults.length === 0 ? (
          <EmptyState title="No matches" body="Try another keyword across your vault." />
        ) : null}
        {!globalSearchQuery.trim() ? (
          <EmptyState title="Start typing" body="Results appear as you search the local vault." />
        ) : null}
        {globalSearchResults.map((hit) => (
          <article key={hit.id} className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-sky-300">
                  {hit.entity} · {hit.tripName}
                </p>
                <p className="mt-1 font-medium text-white">{hit.title}</p>
                <p className="mt-1 text-sm text-slate-400">{hit.subtitle}</p>
              </div>
              <SecondaryButton type="button" onClick={() => openVaultTrip(hit.tripId)}>
                Open trip
              </SecondaryButton>
            </div>
          </article>
        ))}
      </div>
    </Panel>
  );
}
