import { useState } from 'react';
import {
  BOOKING_STATUSES,
  BOOKING_TYPES,
  type Booking,
  type BookingStatus,
  type BookingType,
} from '../../store/tripDomain';
import { useSharedTripStore } from '../../store/TripStoreContext';
import {
  EmptyState,
  Field,
  Panel,
  PrimaryButton,
  SecondaryButton,
  StatusBanner,
  inputClassName,
} from './shared/ui';

const createBooking = (currency: string): Booking => ({
  id: crypto.randomUUID(),
  type: 'flight',
  title: '',
  provider: '',
  confirmationNumber: '',
  startDate: '',
  endDate: '',
  startTime: '',
  endTime: '',
  location: '',
  cost: 0,
  currency,
  status: 'planned',
  notes: '',
  link: '',
  attachmentName: '',
  attachmentMimeType: '',
});

export function BookingsManager() {
  const { trip, upsertBooking, deleteBooking } = useSharedTripStore();
  const [draft, setDraft] = useState<Booking>(createBooking(trip.currency));
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSave = () => {
    if (!draft.title.trim()) {
      setFeedback('Booking title is required.');
      return;
    }
    upsertBooking(draft);
    setDraft(createBooking(trip.currency));
    setFeedback('Booking saved.');
  };

  return (
    <Panel title="Bookings manager" description="Track flights, hotels, transport, activities, and other reservations locally. No external booking APIs.">
      {feedback ? <StatusBanner kind="info" message={feedback} /> : null}
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <Field label="Title" htmlFor="booking-title">
          <input id="booking-title" className={inputClassName} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
        </Field>
        <Field label="Type" htmlFor="booking-type">
          <select id="booking-type" className={inputClassName} value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as BookingType })}>
            {BOOKING_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </Field>
        <Field label="Status" htmlFor="booking-status">
          <select id="booking-status" className={inputClassName} value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as BookingStatus })}>
            {BOOKING_STATUSES.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </Field>
        <Field label="Provider" htmlFor="booking-provider">
          <input id="booking-provider" className={inputClassName} value={draft.provider} onChange={(e) => setDraft({ ...draft, provider: e.target.value })} />
        </Field>
        <Field label="Confirmation number" htmlFor="booking-confirmation">
          <input id="booking-confirmation" className={inputClassName} value={draft.confirmationNumber} onChange={(e) => setDraft({ ...draft, confirmationNumber: e.target.value })} />
        </Field>
        <Field label="Location" htmlFor="booking-location">
          <input id="booking-location" className={inputClassName} value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })} />
        </Field>
        <Field label="Start date" htmlFor="booking-start-date">
          <input id="booking-start-date" type="date" className={inputClassName} value={draft.startDate} onChange={(e) => setDraft({ ...draft, startDate: e.target.value })} />
        </Field>
        <Field label="End date" htmlFor="booking-end-date">
          <input id="booking-end-date" type="date" className={inputClassName} value={draft.endDate} onChange={(e) => setDraft({ ...draft, endDate: e.target.value })} />
        </Field>
        <Field label="Start time" htmlFor="booking-start-time">
          <input id="booking-start-time" type="time" className={inputClassName} value={draft.startTime} onChange={(e) => setDraft({ ...draft, startTime: e.target.value })} />
        </Field>
        <Field label="End time" htmlFor="booking-end-time">
          <input id="booking-end-time" type="time" className={inputClassName} value={draft.endTime} onChange={(e) => setDraft({ ...draft, endTime: e.target.value })} />
        </Field>
        <Field label="Cost" htmlFor="booking-cost">
          <input id="booking-cost" type="number" min={0} className={inputClassName} value={draft.cost} onChange={(e) => setDraft({ ...draft, cost: Number(e.target.value) })} />
        </Field>
        <Field label="Currency" htmlFor="booking-currency">
          <input id="booking-currency" className={inputClassName} value={draft.currency} onChange={(e) => setDraft({ ...draft, currency: e.target.value.toUpperCase() })} />
        </Field>
        <Field label="Link" htmlFor="booking-link">
          <input id="booking-link" className={inputClassName} value={draft.link} onChange={(e) => setDraft({ ...draft, link: e.target.value })} />
        </Field>
        <Field label="Attachment name (metadata only)" htmlFor="booking-attachment">
          <input id="booking-attachment" className={inputClassName} value={draft.attachmentName} onChange={(e) => setDraft({ ...draft, attachmentName: e.target.value })} />
        </Field>
        <Field label="Attachment MIME type" htmlFor="booking-mime">
          <input id="booking-mime" className={inputClassName} value={draft.attachmentMimeType} onChange={(e) => setDraft({ ...draft, attachmentMimeType: e.target.value })} />
        </Field>
        <div className="md:col-span-2 xl:col-span-3">
          <Field label="Notes" htmlFor="booking-notes">
            <textarea id="booking-notes" rows={2} className={inputClassName} value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
          </Field>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <PrimaryButton type="button" onClick={handleSave}>Save booking</PrimaryButton>
        <SecondaryButton type="button" onClick={() => setDraft(createBooking(trip.currency))}>Reset form</SecondaryButton>
      </div>

      <div className="mt-6 space-y-3">
        {trip.bookings.length === 0 ? (
          <EmptyState title="No bookings yet" body="Add flights, hotels, and other reservations to keep confirmations in one place." />
        ) : (
          trip.bookings.map((booking) => (
            <article key={booking.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-white">{booking.title}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-sky-300">{booking.type} · {booking.status}</p>
                  <p className="mt-2 text-sm text-slate-300">
                    {booking.provider || 'No provider'} · Conf {booking.confirmationNumber || '—'}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    {booking.startDate || '—'} {booking.startTime} → {booking.endDate || '—'} {booking.endTime}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">{booking.location || 'No location'}</p>
                  <p className="mt-1 text-sm text-slate-300">{booking.cost.toFixed(2)} {booking.currency}</p>
                  {booking.link ? <p className="mt-1 text-xs text-sky-200 break-all">{booking.link}</p> : null}
                  {booking.attachmentName ? (
                    <p className="mt-1 text-xs text-slate-500">
                      Attachment metadata: {booking.attachmentName}
                      {booking.attachmentMimeType ? ` (${booking.attachmentMimeType})` : ''}
                    </p>
                  ) : null}
                  <p className="mt-2 text-sm text-slate-300">{booking.notes || 'No notes'}</p>
                </div>
                <div className="flex gap-2">
                  <SecondaryButton type="button" onClick={() => setDraft(booking)}>Edit</SecondaryButton>
                  <SecondaryButton type="button" onClick={() => deleteBooking(booking.id)}>Delete</SecondaryButton>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </Panel>
  );
}
