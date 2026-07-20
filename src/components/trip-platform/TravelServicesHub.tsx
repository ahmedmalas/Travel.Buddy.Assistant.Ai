import { useMemo, useState } from 'react';
import {
  TRAVEL_SERVICE_GROUPS,
  type ServiceAvailability,
  type TravelServiceId,
  type TravelServiceItem,
} from '../../features/travel-services/catalog';
import { useSharedTripStore } from '../../store/TripStoreContext';
import { DatePickerField, todayIso } from '../ui/DatePickerField';
import { LocationAutocomplete } from '../ui/LocationAutocomplete';
import {
  Field,
  Panel,
  PrimaryButton,
  SecondaryButton,
  StatusBadge,
  StatusBanner,
  inputClassName,
} from './shared/ui';

const availabilityTone = (
  availability: ServiceAvailability,
): 'success' | 'info' | 'warning' | 'danger' => {
  if (availability === 'Available now') return 'success';
  if (availability === 'Live search connected') return 'info';
  if (availability === 'Coming soon') return 'warning';
  return 'info';
};

export function TravelServicesHub({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const { activeVaultTrip, upsertJournalEntry, upsertGroundTransport, canEditTrip } = useSharedTripStore();
  const [activeGroup, setActiveGroup] = useState(TRAVEL_SERVICE_GROUPS[0]!.id);
  const [selected, setSelected] = useState<TravelServiceItem | null>(null);
  const [location, setLocation] = useState(activeVaultTrip.destination || '');
  const [startDate, setStartDate] = useState(activeVaultTrip.departureDate || '');
  const [endDate, setEndDate] = useState(activeVaultTrip.returnDate || '');
  const [notes, setNotes] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const group = useMemo(
    () => TRAVEL_SERVICE_GROUPS.find((entry) => entry.id === activeGroup) ?? TRAVEL_SERVICE_GROUPS[0]!,
    [activeGroup],
  );

  const savePlan = (service: TravelServiceItem) => {
    if (!canEditTrip) return;
    const summary = [
      `Service: ${service.title}`,
      `Availability: ${service.availability}`,
      location ? `Location: ${location}` : null,
      startDate ? `Start: ${startDate}` : null,
      endDate ? `End: ${endDate}` : null,
      notes ? `Notes: ${notes}` : null,
      'Status: planning request (not a confirmed booking).',
    ]
      .filter(Boolean)
      .join('\n');

    upsertJournalEntry({
      id: crypto.randomUUID(),
      date: todayIso(),
      title: `${service.title} plan`,
      notes: summary,
      highlights: service.description,
      rating: 0,
      locationName: location,
      latitude: '',
      longitude: '',
      photoAttachmentName: '',
      photoMimeType: '',
      favourite: false,
    });

    const transportModes: Partial<Record<TravelServiceId, 'car-hire' | 'taxi' | 'rideshare' | 'train' | 'bus' | 'ferry' | 'transfer' | 'other'>> = {
      'car-hire': 'car-hire',
      taxis: 'taxi',
      rideshare: 'rideshare',
      trains: 'train',
      buses: 'bus',
      ferries: 'ferry',
      'airport-transfers': 'transfer',
      'private-hire': 'other',
      chauffeur: 'other',
      'local-transport': 'other',
    };
    const mode = transportModes[service.id];
    if (mode) {
      upsertGroundTransport({
        id: crypto.randomUUID(),
        mode,
        provider: '',
        reference: '',
        pickupLocation: location,
        dropoffLocation: location,
        pickupDate: startDate,
        pickupTime: '',
        dropoffDate: endDate || startDate,
        dropoffTime: '',
        cost: 0,
        currency: activeVaultTrip.currency,
        status: 'planned',
        notes: summary,
        travellerIds: [],
      });
    }

    setFeedback(`${service.title} saved to your trip as a planning request.`);
  };

  return (
    <Panel
      title="Travel services"
      description="Grouped travel categories for booking, planning, exploring, moving, organising, and assistance. Live supplier inventory is not connected — every workflow can still capture requirements and save them to your trip."
    >
      {feedback ? <StatusBanner kind="info" message={feedback} /> : null}
      <div className="flex flex-wrap gap-2">
        {TRAVEL_SERVICE_GROUPS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            className={`rounded-full px-4 py-2 text-sm ${
              entry.id === activeGroup ? 'bg-sky-400/20 text-sky-100' : 'border border-white/15 text-slate-300'
            }`}
            onClick={() => setActiveGroup(entry.id)}
          >
            {entry.label}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {group.items.map((item) => (
          <article key={item.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-medium text-white">{item.title}</h4>
              <StatusBadge label={item.availability} tone={availabilityTone(item.availability)} />
            </div>
            <p className="mt-2 text-sm text-slate-300">{item.description}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {item.tabId ? (
                <SecondaryButton type="button" onClick={() => onNavigate?.(item.tabId!)}>
                  Open
                </SecondaryButton>
              ) : null}
              <PrimaryButton
                type="button"
                onClick={() => {
                  setSelected(item);
                  setFeedback(null);
                }}
              >
                Plan request
              </PrimaryButton>
            </div>
          </article>
        ))}
      </div>

      {selected ? (
        <div className="mt-6 rounded-2xl border border-sky-300/30 bg-sky-500/5 p-4">
          <h4 className="text-lg font-semibold text-white">Plan: {selected.title}</h4>
          <p className="mt-1 text-sm text-slate-300">{selected.description}</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Field label="Location" htmlFor="service-location">
              <LocationAutocomplete
                id="service-location"
                mode="place"
                value={location}
                onChange={setLocation}
                placeholder="City, suburb, landmark…"
              />
            </Field>
            <Field label="Notes / preferences" htmlFor="service-notes">
              <input
                id="service-notes"
                className={inputClassName}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Guests, style, budget band, constraints…"
              />
            </Field>
            <Field label="Start date" htmlFor="service-start">
              <DatePickerField
                id="service-start"
                value={startDate}
                min={todayIso()}
                onChange={(next) => {
                  setStartDate(next);
                  if (endDate && next && endDate < next) setEndDate(next);
                }}
              />
            </Field>
            <Field label="End date" htmlFor="service-end">
              <DatePickerField
                id="service-end"
                value={endDate}
                min={startDate || todayIso()}
                onChange={setEndDate}
              />
            </Field>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <PrimaryButton type="button" disabled={!canEditTrip} onClick={() => savePlan(selected)}>
              Save to trip
            </PrimaryButton>
            <SecondaryButton type="button" onClick={() => setSelected(null)}>
              Close
            </SecondaryButton>
          </div>
        </div>
      ) : null}
    </Panel>
  );
}
