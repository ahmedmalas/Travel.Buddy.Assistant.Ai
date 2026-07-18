import { useState } from 'react';
import { useSharedTripStore } from '../../store/TripStoreContext';
import {
  FLIGHT_CHECK_IN_STATUSES,
  type FlightCheckInStatus,
  type FlightSegment,
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

const createFlight = (currency: string): FlightSegment => ({
  id: crypto.randomUUID(),
  airline: '',
  flightNumber: '',
  bookingReference: '',
  departureAirport: '',
  arrivalAirport: '',
  departureTerminal: '',
  arrivalTerminal: '',
  departureGate: '',
  arrivalGate: '',
  departureDate: '',
  departureTime: '',
  arrivalDate: '',
  arrivalTime: '',
  layoverMinutes: 0,
  cabin: '',
  seat: '',
  baggageAllowance: '',
  checkInStatus: 'not-open',
  statusNotes: '',
  travellerIds: [],
  cost: 0,
  currency,
  notes: '',
});

export function FlightsPanel() {
  const { activeVaultTrip, upsertFlight, deleteFlight, canEditTrip } = useSharedTripStore();
  const flights = activeVaultTrip.flights ?? [];
  const travellers = activeVaultTrip.travellers ?? [];
  const [draft, setDraft] = useState<FlightSegment>(createFlight(activeVaultTrip.currency));
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
    if (!draft.airline.trim() && !draft.flightNumber.trim()) {
      setFeedback('Airline or flight number is required.');
      return;
    }
    upsertFlight(draft);
    setDraft(createFlight(activeVaultTrip.currency));
    setFeedback('Flight segment saved.');
  };

  return (
    <Panel title="Flight segments" description="Track airline segments, terminals, gates, check-in status, and baggage locally. No live flight APIs.">
      {feedback ? <StatusBanner kind="info" message={feedback} /> : null}
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <Field label="Airline" htmlFor="flight-airline">
          <input id="flight-airline" className={inputClassName} value={draft.airline} onChange={(e) => setDraft({ ...draft, airline: e.target.value })} />
        </Field>
        <Field label="Flight number" htmlFor="flight-number">
          <input id="flight-number" className={inputClassName} value={draft.flightNumber} onChange={(e) => setDraft({ ...draft, flightNumber: e.target.value })} />
        </Field>
        <Field label="Booking reference" htmlFor="flight-ref">
          <input id="flight-ref" className={inputClassName} value={draft.bookingReference} onChange={(e) => setDraft({ ...draft, bookingReference: e.target.value })} />
        </Field>
        <Field label="Departure airport" htmlFor="flight-dep-airport">
          <input id="flight-dep-airport" className={inputClassName} value={draft.departureAirport} onChange={(e) => setDraft({ ...draft, departureAirport: e.target.value.toUpperCase() })} />
        </Field>
        <Field label="Arrival airport" htmlFor="flight-arr-airport">
          <input id="flight-arr-airport" className={inputClassName} value={draft.arrivalAirport} onChange={(e) => setDraft({ ...draft, arrivalAirport: e.target.value.toUpperCase() })} />
        </Field>
        <Field label="Layover (minutes)" htmlFor="flight-layover">
          <input id="flight-layover" type="number" min={0} className={inputClassName} value={draft.layoverMinutes} onChange={(e) => setDraft({ ...draft, layoverMinutes: Number(e.target.value) })} />
        </Field>
        <Field label="Departure terminal" htmlFor="flight-dep-term">
          <input id="flight-dep-term" className={inputClassName} value={draft.departureTerminal} onChange={(e) => setDraft({ ...draft, departureTerminal: e.target.value })} />
        </Field>
        <Field label="Arrival terminal" htmlFor="flight-arr-term">
          <input id="flight-arr-term" className={inputClassName} value={draft.arrivalTerminal} onChange={(e) => setDraft({ ...draft, arrivalTerminal: e.target.value })} />
        </Field>
        <Field label="Departure gate" htmlFor="flight-dep-gate">
          <input id="flight-dep-gate" className={inputClassName} value={draft.departureGate} onChange={(e) => setDraft({ ...draft, departureGate: e.target.value })} />
        </Field>
        <Field label="Arrival gate" htmlFor="flight-arr-gate">
          <input id="flight-arr-gate" className={inputClassName} value={draft.arrivalGate} onChange={(e) => setDraft({ ...draft, arrivalGate: e.target.value })} />
        </Field>
        <Field label="Departure date" htmlFor="flight-dep-date">
          <input id="flight-dep-date" type="date" className={inputClassName} value={draft.departureDate} onChange={(e) => setDraft({ ...draft, departureDate: e.target.value })} />
        </Field>
        <Field label="Departure time" htmlFor="flight-dep-time">
          <input id="flight-dep-time" type="time" className={inputClassName} value={draft.departureTime} onChange={(e) => setDraft({ ...draft, departureTime: e.target.value })} />
        </Field>
        <Field label="Arrival date" htmlFor="flight-arr-date">
          <input id="flight-arr-date" type="date" className={inputClassName} value={draft.arrivalDate} onChange={(e) => setDraft({ ...draft, arrivalDate: e.target.value })} />
        </Field>
        <Field label="Arrival time" htmlFor="flight-arr-time">
          <input id="flight-arr-time" type="time" className={inputClassName} value={draft.arrivalTime} onChange={(e) => setDraft({ ...draft, arrivalTime: e.target.value })} />
        </Field>
        <Field label="Cabin" htmlFor="flight-cabin">
          <input id="flight-cabin" className={inputClassName} value={draft.cabin} onChange={(e) => setDraft({ ...draft, cabin: e.target.value })} />
        </Field>
        <Field label="Seat" htmlFor="flight-seat">
          <input id="flight-seat" className={inputClassName} value={draft.seat} onChange={(e) => setDraft({ ...draft, seat: e.target.value })} />
        </Field>
        <Field label="Baggage allowance" htmlFor="flight-baggage">
          <input id="flight-baggage" className={inputClassName} value={draft.baggageAllowance} onChange={(e) => setDraft({ ...draft, baggageAllowance: e.target.value })} />
        </Field>
        <Field label="Check-in status" htmlFor="flight-checkin">
          <select
            id="flight-checkin"
            className={inputClassName}
            value={draft.checkInStatus}
            onChange={(e) => setDraft({ ...draft, checkInStatus: e.target.value as FlightCheckInStatus })}
          >
            {FLIGHT_CHECK_IN_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Cost" htmlFor="flight-cost">
          <input id="flight-cost" type="number" min={0} className={inputClassName} value={draft.cost} onChange={(e) => setDraft({ ...draft, cost: Number(e.target.value) })} />
        </Field>
        <Field label="Currency" htmlFor="flight-currency">
          <input id="flight-currency" className={inputClassName} value={draft.currency} onChange={(e) => setDraft({ ...draft, currency: e.target.value.toUpperCase() })} />
        </Field>
        <div className="md:col-span-2 xl:col-span-3">
          <Field label="Status notes" htmlFor="flight-status-notes">
            <textarea id="flight-status-notes" rows={2} className={inputClassName} value={draft.statusNotes} onChange={(e) => setDraft({ ...draft, statusNotes: e.target.value })} />
          </Field>
        </div>
        <div className="md:col-span-2 xl:col-span-3">
          <Field label="Notes" htmlFor="flight-notes">
            <textarea id="flight-notes" rows={2} className={inputClassName} value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
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
          Save flight
        </PrimaryButton>
        <SecondaryButton type="button" onClick={() => setDraft(createFlight(activeVaultTrip.currency))}>
          Reset form
        </SecondaryButton>
      </div>

      <div className="mt-6 space-y-3">
        {flights.length === 0 ? (
          <EmptyState title="No flights yet" body="Add segments with airports, gates, and check-in status for your itinerary." />
        ) : (
          flights.map((flight) => (
            <article key={flight.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-white">
                    {flight.airline || 'Airline'} {flight.flightNumber}
                  </p>
                  <p className="mt-1 text-sm text-slate-300">
                    {flight.departureAirport || '—'} → {flight.arrivalAirport || '—'}
                    {flight.bookingReference ? ` · Ref ${flight.bookingReference}` : ''}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    {flight.departureDate} {flight.departureTime} → {flight.arrivalDate} {flight.arrivalTime}
                    {flight.layoverMinutes > 0 ? ` · Layover ${flight.layoverMinutes}m` : ''}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    T{flight.departureTerminal || '—'}/G{flight.departureGate || '—'} → T{flight.arrivalTerminal || '—'}/G{flight.arrivalGate || '—'}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <StatusBadge label={flight.checkInStatus} tone="info" />
                    {flight.baggageAllowance ? <StatusBadge label={flight.baggageAllowance} tone="neutral" /> : null}
                  </div>
                  {flight.statusNotes ? <p className="mt-2 text-sm text-slate-300">{flight.statusNotes}</p> : null}
                </div>
                <div className="flex gap-2">
                  <SecondaryButton type="button" onClick={() => setDraft(flight)}>
                    Edit
                  </SecondaryButton>
                  <SecondaryButton type="button" disabled={!canEditTrip} onClick={() => deleteFlight(flight.id)}>
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
