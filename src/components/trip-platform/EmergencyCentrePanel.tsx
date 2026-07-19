import { useState } from 'react';
import { useSharedTripStore } from '../../store/TripStoreContext';
import {
  createEmptyEmergencyCentre,
  type EmergencyContact,
  type EmbassyRecord,
  type InsuranceContact,
  type MedicalInfo,
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

const createContact = (): EmergencyContact => ({
  id: crypto.randomUUID(),
  name: '',
  relationship: '',
  phone: '',
  email: '',
  notes: '',
});

const createEmbassy = (): EmbassyRecord => ({
  id: crypto.randomUUID(),
  country: '',
  name: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
});

const createInsurance = (): InsuranceContact => ({
  id: crypto.randomUUID(),
  provider: '',
  policyNumber: '',
  phone: '',
  email: '',
  notes: '',
});

export function EmergencyCentrePanel() {
  const {
    activeVaultTrip,
    updateEmergencyCentre,
    startLostPassportWorkflow,
    startLostLuggageWorkflow,
    canEditTrip,
  } = useSharedTripStore();
  const emergency = activeVaultTrip.emergency ?? createEmptyEmergencyCentre();
  const [contactDraft, setContactDraft] = useState<EmergencyContact>(createContact());
  const [embassyDraft, setEmbassyDraft] = useState<EmbassyRecord>(createEmbassy());
  const [insuranceDraft, setInsuranceDraft] = useState<InsuranceContact>(createInsurance());
  const [medicalDraft, setMedicalDraft] = useState<MedicalInfo>(emergency.medical);
  const [centreNotes, setCentreNotes] = useState(emergency.notes);
  const [feedback, setFeedback] = useState<string | null>(null);

  const saveMedical = () => {
    updateEmergencyCentre({ ...emergency, medical: medicalDraft, notes: centreNotes });
    setFeedback('Medical info saved.');
  };

  const saveContact = () => {
    if (!contactDraft.name.trim()) {
      setFeedback('Contact name is required.');
      return;
    }
    const existing = emergency.contacts.find((item) => item.id === contactDraft.id);
    const contacts = existing
      ? emergency.contacts.map((item) => (item.id === contactDraft.id ? contactDraft : item))
      : [...emergency.contacts, contactDraft];
    updateEmergencyCentre({ ...emergency, contacts, notes: centreNotes });
    setContactDraft(createContact());
    setFeedback('Emergency contact saved.');
  };

  const saveEmbassy = () => {
    if (!embassyDraft.name.trim()) {
      setFeedback('Embassy name is required.');
      return;
    }
    const existing = emergency.embassies.find((item) => item.id === embassyDraft.id);
    const embassies = existing
      ? emergency.embassies.map((item) => (item.id === embassyDraft.id ? embassyDraft : item))
      : [...emergency.embassies, embassyDraft];
    updateEmergencyCentre({ ...emergency, embassies, notes: centreNotes });
    setEmbassyDraft(createEmbassy());
    setFeedback('Embassy record saved.');
  };

  const saveInsurance = () => {
    if (!insuranceDraft.provider.trim()) {
      setFeedback('Insurance provider is required.');
      return;
    }
    const existing = emergency.insurance.find((item) => item.id === insuranceDraft.id);
    const insurance = existing
      ? emergency.insurance.map((item) => (item.id === insuranceDraft.id ? insuranceDraft : item))
      : [...emergency.insurance, insuranceDraft];
    updateEmergencyCentre({ ...emergency, insurance, notes: centreNotes });
    setInsuranceDraft(createInsurance());
    setFeedback('Insurance contact saved.');
  };

  const removeFromList = <T extends { id: string }>(list: T[], id: string) => list.filter((item) => item.id !== id);

  return (
    <Panel
      title="Emergency centre"
      description="Contacts, embassies, insurance, and medical details stored on the active trip — accessible offline once saved locally."
    >
      {feedback ? <StatusBanner kind="info" message={feedback} /> : null}

      <div className="mt-2 flex flex-wrap gap-2">
        <PrimaryButton
          type="button"
          disabled={!canEditTrip}
          onClick={() => {
            startLostPassportWorkflow();
            setFeedback('Lost passport workflow started.');
          }}
        >
          Start lost passport
        </PrimaryButton>
        <PrimaryButton
          type="button"
          disabled={!canEditTrip}
          onClick={() => {
            startLostLuggageWorkflow();
            setFeedback('Lost luggage workflow started.');
          }}
        >
          Start lost luggage
        </PrimaryButton>
      </div>

      <h4 className="mt-6 text-sm font-semibold uppercase tracking-[0.16em] text-sky-200">Medical</h4>
      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <Field label="Blood type" htmlFor="med-blood">
          <input id="med-blood" className={inputClassName} value={medicalDraft.bloodType} onChange={(e) => setMedicalDraft({ ...medicalDraft, bloodType: e.target.value })} />
        </Field>
        <Field label="Allergies" htmlFor="med-allergies">
          <input id="med-allergies" className={inputClassName} value={medicalDraft.allergies} onChange={(e) => setMedicalDraft({ ...medicalDraft, allergies: e.target.value })} />
        </Field>
        <Field label="Medications" htmlFor="med-meds">
          <input id="med-meds" className={inputClassName} value={medicalDraft.medications} onChange={(e) => setMedicalDraft({ ...medicalDraft, medications: e.target.value })} />
        </Field>
        <Field label="Conditions" htmlFor="med-conditions">
          <input id="med-conditions" className={inputClassName} value={medicalDraft.conditions} onChange={(e) => setMedicalDraft({ ...medicalDraft, conditions: e.target.value })} />
        </Field>
        <div className="md:col-span-2 xl:col-span-3">
          <Field label="Medical notes" htmlFor="med-notes">
            <textarea id="med-notes" rows={2} className={inputClassName} value={medicalDraft.notes} onChange={(e) => setMedicalDraft({ ...medicalDraft, notes: e.target.value })} />
          </Field>
        </div>
      </div>
      <PrimaryButton type="button" className="mt-3" disabled={!canEditTrip} onClick={saveMedical}>
        Save medical info
      </PrimaryButton>

      <h4 className="mt-8 text-sm font-semibold uppercase tracking-[0.16em] text-sky-200">Emergency contacts</h4>
      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <Field label="Name" htmlFor="ec-name">
          <input id="ec-name" className={inputClassName} value={contactDraft.name} onChange={(e) => setContactDraft({ ...contactDraft, name: e.target.value })} />
        </Field>
        <Field label="Relationship" htmlFor="ec-rel">
          <input id="ec-rel" className={inputClassName} value={contactDraft.relationship} onChange={(e) => setContactDraft({ ...contactDraft, relationship: e.target.value })} />
        </Field>
        <Field label="Phone" htmlFor="ec-phone">
          <input id="ec-phone" className={inputClassName} value={contactDraft.phone} onChange={(e) => setContactDraft({ ...contactDraft, phone: e.target.value })} />
        </Field>
        <Field label="Email" htmlFor="ec-email">
          <input id="ec-email" className={inputClassName} value={contactDraft.email} onChange={(e) => setContactDraft({ ...contactDraft, email: e.target.value })} />
        </Field>
      </div>
      <PrimaryButton type="button" className="mt-3" disabled={!canEditTrip} onClick={saveContact}>
        Save contact
      </PrimaryButton>
      <div className="mt-3 space-y-2">
        {emergency.contacts.length === 0 ? (
          <EmptyState title="No emergency contacts" body="Add family or friends to reach in an emergency." />
        ) : (
          emergency.contacts.map((contact) => (
            <article key={contact.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-slate-950/30 px-3 py-2 text-sm text-slate-200">
              <span>
                {contact.name} · {contact.phone || 'No phone'}
              </span>
              <div className="flex gap-2">
                <SecondaryButton type="button" onClick={() => setContactDraft(contact)}>
                  Edit
                </SecondaryButton>
                <SecondaryButton
                  type="button"
                  disabled={!canEditTrip}
                  onClick={() => updateEmergencyCentre({ ...emergency, contacts: removeFromList(emergency.contacts, contact.id) })}
                >
                  Delete
                </SecondaryButton>
              </div>
            </article>
          ))
        )}
      </div>

      <h4 className="mt-8 text-sm font-semibold uppercase tracking-[0.16em] text-sky-200">Embassies</h4>
      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <Field label="Country" htmlFor="emb-country">
          <input id="emb-country" className={inputClassName} value={embassyDraft.country} onChange={(e) => setEmbassyDraft({ ...embassyDraft, country: e.target.value })} />
        </Field>
        <Field label="Name" htmlFor="emb-name">
          <input id="emb-name" className={inputClassName} value={embassyDraft.name} onChange={(e) => setEmbassyDraft({ ...embassyDraft, name: e.target.value })} />
        </Field>
        <Field label="Phone" htmlFor="emb-phone">
          <input id="emb-phone" className={inputClassName} value={embassyDraft.phone} onChange={(e) => setEmbassyDraft({ ...embassyDraft, phone: e.target.value })} />
        </Field>
        <Field label="Email" htmlFor="emb-email">
          <input id="emb-email" className={inputClassName} value={embassyDraft.email} onChange={(e) => setEmbassyDraft({ ...embassyDraft, email: e.target.value })} />
        </Field>
        <div className="md:col-span-2 xl:col-span-3">
          <Field label="Address" htmlFor="emb-address">
            <input id="emb-address" className={inputClassName} value={embassyDraft.address} onChange={(e) => setEmbassyDraft({ ...embassyDraft, address: e.target.value })} />
          </Field>
        </div>
      </div>
      <PrimaryButton type="button" className="mt-3" disabled={!canEditTrip} onClick={saveEmbassy}>
        Save embassy
      </PrimaryButton>
      <div className="mt-3 space-y-2">
        {emergency.embassies.length === 0 ? (
          <EmptyState title="No embassies listed" body="Add embassy or consulate details for your nationality." />
        ) : (
          emergency.embassies.map((embassy) => (
            <article key={embassy.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-slate-950/30 px-3 py-2 text-sm text-slate-200">
              <span>
                {embassy.name} ({embassy.country}) · {embassy.phone || 'No phone'}
              </span>
              <div className="flex gap-2">
                <SecondaryButton type="button" onClick={() => setEmbassyDraft(embassy)}>
                  Edit
                </SecondaryButton>
                <SecondaryButton
                  type="button"
                  disabled={!canEditTrip}
                  onClick={() => updateEmergencyCentre({ ...emergency, embassies: removeFromList(emergency.embassies, embassy.id) })}
                >
                  Delete
                </SecondaryButton>
              </div>
            </article>
          ))
        )}
      </div>

      <h4 className="mt-8 text-sm font-semibold uppercase tracking-[0.16em] text-sky-200">Insurance</h4>
      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <Field label="Provider" htmlFor="ins-provider">
          <input id="ins-provider" className={inputClassName} value={insuranceDraft.provider} onChange={(e) => setInsuranceDraft({ ...insuranceDraft, provider: e.target.value })} />
        </Field>
        <Field label="Policy number" htmlFor="ins-policy">
          <input id="ins-policy" className={inputClassName} value={insuranceDraft.policyNumber} onChange={(e) => setInsuranceDraft({ ...insuranceDraft, policyNumber: e.target.value })} />
        </Field>
        <Field label="Phone" htmlFor="ins-phone">
          <input id="ins-phone" className={inputClassName} value={insuranceDraft.phone} onChange={(e) => setInsuranceDraft({ ...insuranceDraft, phone: e.target.value })} />
        </Field>
        <Field label="Email" htmlFor="ins-email">
          <input id="ins-email" className={inputClassName} value={insuranceDraft.email} onChange={(e) => setInsuranceDraft({ ...insuranceDraft, email: e.target.value })} />
        </Field>
      </div>
      <PrimaryButton type="button" className="mt-3" disabled={!canEditTrip} onClick={saveInsurance}>
        Save insurance
      </PrimaryButton>
      <div className="mt-3 space-y-2">
        {emergency.insurance.length === 0 ? (
          <EmptyState title="No insurance contacts" body="Add travel insurance provider details and policy numbers." />
        ) : (
          emergency.insurance.map((item) => (
            <article key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-slate-950/30 px-3 py-2 text-sm text-slate-200">
              <span>
                {item.provider} · Policy {item.policyNumber || '—'}
              </span>
              <div className="flex gap-2">
                <SecondaryButton type="button" onClick={() => setInsuranceDraft(item)}>
                  Edit
                </SecondaryButton>
                <SecondaryButton
                  type="button"
                  disabled={!canEditTrip}
                  onClick={() => updateEmergencyCentre({ ...emergency, insurance: removeFromList(emergency.insurance, item.id) })}
                >
                  Delete
                </SecondaryButton>
              </div>
            </article>
          ))
        )}
      </div>

      <h4 className="mt-8 text-sm font-semibold uppercase tracking-[0.16em] text-sky-200">Active workflows</h4>
      <div className="mt-3 space-y-3">
        {emergency.workflows.length === 0 ? (
          <EmptyState title="No workflows" body="Start a lost passport or luggage workflow when you need step-by-step guidance." />
        ) : (
          emergency.workflows.map((workflow) => (
            <article key={workflow.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-white">{workflow.title}</p>
                  <StatusBadge label={workflow.status} tone={workflow.status === 'resolved' ? 'success' : 'warning'} />
                  <pre className="mt-2 whitespace-pre-wrap text-sm text-slate-300">{workflow.steps}</pre>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      <div className="mt-6">
        <Field label="Centre notes" htmlFor="emergency-notes">
          <textarea
            id="emergency-notes"
            rows={2}
            className={inputClassName}
            value={centreNotes}
            onChange={(e) => setCentreNotes(e.target.value)}
          />
        </Field>
        <PrimaryButton
          type="button"
          className="mt-3"
          disabled={!canEditTrip}
          onClick={() => {
            updateEmergencyCentre({ ...emergency, notes: centreNotes });
            setFeedback('Centre notes saved.');
          }}
        >
          Save centre notes
        </PrimaryButton>
      </div>
    </Panel>
  );
}
