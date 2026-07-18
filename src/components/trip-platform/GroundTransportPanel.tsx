import { useState } from 'react';
import { useSharedTripStore } from '../../store/TripStoreContext';
import { GROUND_TRANSPORT_MODES, type GroundTransport, type GroundTransportMode } from '../../store/travelOpsDomain';
import {
  EmptyState,
  Field,
  Panel,
  PrimaryButton,
  SecondaryButton,
  StatusBanner,
  StatusBadge,
  inputClassName,
} from './shared/ui';

const TRANSPORT_STATUSES: GroundTransport['status'][] = ['planned', 'confirmed', 'completed', 'cancelled'];

const createTransport = (currency: string): GroundTransport => ({
  id: crypto.randomUUID(),
  mode: 'transfer',
  provider: '',
  reference: '',
  pickupLocation: '',
  dropoffLocation: '',
  pickupDate: '',
  pickupTime: '',
  dropoffDate: '',
  dropoffTime: '',
  cost: 0,
  currency,
  status: 'planned',
  notes: '',
  travellerIds: [],
});

export function GroundTransportPanel() {
  const { activeVaultTrip, upsertGroundTransport, deleteGroundTransport, canEditTrip } = useSharedTripStore();
  const items = activeVaultTrip.groundTransport ?? [];
  const travellers = activeVaultTrip.travellers ?? [];
  const [draft, setDraft] = useState<GroundTransport>(createTransport(activeVaultTrip.currency));
  const [feedback, setFeedback] = useState<string | null>(null);

  const toggleTraveller = (travellerId: string) => {
    setDraft((current) => ({
      ...current,
      travellerIds: current.travellerIds.includes(travellerId)
        ? current.travellerIds.filter((id) => id !== travellerId)
        : [...current.travellerIds, travellerId],
    }));
  };

  const handleSave = () => {
    if (!draft.provider.trim() && !draft.pickupLocation.trim()) {
      setFeedback('Provider or pickup location is required.');
      return;
    }
    upsertGroundTransport(draft);
    setDraft(createTransport(activeVaultTrip.currency));
    setFeedback('Ground transport saved.');
  };

  return (
    <Panel title="Ground transport" description="Car hire, trains, transfers, and local transport with pickup/dropoff details and booking references.">
      {feedback ? <StatusBanner kind="info" message={feedback} /> : null}
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <Field label="Mode" htmlFor="gt-mode">
          <select id="gt-mode" className={inputClassName} value={draft.mode} onChange={(e) => setDraft({ ...draft, mode: e.target.value as GroundTransportMode })}>
            {GROUND_TRANSPORT_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {mode}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Status" htmlFor="gt-status">
          <select
            id="gt-status"
            className={inputClassName}
            value={draft.status}
            onChange={(e) => setDraft({ ...draft, status: e.target.value as GroundTransport['status'] })}
          >
            {TRANSPORT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Provider" htmlFor="gt-provider">
          <input id="gt-provider" className={inputClassName} value={draft.provider} onChange={(e) => setDraft({ ...draft, provider: e.target.value })} />
        </Field>
        <Field label="Reference" htmlFor="gt-ref">
          <input id="gt-ref" className={inputClassName} value={draft.reference} onChange={(e) => setDraft({ ...draft, reference: e.target.value })} />
        </Field>
        <Field label="Pickup location" htmlFor="gt-pickup-loc">
          <input id="gt-pickup-loc" className={inputClassName} value={draft.pickupLocation} onChange={(e) => setDraft({ ...draft, pickupLocation: e.target.value })} />
        </Field>
        <Field label="Dropoff location" htmlFor="gt-dropoff-loc">
          <input id="gt-dropoff-loc" className={inputClassName} value={draft.dropoffLocation} onChange={(e) => setDraft({ ...draft, dropoffLocation: e.target.value })} />
        </Field>
        <Field label="Pickup date" htmlFor="gt-pickup-date">
          <input id="gt-pickup-date" type="date" className={inputClassName} value={draft.pickupDate} onChange={(e) => setDraft({ ...draft, pickupDate: e.target.value })} />
        </Field>
        <Field label="Pickup time" htmlFor="gt-pickup-time">
          <input id="gt-pickup-time" type="time" className={inputClassName} value={draft.pickupTime} onChange={(e) => setDraft({ ...draft, pickupTime: e.target.value })} />
        </Field>
        <Field label="Dropoff date" htmlFor="gt-dropoff-date">
          <input id="gt-dropoff-date" type="date" className={inputClassName} value={draft.dropoffDate} onChange={(e) => setDraft({ ...draft, dropoffDate: e.target.value })} />
        </Field>
        <Field label="Dropoff time" htmlFor="gt-dropoff-time">
          <input id="gt-dropoff-time" type="time" className={inputClassName} value={draft.dropoffTime} onChange={(e) => setDraft({ ...draft, dropoffTime: e.target.value })} />
        </Field>
        <Field label="Cost" htmlFor="gt-cost">
          <input id="gt-cost" type="number" min={0} className={inputClassName} value={draft.cost} onChange={(e) => setDraft({ ...draft, cost: Number(e.target.value) })} />
        </Field>
        <Field label="Currency" htmlFor="gt-currency">
          <input id="gt-currency" className={inputClassName} value={draft.currency} onChange={(e) => setDraft({ ...draft, currency: e.target.value.toUpperCase() })} />
        </Field>
        <div className="md:col-span-2 xl:col-span-3">
          <Field label="Notes" htmlFor="gt-notes">
            <textarea id="gt-notes" rows={2} className={inputClassName} value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
          </Field>
        </div>
        {travellers.length > 0 ? (
          <div className="md:col-span-2 xl:col-span-3">
            <p className="mb-2 text-sm font-medium text-slate-100">Travellers</p>
            <div className="flex flex-wrap gap-3">
              {travellers.map((traveller) => (
                <label key={traveller.id} className="flex items-center gap-2 text-sm text-slate-200">
                  <input type="checkbox" checked={draft.travellerIds.includes(traveller.id)} onChange={() => toggleTraveller(traveller.id)} />
                  {traveller.name || 'Unnamed'}
                </label>
              ))}
            </div>
          </div>
        ) : null}
      </div>
      <div className="mt-3 flex gap-2">
        <PrimaryButton type="button" disabled={!canEditTrip} onClick={handleSave}>
          Save transport
        </PrimaryButton>
        <SecondaryButton type="button" onClick={() => setDraft(createTransport(activeVaultTrip.currency))}>
          Reset form
        </SecondaryButton>
      </div>

      <div className="mt-6 space-y-3">
        {items.length === 0 ? (
          <EmptyState title="No ground transport yet" body="Add transfers, trains, car hire, and other local transport legs." />
        ) : (
          items.map((item) => (
            <article key={item.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-white">{item.provider || item.mode}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-sky-300">
                    {item.mode} · {item.status}
                  </p>
                  <p className="mt-2 text-sm text-slate-300">
                    {item.pickupLocation || 'Pickup n/a'} → {item.dropoffLocation || 'Dropoff n/a'}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    {item.pickupDate} {item.pickupTime} → {item.dropoffDate} {item.dropoffTime}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    Ref {item.reference || '—'} · {item.cost.toFixed(2)} {item.currency}
                  </p>
                  {item.notes ? <p className="mt-2 text-sm text-slate-300">{item.notes}</p> : null}
                </div>
                <div className="flex gap-2">
                  <StatusBadge label={item.status} tone={item.status === 'cancelled' ? 'danger' : 'info'} />
                  <SecondaryButton type="button" onClick={() => setDraft(item)}>
                    Edit
                  </SecondaryButton>
                  <SecondaryButton type="button" disabled={!canEditTrip} onClick={() => deleteGroundTransport(item.id)}>
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
