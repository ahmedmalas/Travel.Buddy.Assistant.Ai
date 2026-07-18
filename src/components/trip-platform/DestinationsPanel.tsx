import { useState } from 'react';
import { useSharedTripStore } from '../../store/TripStoreContext';
import { type DestinationProfile } from '../../store/travelOpsDomain';
import {
  EmptyState,
  Field,
  Panel,
  PrimaryButton,
  SecondaryButton,
  StatusBanner,
  inputClassName,
} from './shared/ui';

const createDestination = (currency: string): DestinationProfile => ({
  id: crypto.randomUUID(),
  name: '',
  country: '',
  city: '',
  region: '',
  language: '',
  currency,
  timezone: 'UTC',
  entryRequirements: '',
  safetyNotes: '',
  emergencyInfo: '',
  customsNotes: '',
  practicalNotes: '',
  savedOffline: true,
});

export function DestinationsPanel() {
  const { activeVaultTrip, upsertDestination, deleteDestination, canEditTrip } = useSharedTripStore();
  const destinations = activeVaultTrip.destinations ?? [];
  const [draft, setDraft] = useState<DestinationProfile>(createDestination(activeVaultTrip.currency));
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSave = () => {
    if (!draft.name.trim() && !draft.city.trim() && !draft.country.trim()) {
      setFeedback('Name, city, or country is required.');
      return;
    }
    upsertDestination({
      ...draft,
      name: draft.name.trim() || draft.city.trim() || draft.country.trim() || 'Destination',
    });
    setDraft(createDestination(activeVaultTrip.currency));
    setFeedback('Destination profile saved.');
  };

  return (
    <Panel
      title="Destination profiles"
      description="Country guides with entry, safety, emergency, customs, and practical notes. Mark saved offline for quick access without connectivity."
    >
      {feedback ? <StatusBanner kind="info" message={feedback} /> : null}
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <Field label="Name" htmlFor="dest-name">
          <input id="dest-name" className={inputClassName} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        </Field>
        <Field label="Country" htmlFor="dest-country">
          <input id="dest-country" className={inputClassName} value={draft.country} onChange={(e) => setDraft({ ...draft, country: e.target.value })} />
        </Field>
        <Field label="City" htmlFor="dest-city">
          <input id="dest-city" className={inputClassName} value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} />
        </Field>
        <Field label="Region" htmlFor="dest-region">
          <input id="dest-region" className={inputClassName} value={draft.region} onChange={(e) => setDraft({ ...draft, region: e.target.value })} />
        </Field>
        <Field label="Language" htmlFor="dest-language">
          <input id="dest-language" className={inputClassName} value={draft.language} onChange={(e) => setDraft({ ...draft, language: e.target.value })} />
        </Field>
        <Field label="Currency" htmlFor="dest-currency">
          <input id="dest-currency" className={inputClassName} value={draft.currency} onChange={(e) => setDraft({ ...draft, currency: e.target.value.toUpperCase() })} />
        </Field>
        <Field label="Timezone" htmlFor="dest-timezone">
          <input id="dest-timezone" className={inputClassName} value={draft.timezone} onChange={(e) => setDraft({ ...draft, timezone: e.target.value })} />
        </Field>
        <Field label="Saved offline" htmlFor="dest-offline">
          <label className="flex items-center gap-2 text-sm text-slate-200">
            <input
              id="dest-offline"
              type="checkbox"
              checked={draft.savedOffline}
              onChange={(e) => setDraft({ ...draft, savedOffline: e.target.checked })}
            />
            Keep available offline
          </label>
        </Field>
        <div className="md:col-span-2 xl:col-span-3">
          <Field label="Entry requirements" htmlFor="dest-entry">
            <textarea id="dest-entry" rows={2} className={inputClassName} value={draft.entryRequirements} onChange={(e) => setDraft({ ...draft, entryRequirements: e.target.value })} />
          </Field>
        </div>
        <div className="md:col-span-2 xl:col-span-3">
          <Field label="Safety notes" htmlFor="dest-safety">
            <textarea id="dest-safety" rows={2} className={inputClassName} value={draft.safetyNotes} onChange={(e) => setDraft({ ...draft, safetyNotes: e.target.value })} />
          </Field>
        </div>
        <div className="md:col-span-2 xl:col-span-3">
          <Field label="Emergency info" htmlFor="dest-emergency">
            <textarea id="dest-emergency" rows={2} className={inputClassName} value={draft.emergencyInfo} onChange={(e) => setDraft({ ...draft, emergencyInfo: e.target.value })} />
          </Field>
        </div>
        <div className="md:col-span-2 xl:col-span-3">
          <Field label="Customs notes" htmlFor="dest-customs">
            <textarea id="dest-customs" rows={2} className={inputClassName} value={draft.customsNotes} onChange={(e) => setDraft({ ...draft, customsNotes: e.target.value })} />
          </Field>
        </div>
        <div className="md:col-span-2 xl:col-span-3">
          <Field label="Practical notes" htmlFor="dest-practical">
            <textarea id="dest-practical" rows={2} className={inputClassName} value={draft.practicalNotes} onChange={(e) => setDraft({ ...draft, practicalNotes: e.target.value })} />
          </Field>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <PrimaryButton type="button" disabled={!canEditTrip} onClick={handleSave}>
          Save destination
        </PrimaryButton>
        <SecondaryButton type="button" onClick={() => setDraft(createDestination(activeVaultTrip.currency))}>
          Reset form
        </SecondaryButton>
      </div>

      <div className="mt-6 space-y-3">
        {destinations.length === 0 ? (
          <EmptyState title="No destinations yet" body="Add destination profiles with visa, safety, and practical notes for each stop." />
        ) : (
          destinations.map((destination) => (
            <article key={destination.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-white">{destination.name}</p>
                  <p className="mt-1 text-sm text-slate-300">
                    {[destination.city, destination.region, destination.country].filter(Boolean).join(', ') || 'Location n/a'}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-sky-300">
                    {destination.language || 'Language n/a'} · {destination.currency} · {destination.timezone}
                    {destination.savedOffline ? ' · Offline' : ''}
                  </p>
                  {destination.entryRequirements ? <p className="mt-2 text-sm text-slate-400">Entry: {destination.entryRequirements}</p> : null}
                  {destination.safetyNotes ? <p className="mt-1 text-sm text-slate-400">Safety: {destination.safetyNotes}</p> : null}
                </div>
                <div className="flex gap-2">
                  <SecondaryButton type="button" onClick={() => setDraft(destination)}>
                    Edit
                  </SecondaryButton>
                  <SecondaryButton type="button" disabled={!canEditTrip} onClick={() => deleteDestination(destination.id)}>
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
