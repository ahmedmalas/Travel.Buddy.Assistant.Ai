import { useState } from 'react';
import { useSharedTripStore } from '../../store/TripStoreContext';
import {
  PAYMENT_STATUSES,
  STAY_TYPES,
  type AccommodationStay,
  type PaymentStatus,
  type StayType,
} from '../../store/travelOpsDomain';
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

const createStay = (currency: string): AccommodationStay => ({
  id: crypto.randomUUID(),
  type: 'hotel',
  name: '',
  address: '',
  contactPhone: '',
  contactEmail: '',
  checkInDate: '',
  checkInTime: '',
  checkOutDate: '',
  checkOutTime: '',
  roomInfo: '',
  confirmationNumber: '',
  cost: 0,
  currency,
  paymentStatus: 'unpaid',
  amenities: '',
  notes: '',
  itineraryStopId: null,
  travellerIds: [],
});

export function StaysPanel() {
  const { activeVaultTrip, upsertStay, deleteStay, canEditTrip } = useSharedTripStore();
  const stays = activeVaultTrip.stays ?? [];
  const travellers = activeVaultTrip.travellers ?? [];
  const [draft, setDraft] = useState<AccommodationStay>(createStay(activeVaultTrip.currency));
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
    if (!draft.name.trim()) {
      setFeedback('Accommodation name is required.');
      return;
    }
    upsertStay({
      ...draft,
      itineraryStopId: draft.itineraryStopId?.trim() || null,
    });
    setDraft(createStay(activeVaultTrip.currency));
    setFeedback('Stay saved.');
  };

  return (
    <Panel title="Accommodation stays" description="Hotels, apartments, and other stays with check-in details, costs, and optional itinerary links.">
      {feedback ? <StatusBanner kind="info" message={feedback} /> : null}
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <Field label="Name" htmlFor="stay-name">
          <input id="stay-name" className={inputClassName} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        </Field>
        <Field label="Type" htmlFor="stay-type">
          <select id="stay-type" className={inputClassName} value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as StayType })}>
            {STAY_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Payment status" htmlFor="stay-payment">
          <select
            id="stay-payment"
            className={inputClassName}
            value={draft.paymentStatus}
            onChange={(e) => setDraft({ ...draft, paymentStatus: e.target.value as PaymentStatus })}
          >
            {PAYMENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Check-in date" htmlFor="stay-checkin-date">
          <input id="stay-checkin-date" type="date" className={inputClassName} value={draft.checkInDate} onChange={(e) => setDraft({ ...draft, checkInDate: e.target.value })} />
        </Field>
        <Field label="Check-in time" htmlFor="stay-checkin-time">
          <input id="stay-checkin-time" type="time" className={inputClassName} value={draft.checkInTime} onChange={(e) => setDraft({ ...draft, checkInTime: e.target.value })} />
        </Field>
        <Field label="Check-out date" htmlFor="stay-checkout-date">
          <input id="stay-checkout-date" type="date" className={inputClassName} value={draft.checkOutDate} onChange={(e) => setDraft({ ...draft, checkOutDate: e.target.value })} />
        </Field>
        <Field label="Check-out time" htmlFor="stay-checkout-time">
          <input id="stay-checkout-time" type="time" className={inputClassName} value={draft.checkOutTime} onChange={(e) => setDraft({ ...draft, checkOutTime: e.target.value })} />
        </Field>
        <div className="md:col-span-2 xl:col-span-3">
          <Field label="Address" htmlFor="stay-address">
            <input id="stay-address" className={inputClassName} value={draft.address} onChange={(e) => setDraft({ ...draft, address: e.target.value })} />
          </Field>
        </div>
        <Field label="Contact phone" htmlFor="stay-phone">
          <input id="stay-phone" className={inputClassName} value={draft.contactPhone} onChange={(e) => setDraft({ ...draft, contactPhone: e.target.value })} />
        </Field>
        <Field label="Contact email" htmlFor="stay-email">
          <input id="stay-email" type="email" className={inputClassName} value={draft.contactEmail} onChange={(e) => setDraft({ ...draft, contactEmail: e.target.value })} />
        </Field>
        <Field label="Room info" htmlFor="stay-room">
          <input id="stay-room" className={inputClassName} value={draft.roomInfo} onChange={(e) => setDraft({ ...draft, roomInfo: e.target.value })} />
        </Field>
        <Field label="Confirmation number" htmlFor="stay-confirmation">
          <input id="stay-confirmation" className={inputClassName} value={draft.confirmationNumber} onChange={(e) => setDraft({ ...draft, confirmationNumber: e.target.value })} />
        </Field>
        <Field label="Cost" htmlFor="stay-cost">
          <input id="stay-cost" type="number" min={0} className={inputClassName} value={draft.cost} onChange={(e) => setDraft({ ...draft, cost: Number(e.target.value) })} />
        </Field>
        <Field label="Currency" htmlFor="stay-currency">
          <input id="stay-currency" className={inputClassName} value={draft.currency} onChange={(e) => setDraft({ ...draft, currency: e.target.value.toUpperCase() })} />
        </Field>
        <Field label="Itinerary stop ID (optional)" htmlFor="stay-stop-id">
          <input
            id="stay-stop-id"
            className={inputClassName}
            value={draft.itineraryStopId ?? ''}
            onChange={(e) => setDraft({ ...draft, itineraryStopId: e.target.value || null })}
          />
        </Field>
        <div className="md:col-span-2 xl:col-span-3">
          <Field label="Amenities" htmlFor="stay-amenities">
            <textarea id="stay-amenities" rows={2} className={inputClassName} value={draft.amenities} onChange={(e) => setDraft({ ...draft, amenities: e.target.value })} />
          </Field>
        </div>
        <div className="md:col-span-2 xl:col-span-3">
          <Field label="Traveller note" htmlFor="stay-notes">
            <textarea id="stay-notes" rows={2} className={inputClassName} value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
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
          Save stay
        </PrimaryButton>
        <SecondaryButton type="button" onClick={() => setDraft(createStay(activeVaultTrip.currency))}>
          Reset form
        </SecondaryButton>
      </div>

      <div className="mt-6 space-y-3">
        {stays.length === 0 ? (
          <EmptyState title="No stays yet" body="Add accommodation with check-in times, confirmation numbers, and payment status." />
        ) : (
          stays.map((stay) => (
            <article key={stay.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-white">{stay.name}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-sky-300">
                    {stay.type} · {stay.paymentStatus}
                  </p>
                  <p className="mt-2 text-sm text-slate-300">{stay.address || 'No address'}</p>
                  <p className="mt-1 text-sm text-slate-400">
                    Check-in {stay.checkInDate || '—'} {stay.checkInTime} · Check-out {stay.checkOutDate || '—'} {stay.checkOutTime}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    Conf {stay.confirmationNumber || '—'} · {stay.cost.toFixed(2)} {stay.currency}
                  </p>
                  {stay.itineraryStopId ? (
                    <StatusBadge label={`Stop ${stay.itineraryStopId}`} tone="neutral" />
                  ) : null}
                  {stay.notes ? <p className="mt-2 text-sm text-slate-300">{stay.notes}</p> : null}
                </div>
                <div className="flex gap-2">
                  <SecondaryButton type="button" onClick={() => setDraft(stay)}>
                    Edit
                  </SecondaryButton>
                  <SecondaryButton type="button" disabled={!canEditTrip} onClick={() => deleteStay(stay.id)}>
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
