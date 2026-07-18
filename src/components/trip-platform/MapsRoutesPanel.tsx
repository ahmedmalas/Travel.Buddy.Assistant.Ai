import { useState } from 'react';
import { useSharedTripStore } from '../../store/TripStoreContext';
import { type DailyRoute, type DailyRouteStop, type SavedPlace } from '../../store/travelOpsDomain';
import {
  EmptyState,
  Field,
  Panel,
  PrimaryButton,
  SecondaryButton,
  StatusBanner,
  inputClassName,
} from './shared/ui';

const createSavedPlace = (): SavedPlace => ({
  id: crypto.randomUUID(),
  name: '',
  address: '',
  latitude: '',
  longitude: '',
  category: '',
  notes: '',
  link: '',
});

const createRouteStop = (order: number): DailyRouteStop => ({
  id: crypto.randomUUID(),
  placeId: null,
  label: `Stop ${order + 1}`,
  order,
  travelMinutesFromPrevious: 0,
  distanceKmFromPrevious: 0,
  notes: '',
});

const createDailyRoute = (): DailyRoute => ({
  id: crypto.randomUUID(),
  date: '',
  title: '',
  stops: [],
  notes: '',
});

export function MapsRoutesPanel() {
  const {
    activeVaultTrip,
    upsertSavedPlace,
    deleteSavedPlace,
    upsertDailyRoute,
    deleteDailyRoute,
    canEditTrip,
  } = useSharedTripStore();
  const savedPlaces = activeVaultTrip.savedPlaces ?? [];
  const dailyRoutes = activeVaultTrip.dailyRoutes ?? [];
  const [placeDraft, setPlaceDraft] = useState<SavedPlace>(createSavedPlace());
  const [routeDraft, setRouteDraft] = useState<DailyRoute>(createDailyRoute());
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSavePlace = () => {
    if (!placeDraft.name.trim()) {
      setFeedback('Place name is required.');
      return;
    }
    upsertSavedPlace(placeDraft);
    setPlaceDraft(createSavedPlace());
    setFeedback('Saved place stored.');
  };

  const handleSaveRoute = () => {
    if (!routeDraft.title.trim() && !routeDraft.date) {
      setFeedback('Route title or date is required.');
      return;
    }
    upsertDailyRoute({
      ...routeDraft,
      title: routeDraft.title.trim() || 'Daily route',
      stops: routeDraft.stops.map((stop, index) => ({ ...stop, order: index })),
    });
    setRouteDraft(createDailyRoute());
    setFeedback('Daily route saved.');
  };

  const addRouteStop = () => {
    setRouteDraft((current) => ({
      ...current,
      stops: [...current.stops, createRouteStop(current.stops.length)],
    }));
  };

  const updateRouteStop = (stopId: string, patch: Partial<DailyRouteStop>) => {
    setRouteDraft((current) => ({
      ...current,
      stops: current.stops.map((stop) => (stop.id === stopId ? { ...stop, ...patch } : stop)),
    }));
  };

  const removeRouteStop = (stopId: string) => {
    setRouteDraft((current) => ({
      ...current,
      stops: current.stops.filter((stop) => stop.id !== stopId).map((stop, index) => ({ ...stop, order: index })),
    }));
  };

  return (
    <Panel
      title="Maps & routes"
      description="Saved places and ordered daily routes with travel times and distances. Coordinates and links are stored locally — no paid maps provider or live routing."
    >
      {feedback ? <StatusBanner kind="info" message={feedback} /> : null}

      <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-200">Saved places</h4>
      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <Field label="Name" htmlFor="place-name">
          <input id="place-name" className={inputClassName} value={placeDraft.name} onChange={(e) => setPlaceDraft({ ...placeDraft, name: e.target.value })} />
        </Field>
        <Field label="Category" htmlFor="place-category">
          <input id="place-category" className={inputClassName} value={placeDraft.category} onChange={(e) => setPlaceDraft({ ...placeDraft, category: e.target.value })} />
        </Field>
        <Field label="Link" htmlFor="place-link">
          <input id="place-link" className={inputClassName} value={placeDraft.link} onChange={(e) => setPlaceDraft({ ...placeDraft, link: e.target.value })} />
        </Field>
        <div className="md:col-span-2 xl:col-span-3">
          <Field label="Address" htmlFor="place-address">
            <input id="place-address" className={inputClassName} value={placeDraft.address} onChange={(e) => setPlaceDraft({ ...placeDraft, address: e.target.value })} />
          </Field>
        </div>
        <Field label="Latitude" htmlFor="place-lat">
          <input id="place-lat" className={inputClassName} value={placeDraft.latitude} onChange={(e) => setPlaceDraft({ ...placeDraft, latitude: e.target.value })} />
        </Field>
        <Field label="Longitude" htmlFor="place-lng">
          <input id="place-lng" className={inputClassName} value={placeDraft.longitude} onChange={(e) => setPlaceDraft({ ...placeDraft, longitude: e.target.value })} />
        </Field>
        <div className="md:col-span-2 xl:col-span-3">
          <Field label="Notes" htmlFor="place-notes">
            <textarea id="place-notes" rows={2} className={inputClassName} value={placeDraft.notes} onChange={(e) => setPlaceDraft({ ...placeDraft, notes: e.target.value })} />
          </Field>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <PrimaryButton type="button" disabled={!canEditTrip} onClick={handleSavePlace}>
          Save place
        </PrimaryButton>
        <SecondaryButton type="button" onClick={() => setPlaceDraft(createSavedPlace())}>
          Reset place form
        </SecondaryButton>
      </div>

      <div className="mt-4 space-y-2">
        {savedPlaces.length === 0 ? (
          <EmptyState title="No saved places" body="Add landmarks, restaurants, or meeting points with optional coordinates and links." />
        ) : (
          savedPlaces.map((place) => (
            <article key={place.id} className="rounded-xl border border-white/10 bg-slate-950/30 px-3 py-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm text-slate-200">
                  <span className="font-medium text-white">{place.name}</span>
                  {place.category ? ` · ${place.category}` : ''}
                  {place.address ? ` · ${place.address}` : ''}
                  {place.link ? (
                    <span className="block text-xs text-sky-200 break-all">{place.link}</span>
                  ) : null}
                </div>
                <div className="flex gap-2">
                  <SecondaryButton type="button" onClick={() => setPlaceDraft(place)}>
                    Edit
                  </SecondaryButton>
                  <SecondaryButton type="button" disabled={!canEditTrip} onClick={() => deleteSavedPlace(place.id)}>
                    Delete
                  </SecondaryButton>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      <h4 className="mt-8 text-sm font-semibold uppercase tracking-[0.16em] text-sky-200">Daily routes</h4>
      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <Field label="Date" htmlFor="route-date">
          <input id="route-date" type="date" className={inputClassName} value={routeDraft.date} onChange={(e) => setRouteDraft({ ...routeDraft, date: e.target.value })} />
        </Field>
        <Field label="Title" htmlFor="route-title">
          <input id="route-title" className={inputClassName} value={routeDraft.title} onChange={(e) => setRouteDraft({ ...routeDraft, title: e.target.value })} />
        </Field>
        <div className="md:col-span-2 xl:col-span-3">
          <Field label="Route notes" htmlFor="route-notes">
            <textarea id="route-notes" rows={2} className={inputClassName} value={routeDraft.notes} onChange={(e) => setRouteDraft({ ...routeDraft, notes: e.target.value })} />
          </Field>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {routeDraft.stops.map((stop, index) => (
          <div key={stop.id} className="rounded-xl border border-white/10 bg-slate-950/30 p-3">
            <p className="mb-2 text-xs uppercase tracking-[0.16em] text-slate-400">Stop {index + 1}</p>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Field label="Label" htmlFor={`stop-label-${stop.id}`}>
                <input
                  id={`stop-label-${stop.id}`}
                  className={inputClassName}
                  value={stop.label}
                  onChange={(e) => updateRouteStop(stop.id, { label: e.target.value })}
                />
              </Field>
              <Field label="Linked place" htmlFor={`stop-place-${stop.id}`}>
                <select
                  id={`stop-place-${stop.id}`}
                  className={inputClassName}
                  value={stop.placeId ?? ''}
                  onChange={(e) => updateRouteStop(stop.id, { placeId: e.target.value || null })}
                >
                  <option value="">None</option>
                  {savedPlaces.map((place) => (
                    <option key={place.id} value={place.id}>
                      {place.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Travel minutes" htmlFor={`stop-minutes-${stop.id}`}>
                <input
                  id={`stop-minutes-${stop.id}`}
                  type="number"
                  min={0}
                  className={inputClassName}
                  value={stop.travelMinutesFromPrevious}
                  onChange={(e) => updateRouteStop(stop.id, { travelMinutesFromPrevious: Number(e.target.value) })}
                />
              </Field>
              <Field label="Distance (km)" htmlFor={`stop-km-${stop.id}`}>
                <input
                  id={`stop-km-${stop.id}`}
                  type="number"
                  min={0}
                  step={0.1}
                  className={inputClassName}
                  value={stop.distanceKmFromPrevious}
                  onChange={(e) => updateRouteStop(stop.id, { distanceKmFromPrevious: Number(e.target.value) })}
                />
              </Field>
            </div>
            <div className="mt-2 flex justify-end">
              <SecondaryButton type="button" disabled={!canEditTrip} onClick={() => removeRouteStop(stop.id)}>
                Remove stop
              </SecondaryButton>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <SecondaryButton type="button" disabled={!canEditTrip} onClick={addRouteStop}>
          Add stop
        </SecondaryButton>
        <PrimaryButton type="button" disabled={!canEditTrip} onClick={handleSaveRoute}>
          Save route
        </PrimaryButton>
        <SecondaryButton type="button" onClick={() => setRouteDraft(createDailyRoute())}>
          Reset route form
        </SecondaryButton>
      </div>

      <div className="mt-6 space-y-3">
        {dailyRoutes.length === 0 ? (
          <EmptyState title="No daily routes" body="Build ordered stop lists with manual travel times and distances between points." />
        ) : (
          dailyRoutes.map((route) => (
            <article key={route.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-white">{route.title}</p>
                  <p className="mt-1 text-sm text-slate-400">{route.date || 'Undated'} · {route.stops.length} stop(s)</p>
                  <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-300">
                    {route.stops.map((stop) => (
                      <li key={stop.id}>
                        {stop.label}
                        {stop.travelMinutesFromPrevious > 0 || stop.distanceKmFromPrevious > 0
                          ? ` (+${stop.travelMinutesFromPrevious}m, ${stop.distanceKmFromPrevious}km)`
                          : ''}
                      </li>
                    ))}
                  </ol>
                </div>
                <div className="flex gap-2">
                  <SecondaryButton type="button" onClick={() => setRouteDraft(route)}>
                    Edit
                  </SecondaryButton>
                  <SecondaryButton type="button" disabled={!canEditTrip} onClick={() => deleteDailyRoute(route.id)}>
                    Delete
                  </SecondaryButton>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </Panel>
  );
}
