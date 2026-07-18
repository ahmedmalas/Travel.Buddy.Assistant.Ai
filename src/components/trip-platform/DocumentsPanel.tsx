import { useState } from 'react';
import { useSharedTripStore } from '../../store/TripStoreContext';
import { DOCUMENT_TYPES, type TripDocument, type TripDocumentType } from '../../store/vaultDomain';
import { EmptyState, Field, Panel, PrimaryButton, SecondaryButton, StatusBanner, inputClassName } from './shared/ui';

const createDocument = (): TripDocument => ({
  id: crypto.randomUUID(),
  type: 'passport',
  title: '',
  holderName: '',
  documentNumberLast4: '',
  issuingCountry: '',
  issueDate: '',
  expiryDate: '',
  notes: '',
  attachmentName: '',
  attachmentMimeType: '',
});

export function DocumentsPanel() {
  const { activeVaultTrip, upsertDocument, deleteDocument, documentExpiryReminders } = useSharedTripStore();
  const [draft, setDraft] = useState<TripDocument>(createDocument());
  const [feedback, setFeedback] = useState<string | null>(null);

  return (
    <Panel
      title="Travel documents"
      description="Store passport, visa, insurance, and ticket metadata only — attachment placeholders, no file uploads."
    >
      {feedback ? <StatusBanner kind="info" message={feedback} /> : null}

      {documentExpiryReminders.length > 0 ? (
        <div className="mt-3 space-y-2">
          {documentExpiryReminders.slice(0, 5).map((reminder) => (
            <StatusBanner
              key={`${reminder.tripId}-${reminder.documentId}`}
              kind={reminder.severity === 'expired' ? 'error' : 'info'}
              message={`${reminder.tripName}: ${reminder.title} ${
                reminder.daysUntilExpiry < 0
                  ? `expired ${Math.abs(reminder.daysUntilExpiry)} day(s) ago`
                  : `expires in ${reminder.daysUntilExpiry} day(s)`
              }`}
            />
          ))}
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <Field label="Title" htmlFor="doc-title">
          <input id="doc-title" className={inputClassName} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
        </Field>
        <Field label="Type" htmlFor="doc-type">
          <select
            id="doc-type"
            className={inputClassName}
            value={draft.type}
            onChange={(e) => setDraft({ ...draft, type: e.target.value as TripDocumentType })}
          >
            {DOCUMENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Holder name" htmlFor="doc-holder">
          <input id="doc-holder" className={inputClassName} value={draft.holderName} onChange={(e) => setDraft({ ...draft, holderName: e.target.value })} />
        </Field>
        <Field label="Number last 4" htmlFor="doc-last4">
          <input
            id="doc-last4"
            className={inputClassName}
            value={draft.documentNumberLast4}
            onChange={(e) => setDraft({ ...draft, documentNumberLast4: e.target.value })}
          />
        </Field>
        <Field label="Issuing country" htmlFor="doc-country">
          <input
            id="doc-country"
            className={inputClassName}
            value={draft.issuingCountry}
            onChange={(e) => setDraft({ ...draft, issuingCountry: e.target.value })}
          />
        </Field>
        <Field label="Issue date" htmlFor="doc-issue">
          <input id="doc-issue" type="date" className={inputClassName} value={draft.issueDate} onChange={(e) => setDraft({ ...draft, issueDate: e.target.value })} />
        </Field>
        <Field label="Expiry date" htmlFor="doc-expiry">
          <input id="doc-expiry" type="date" className={inputClassName} value={draft.expiryDate} onChange={(e) => setDraft({ ...draft, expiryDate: e.target.value })} />
        </Field>
        <Field label="Attachment name (placeholder)" htmlFor="doc-attachment">
          <input
            id="doc-attachment"
            className={inputClassName}
            value={draft.attachmentName}
            onChange={(e) => setDraft({ ...draft, attachmentName: e.target.value })}
          />
        </Field>
        <Field label="Attachment MIME type" htmlFor="doc-mime">
          <input
            id="doc-mime"
            className={inputClassName}
            value={draft.attachmentMimeType}
            onChange={(e) => setDraft({ ...draft, attachmentMimeType: e.target.value })}
          />
        </Field>
        <div className="md:col-span-2 xl:col-span-3">
          <Field label="Notes" htmlFor="doc-notes">
            <textarea id="doc-notes" rows={2} className={inputClassName} value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
          </Field>
        </div>
      </div>
      <div className="mt-3">
        <PrimaryButton
          type="button"
          onClick={() => {
            if (!draft.title.trim()) {
              setFeedback('Document title is required.');
              return;
            }
            upsertDocument(draft);
            setDraft(createDocument());
            setFeedback('Document metadata saved.');
          }}
        >
          Save document
        </PrimaryButton>
      </div>

      <div className="mt-6 space-y-3">
        {activeVaultTrip.documents.length === 0 ? (
          <EmptyState title="No documents yet" body="Add passport/visa/insurance metadata for expiry reminders." />
        ) : (
          activeVaultTrip.documents.map((document) => (
            <article key={document.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="text-sm text-slate-300">
                  <p className="text-base font-medium text-white">{document.title}</p>
                  <p className="mt-1 uppercase tracking-[0.18em] text-sky-300">{document.type}</p>
                  <p className="mt-1">
                    {document.holderName || 'No holder'} · ****{document.documentNumberLast4 || '----'} ·{' '}
                    {document.issuingCountry || 'Country n/a'}
                  </p>
                  <p className="mt-1">
                    Expires {document.expiryDate || 'n/a'}
                    {document.attachmentName ? ` · Attachment placeholder: ${document.attachmentName}` : ''}
                  </p>
                </div>
                <div className="flex gap-2">
                  <SecondaryButton type="button" onClick={() => setDraft(document)}>
                    Edit
                  </SecondaryButton>
                  <SecondaryButton type="button" onClick={() => deleteDocument(document.id)}>
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
