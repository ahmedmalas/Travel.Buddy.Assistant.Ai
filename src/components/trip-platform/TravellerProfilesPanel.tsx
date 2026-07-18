import { useState } from 'react';
import type { Traveller } from '../../store/tripDomain';
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

const createTraveller = (): Traveller => ({
  id: crypto.randomUUID(),
  name: '',
  dateOfBirth: '',
  nationality: '',
  dietaryRequirements: '',
  accessibilityNeeds: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  loyaltyPrograms: '',
  passportNumberLast4: '',
  passportExpiry: '',
  passportCountry: '',
});

export function TravellerProfilesPanel() {
  const { trip, upsertTraveller, deleteTraveller } = useSharedTripStore();
  const [draft, setDraft] = useState<Traveller>(createTraveller());
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSave = () => {
    if (!draft.name.trim()) {
      setFeedback('Traveller name is required.');
      return;
    }
    upsertTraveller({
      ...draft,
      passportNumberLast4: draft.passportNumberLast4.replace(/\D/g, '').slice(-4),
    });
    setDraft(createTraveller());
    setFeedback('Traveller profile saved. Passport fields store metadata only — no scans or full numbers.');
  };

  return (
    <Panel
      title="Traveller profiles"
      description="Store traveller preferences and passport metadata fields only. Do not upload passport scans or highly sensitive documents."
    >
      {feedback ? <StatusBanner kind="info" message={feedback} /> : null}
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <Field label="Name" htmlFor="traveller-name">
          <input id="traveller-name" className={inputClassName} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        </Field>
        <Field label="Date of birth" htmlFor="traveller-dob">
          <input id="traveller-dob" type="date" className={inputClassName} value={draft.dateOfBirth} onChange={(e) => setDraft({ ...draft, dateOfBirth: e.target.value })} />
        </Field>
        <Field label="Nationality" htmlFor="traveller-nationality">
          <input id="traveller-nationality" className={inputClassName} value={draft.nationality} onChange={(e) => setDraft({ ...draft, nationality: e.target.value })} />
        </Field>
        <Field label="Dietary requirements" htmlFor="traveller-diet">
          <input id="traveller-diet" className={inputClassName} value={draft.dietaryRequirements} onChange={(e) => setDraft({ ...draft, dietaryRequirements: e.target.value })} />
        </Field>
        <Field label="Accessibility needs" htmlFor="traveller-access">
          <input id="traveller-access" className={inputClassName} value={draft.accessibilityNeeds} onChange={(e) => setDraft({ ...draft, accessibilityNeeds: e.target.value })} />
        </Field>
        <Field label="Loyalty programs" htmlFor="traveller-loyalty">
          <input id="traveller-loyalty" className={inputClassName} value={draft.loyaltyPrograms} onChange={(e) => setDraft({ ...draft, loyaltyPrograms: e.target.value })} />
        </Field>
        <Field label="Emergency contact name" htmlFor="traveller-emergency-name">
          <input id="traveller-emergency-name" className={inputClassName} value={draft.emergencyContactName} onChange={(e) => setDraft({ ...draft, emergencyContactName: e.target.value })} />
        </Field>
        <Field label="Emergency contact phone" htmlFor="traveller-emergency-phone">
          <input id="traveller-emergency-phone" className={inputClassName} value={draft.emergencyContactPhone} onChange={(e) => setDraft({ ...draft, emergencyContactPhone: e.target.value })} />
        </Field>
        <Field label="Passport last 4 (metadata only)" htmlFor="traveller-passport-last4">
          <input
            id="traveller-passport-last4"
            className={inputClassName}
            maxLength={4}
            value={draft.passportNumberLast4}
            onChange={(e) => setDraft({ ...draft, passportNumberLast4: e.target.value.replace(/\D/g, '').slice(-4) })}
          />
        </Field>
        <Field label="Passport expiry" htmlFor="traveller-passport-expiry">
          <input id="traveller-passport-expiry" type="date" className={inputClassName} value={draft.passportExpiry} onChange={(e) => setDraft({ ...draft, passportExpiry: e.target.value })} />
        </Field>
        <Field label="Passport country" htmlFor="traveller-passport-country">
          <input id="traveller-passport-country" className={inputClassName} value={draft.passportCountry} onChange={(e) => setDraft({ ...draft, passportCountry: e.target.value })} />
        </Field>
      </div>
      <div className="mt-3 flex gap-2">
        <PrimaryButton type="button" onClick={handleSave}>Save traveller</PrimaryButton>
        <SecondaryButton type="button" onClick={() => setDraft(createTraveller())}>Reset form</SecondaryButton>
      </div>

      <div className="mt-6 space-y-3">
        {trip.travellers.length === 0 ? (
          <EmptyState title="No travellers yet" body="Add profiles for people on this trip." />
        ) : (
          trip.travellers.map((traveller) => (
            <article key={traveller.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="text-sm text-slate-300">
                  <p className="text-base font-medium text-white">{traveller.name}</p>
                  <p className="mt-1">DOB {traveller.dateOfBirth || '—'} · {traveller.nationality || 'Nationality n/a'}</p>
                  <p className="mt-1">Diet: {traveller.dietaryRequirements || 'None listed'}</p>
                  <p className="mt-1">Accessibility: {traveller.accessibilityNeeds || 'None listed'}</p>
                  <p className="mt-1">
                    Emergency: {traveller.emergencyContactName || '—'} {traveller.emergencyContactPhone}
                  </p>
                  <p className="mt-1">Loyalty: {traveller.loyaltyPrograms || '—'}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Passport metadata: ****{traveller.passportNumberLast4 || '----'} · {traveller.passportCountry || '—'} · exp {traveller.passportExpiry || '—'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <SecondaryButton type="button" onClick={() => setDraft(traveller)}>Edit</SecondaryButton>
                  <SecondaryButton type="button" onClick={() => deleteTraveller(traveller.id)}>Delete</SecondaryButton>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </Panel>
  );
}
